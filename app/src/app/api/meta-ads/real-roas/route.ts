import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

/**
 * API: ROAS Real — Cruza vendas reais (Ticto) com gasto Meta Ads
 *
 * Retorna:
 * - ROAS Meta (atribuição Meta)
 * - ROAS Real (vendas confirmadas Ticto)
 * - Divergência entre os dois
 * - Breakdown por dia, campanha, UTM
 */

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const breakdown = params.get('breakdown') || 'daily'

  const supabase = getServiceSupabase()

  let startStr = params.get('startDate') || ''
  let endStr = params.get('endDate') || ''

  if (!startStr) {
    const period = params.get('period') || '7d'
    const now = new Date()
    const sd = new Date()
    switch (period) {
      case 'today': sd.setHours(0, 0, 0, 0); break
      case 'yesterday': sd.setDate(now.getDate() - 1); sd.setHours(0, 0, 0, 0); break
      case '3d': sd.setDate(now.getDate() - 3); break
      case '7d': sd.setDate(now.getDate() - 7); break
      case '14d': sd.setDate(now.getDate() - 14); break
      case '30d': sd.setDate(now.getDate() - 30); break
      case 'this_month': sd.setDate(1); sd.setHours(0, 0, 0, 0); break
      default: sd.setDate(now.getDate() - 7)
    }
    startStr = sd.toISOString().split('T')[0]
  }

  const startDate = new Date(startStr + 'T00:00:00')
  const endDate = endStr ? new Date(endStr + 'T23:59:59') : new Date()

  // 1. Buscar gasto Meta Ads (por dia)
  let metaQuery = supabase.from('meta_ads_account_insights').select('date, spend, purchases, revenue, roas').gte('date', startStr)
  if (endStr) metaQuery = metaQuery.lte('date', endStr)
  const { data: metaData, error: metaError } = await metaQuery.order('date', { ascending: true })

  if (metaError) return NextResponse.json({ error: metaError.message }, { status: 500 })

  // 2. Buscar vendas reais Ticto (authorized = venda confirmada)
  let tictoQuery = supabase.from('ticto_sales').select('*').eq('status', 'authorized').gte('status_date', startDate.toISOString())
  if (endStr) tictoQuery = tictoQuery.lte('status_date', endDate.toISOString())
  const { data: tictoData, error: tictoError } = await tictoQuery.order('status_date', { ascending: true })

  if (tictoError) return NextResponse.json({ error: tictoError.message }, { status: 500 })

  // 3. Buscar reembolsos
  let refundQuery = supabase.from('ticto_sales').select('*').in('status', ['refunded', 'chargeback']).gte('status_date', startDate.toISOString())
  if (endStr) refundQuery = refundQuery.lte('status_date', endDate.toISOString())
  const { data: refundData } = await refundQuery

  const refunds = refundData || []

  // 4. Calcular totais
  const metaTotals = (metaData || []).reduce(
    (acc, row) => ({
      spend: acc.spend + Number(row.spend),
      purchases_meta: acc.purchases_meta + Number(row.purchases),
      revenue_meta: acc.revenue_meta + Number(row.revenue),
    }),
    { spend: 0, purchases_meta: 0, revenue_meta: 0 }
  )

  const sales = tictoData || []
  const totalRealRevenue = sales.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0)
  const totalRefunds = refunds.reduce((sum, r) => sum + Number(r.paid_amount || 0), 0)
  const netRevenue = totalRealRevenue - totalRefunds

  const roasMeta = metaTotals.spend > 0 ? metaTotals.revenue_meta / metaTotals.spend : 0
  const roasReal = metaTotals.spend > 0 ? netRevenue / metaTotals.spend : 0

  const totals = {
    spend: metaTotals.spend,
    purchases_meta: metaTotals.purchases_meta,
    revenue_meta: metaTotals.revenue_meta,
    roas_meta: Number(roasMeta.toFixed(4)),
    purchases_real: sales.length,
    revenue_real: totalRealRevenue,
    refunds: refunds.length,
    refund_amount: totalRefunds,
    net_revenue: netRevenue,
    roas_real: Number(roasReal.toFixed(4)),
    divergence: metaTotals.purchases_meta > 0
      ? Number(((sales.length - metaTotals.purchases_meta) / metaTotals.purchases_meta * 100).toFixed(1))
      : 0,
    cpa_meta: metaTotals.purchases_meta > 0 ? Number((metaTotals.spend / metaTotals.purchases_meta).toFixed(2)) : 0,
    cpa_real: sales.length > 0 ? Number((metaTotals.spend / sales.length).toFixed(2)) : 0,
    ticket_medio: sales.length > 0 ? Number((totalRealRevenue / sales.length).toFixed(2)) : 0,
    refund_rate: sales.length > 0 ? Number((refunds.length / sales.length * 100).toFixed(1)) : 0,
  }

  // 5. Breakdown diário (cruzando Meta x Ticto por dia)
  let daily: Record<string, unknown>[] = []
  if (breakdown === 'daily') {
    const salesByDate: Record<string, { count: number; revenue: number }> = {}
    for (const s of sales) {
      const date = s.status_date ? new Date(s.status_date).toISOString().split('T')[0] : ''
      if (!date) continue
      if (!salesByDate[date]) salesByDate[date] = { count: 0, revenue: 0 }
      salesByDate[date].count++
      salesByDate[date].revenue += Number(s.paid_amount || 0)
    }

    daily = (metaData || []).map(row => {
      const tictoDay = salesByDate[row.date] || { count: 0, revenue: 0 }
      const spend = Number(row.spend)
      return {
        date: row.date,
        spend,
        purchases_meta: Number(row.purchases),
        revenue_meta: Number(row.revenue),
        roas_meta: Number(row.roas),
        purchases_real: tictoDay.count,
        revenue_real: tictoDay.revenue,
        roas_real: spend > 0 ? Number((tictoDay.revenue / spend).toFixed(4)) : 0,
      }
    })
  }

  // 6. Breakdown por UTM (de onde vieram as vendas reais)
  let byUtm: Record<string, unknown>[] = []
  if (breakdown === 'utm') {
    const utmMap: Record<string, { count: number; revenue: number; source: string; campaign: string; medium: string }> = {}
    for (const s of sales) {
      const key = `${s.utm_source || 'direto'}|${s.utm_campaign || 'sem_campanha'}`
      if (!utmMap[key]) utmMap[key] = { count: 0, revenue: 0, source: s.utm_source || 'direto', campaign: s.utm_campaign || 'sem_campanha', medium: s.utm_medium || '' }
      utmMap[key].count++
      utmMap[key].revenue += Number(s.paid_amount || 0)
    }
    byUtm = Object.values(utmMap).sort((a, b) => b.revenue - a.revenue)
  }

  // 7. Métodos de pagamento
  const paymentMethods: Record<string, number> = {}
  for (const s of sales) {
    const method = s.payment_method || 'unknown'
    paymentMethods[method] = (paymentMethods[method] || 0) + 1
  }

  return NextResponse.json({
    totals,
    daily: breakdown === 'daily' ? daily : undefined,
    by_utm: breakdown === 'utm' ? byUtm : undefined,
    payment_methods: paymentMethods,
    startDate: startStr,
    endDate: endStr || null,
    last_sale: sales.length > 0 ? sales[sales.length - 1].status_date : null,
  })
}
