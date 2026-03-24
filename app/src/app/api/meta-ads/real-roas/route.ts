import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const breakdown = params.get('breakdown') || 'daily'

  const supabase = getServiceSupabase()

  let startStr = params.get('startDate') || ''
  const endStr = params.get('endDate') || ''

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

  // 1. Meta Ads (por dia)
  let metaQuery = supabase.from('meta_ads_account_insights').select('date, spend, purchases, revenue, roas').gte('date', startStr)
  if (endStr) metaQuery = metaQuery.lte('date', endStr)
  const { data: metaData, error: metaError } = await metaQuery.order('date', { ascending: true })

  if (metaError) return NextResponse.json({ error: metaError.message }, { status: 500 })

  // 2. Todas as vendas Ticto (paginar pra pegar tudo)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allTicto: any[] = []
  let offset = 0
  const PAGE = 1000
  while (true) {
    let q = supabase.from('ticto_sales').select('*').eq('status', 'authorized').gte('status_date', startDate.toISOString())
    if (endStr) q = q.lte('status_date', endDate.toISOString())
    const { data, error } = await q.order('status_date', { ascending: true }).range(offset, offset + PAGE - 1)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data || data.length === 0) break
    allTicto.push(...data)
    if (data.length < PAGE) break
    offset += PAGE
  }

  // 3. Reembolsos (paginar também)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allRefunds: any[] = []
  offset = 0
  while (true) {
    let q = supabase.from('ticto_sales').select('*').in('status', ['refunded', 'chargeback']).gte('status_date', startDate.toISOString())
    if (endStr) q = q.lte('status_date', endDate.toISOString())
    const { data } = await q.range(offset, offset + PAGE - 1)
    if (!data || data.length === 0) break
    allRefunds.push(...data)
    if (data.length < PAGE) break
    offset += PAGE
  }

  // 4. Separar: produtos principais vs bumps/upsells/downsells
  const principais = allTicto.filter(s => !s.is_bump && !s.is_upsell && !s.is_downsell)
  const bumps = allTicto.filter(s => s.is_bump)
  const upsells = allTicto.filter(s => s.is_upsell)
  const downsells = allTicto.filter(s => s.is_downsell)

  // Pedidos únicos (pelo order_id dos principais)
  const uniqueOrders = new Set(principais.map(s => s.order_id))

  // Receita total por pedido (principal + bumps + upsells + downsells)
  const orderRevenue: Record<string, number> = {}
  for (const s of allTicto) {
    const oid = s.order_id || ''
    orderRevenue[oid] = (orderRevenue[oid] || 0) + Number(s.commission || s.paid_amount || 0)
  }

  // Receitas
  const revPrincipais = principais.reduce((s, r) => s + Number(r.commission || r.paid_amount || 0), 0)
  const revBumps = bumps.reduce((s, r) => s + Number(r.commission || r.paid_amount || 0), 0)
  const revUpsells = upsells.reduce((s, r) => s + Number(r.commission || r.paid_amount || 0), 0)
  const revDownsells = downsells.reduce((s, r) => s + Number(r.commission || r.paid_amount || 0), 0)
  const totalRealRevenue = revPrincipais + revBumps + revUpsells + revDownsells

  // Reembolsos por pedido único
  const refundOrders = new Set(allRefunds.filter(r => !r.is_bump).map(r => r.order_id))
  const totalRefundAmount = allRefunds.reduce((s, r) => s + Number(r.commission || r.paid_amount || 0), 0)

  const netRevenue = totalRealRevenue - totalRefundAmount

  // Ticket médio = receita total / pedidos únicos
  const avgOrderValue = uniqueOrders.size > 0
    ? Object.values(orderRevenue).reduce((a, b) => a + b, 0) / uniqueOrders.size : 0

  // Meta totais
  const metaTotals = (metaData || []).reduce(
    (acc, row) => ({
      spend: acc.spend + Number(row.spend),
      purchases_meta: acc.purchases_meta + Number(row.purchases),
      revenue_meta: acc.revenue_meta + Number(row.revenue),
    }),
    { spend: 0, purchases_meta: 0, revenue_meta: 0 }
  )

  const roasMeta = metaTotals.spend > 0 ? metaTotals.revenue_meta / metaTotals.spend : 0
  const roasReal = metaTotals.spend > 0 ? netRevenue / metaTotals.spend : 0
  const ordersCount = uniqueOrders.size
  const imposto = metaTotals.spend * 0.12

  const totals = {
    spend: metaTotals.spend,
    // Meta
    purchases_meta: metaTotals.purchases_meta,
    revenue_meta: metaTotals.revenue_meta,
    roas_meta: Number(roasMeta.toFixed(4)),
    cpa_meta: metaTotals.purchases_meta > 0 ? Number((metaTotals.spend / metaTotals.purchases_meta).toFixed(2)) : 0,
    // Real (Ticto)
    orders: ordersCount,
    revenue_principal: revPrincipais,
    revenue_bumps: revBumps,
    revenue_upsells: revUpsells,
    revenue_downsells: revDownsells,
    revenue_real: totalRealRevenue,
    bump_count: bumps.length,
    bump_rate: ordersCount > 0 ? Number((new Set(bumps.map(b => b.order_id)).size / ordersCount * 100).toFixed(1)) : 0,
    upsell_count: upsells.length,
    downsell_count: downsells.length,
    refunds: refundOrders.size,
    refund_amount: totalRefundAmount,
    refund_rate: ordersCount > 0 ? Number((refundOrders.size / ordersCount * 100).toFixed(1)) : 0,
    net_revenue: netRevenue,
    roas_real: Number(roasReal.toFixed(4)),
    cpa_real: ordersCount > 0 ? Number((metaTotals.spend / ordersCount).toFixed(2)) : 0,
    ticket_medio: Number(avgOrderValue.toFixed(2)),
    imposto,
    margem: netRevenue - metaTotals.spend - imposto,
    // Divergência: pedidos reais vs vendas Meta
    divergence: metaTotals.purchases_meta > 0
      ? Number(((ordersCount - metaTotals.purchases_meta) / metaTotals.purchases_meta * 100).toFixed(1))
      : 0,
  }

  // 5. Breakdown diário
  let daily: Record<string, unknown>[] = []
  if (breakdown === 'daily') {
    // Agrupar vendas por dia (só principais = pedidos)
    const salesByDate: Record<string, { orders: number; revenue: number; orderIds: Set<string> }> = {}
    for (const s of principais) {
      const date = s.status_date ? new Date(s.status_date).toISOString().split('T')[0] : ''
      if (!date) continue
      if (!salesByDate[date]) salesByDate[date] = { orders: 0, revenue: 0, orderIds: new Set() }
      if (!salesByDate[date].orderIds.has(s.order_id)) {
        salesByDate[date].orders++
        salesByDate[date].orderIds.add(s.order_id)
      }
      salesByDate[date].revenue += Number(s.commission || s.paid_amount || 0)
    }
    // Adicionar receita de bumps/upsells/downsells ao dia do pedido
    for (const s of [...bumps, ...upsells, ...downsells]) {
      const date = s.status_date ? new Date(s.status_date).toISOString().split('T')[0] : ''
      if (!date || !salesByDate[date]) continue
      salesByDate[date].revenue += Number(s.commission || s.paid_amount || 0)
    }

    daily = (metaData || []).map(row => {
      const tictoDay = salesByDate[row.date] || { orders: 0, revenue: 0 }
      const spend = Number(row.spend)
      return {
        date: row.date,
        spend,
        purchases_meta: Number(row.purchases),
        revenue_meta: Number(row.revenue),
        roas_meta: Number(row.roas),
        orders_real: tictoDay.orders,
        revenue_real: tictoDay.revenue,
        roas_real: spend > 0 ? Number((tictoDay.revenue / spend).toFixed(4)) : 0,
      }
    })
  }

  return NextResponse.json({
    totals,
    daily: breakdown === 'daily' ? daily : undefined,
  })
}
