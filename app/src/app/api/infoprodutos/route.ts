import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const view = params.get('view') || 'dashboard'

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

  // Paginar vendas aprovadas (Supabase default 1000 rows)
  const allSalesPages: Record<string, unknown>[][] = []
  let offset = 0
  const PAGE = 1000
  while (true) {
    let q = supabase.from('ticto_sales').select('*').eq('status', 'authorized').gte('status_date', startDate.toISOString())
    if (endStr) q = q.lte('status_date', endDate.toISOString())
    const { data, error } = await q.order('status_date', { ascending: false }).range(offset, offset + PAGE - 1)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data || data.length === 0) break
    allSalesPages.push(data)
    if (data.length < PAGE) break
    offset += PAGE
  }
  const sales = allSalesPages.flat()

  // Reembolsos
  let refundQ = supabase.from('ticto_sales').select('*').in('status', ['refunded', 'chargeback']).gte('status_date', startDate.toISOString())
  if (endStr) refundQ = refundQ.lte('status_date', endDate.toISOString())
  const { data: refunds } = await refundQ

  // Gasto Meta Ads
  let metaQuery = supabase.from('meta_ads_account_insights').select('date, spend').gte('date', startStr)
  if (endStr) metaQuery = metaQuery.lte('date', endStr)
  const { data: metaData } = await metaQuery

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all: any[] = sales || []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allRefunds: any[] = refunds || []
  const totalSpend = (metaData || []).reduce((s, r) => s + Number(r.spend), 0)

  // Separar tipos
  const principais = all.filter(s => !s.is_bump && !s.is_upsell && !s.is_downsell)
  const bumps = all.filter(s => s.is_bump)
  const upsells = all.filter(s => s.is_upsell)
  const downsells = all.filter(s => s.is_downsell)

  // Receitas
  const revPrincipais = principais.reduce((s, r) => s + Number(r.paid_amount || 0), 0)
  const revBumps = bumps.reduce((s, r) => s + Number(r.paid_amount || 0), 0)
  const revUpsells = upsells.reduce((s, r) => s + Number(r.paid_amount || 0), 0)
  const revDownsells = downsells.reduce((s, r) => s + Number(r.paid_amount || 0), 0)
  const totalRevenue = revPrincipais + revBumps + revUpsells + revDownsells
  const totalRefundAmount = allRefunds.reduce((s, r) => s + Number(r.paid_amount || 0), 0)
  const netRevenue = totalRevenue - totalRefundAmount

  // Pedidos únicos (pelo order_id dos principais)
  const uniqueOrders = new Set(principais.map(s => s.order_id))
  const ordersWithBump = new Set(bumps.map(s => s.order_id))
  const bumpRate = uniqueOrders.size > 0 ? (ordersWithBump.size / uniqueOrders.size * 100) : 0

  // Ticket médio por pedido (soma tudo do mesmo order_id)
  const orderTotals: Record<string, number> = {}
  all.forEach(s => {
    const oid = s.order_id || ''
    orderTotals[oid] = (orderTotals[oid] || 0) + Number(s.paid_amount || 0)
  })
  const avgOrderValue = uniqueOrders.size > 0
    ? Object.values(orderTotals).reduce((a, b) => a + b, 0) / uniqueOrders.size : 0

  // Breakdown por produto (só principais)
  const productMap: Record<string, { count: number; revenue: number; bumps: number; bump_revenue: number; upsells: number; upsell_revenue: number; downsells: number; downsell_revenue: number }> = {}
  principais.forEach(s => {
    const name = s.product_name || 'Desconhecido'
    if (!productMap[name]) productMap[name] = { count: 0, revenue: 0, bumps: 0, bump_revenue: 0, upsells: 0, upsell_revenue: 0, downsells: 0, downsell_revenue: 0 }
    productMap[name].count++
    productMap[name].revenue += Number(s.paid_amount || 0)
  })
  // Adicionar bumps/upsells/downsells ao produto pai
  bumps.forEach(s => {
    const parent = s.parent_product || 'Outros'
    if (!productMap[parent]) productMap[parent] = { count: 0, revenue: 0, bumps: 0, bump_revenue: 0, upsells: 0, upsell_revenue: 0, downsells: 0, downsell_revenue: 0 }
    productMap[parent].bumps++
    productMap[parent].bump_revenue += Number(s.paid_amount || 0)
  })
  upsells.forEach(s => {
    const parent = s.parent_product || 'Outros'
    if (!productMap[parent]) productMap[parent] = { count: 0, revenue: 0, bumps: 0, bump_revenue: 0, upsells: 0, upsell_revenue: 0, downsells: 0, downsell_revenue: 0 }
    productMap[parent].upsells++
    productMap[parent].upsell_revenue += Number(s.paid_amount || 0)
  })
  downsells.forEach(s => {
    const parent = s.parent_product || 'Outros'
    if (!productMap[parent]) productMap[parent] = { count: 0, revenue: 0, bumps: 0, bump_revenue: 0, upsells: 0, upsell_revenue: 0, downsells: 0, downsell_revenue: 0 }
    productMap[parent].downsells++
    productMap[parent].downsell_revenue += Number(s.paid_amount || 0)
  })

  const products = Object.entries(productMap)
    .map(([name, d]) => ({
      name,
      ...d,
      total_revenue: d.revenue + d.bump_revenue + d.upsell_revenue + d.downsell_revenue,
      bump_rate: d.count > 0 ? Number((d.bumps / d.count * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.total_revenue - a.total_revenue)

  // Top bumps (quais bumps vendem mais)
  const bumpProducts: Record<string, { name: string; count: number; revenue: number }> = {}
  bumps.forEach(s => {
    const name = s.product_name || ''
    if (!bumpProducts[name]) bumpProducts[name] = { name, count: 0, revenue: 0 }
    bumpProducts[name].count++
    bumpProducts[name].revenue += Number(s.paid_amount || 0)
  })
  const topBumps = Object.values(bumpProducts).sort((a, b) => b.count - a.count)

  // Métodos de pagamento (só principais, sem duplicar por bump)
  const paymentMethods: Record<string, number> = {}
  principais.forEach(s => {
    const m = s.payment_method || 'unknown'
    paymentMethods[m] = (paymentMethods[m] || 0) + 1
  })

  // Vendas por dia (principais = pedidos)
  const dailyMap: Record<string, { count: number; revenue: number; bumps: number; bump_rev: number; refunds: number; refund_amount: number }> = {}
  principais.forEach(s => {
    const date = s.status_date ? new Date(s.status_date).toISOString().split('T')[0] : ''
    if (!date) return
    if (!dailyMap[date]) dailyMap[date] = { count: 0, revenue: 0, bumps: 0, bump_rev: 0, refunds: 0, refund_amount: 0 }
    dailyMap[date].count++
    dailyMap[date].revenue += Number(s.paid_amount || 0)
  })
  bumps.forEach(s => {
    const date = s.status_date ? new Date(s.status_date).toISOString().split('T')[0] : ''
    if (!date || !dailyMap[date]) return
    dailyMap[date].bumps++
    dailyMap[date].bump_rev += Number(s.paid_amount || 0)
  })
  allRefunds.forEach(r => {
    const date = r.status_date ? new Date(r.status_date).toISOString().split('T')[0] : ''
    if (!date) return
    if (!dailyMap[date]) dailyMap[date] = { count: 0, revenue: 0, bumps: 0, bump_rev: 0, refunds: 0, refund_amount: 0 }
    dailyMap[date].refunds++
    dailyMap[date].refund_amount += Number(r.paid_amount || 0)
  })

  const daily = Object.entries(dailyMap)
    .map(([date, d]) => ({ date, ...d, total: d.revenue + d.bump_rev, net: d.revenue + d.bump_rev - d.refund_amount }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // UTM Sources (só principais)
  const utmMap: Record<string, { count: number; revenue: number; source: string }> = {}
  principais.forEach(s => {
    const key = s.utm_source || 'direto'
    if (!utmMap[key]) utmMap[key] = { count: 0, revenue: 0, source: key }
    utmMap[key].count++
    utmMap[key].revenue += Number(s.paid_amount || 0)
  })
  const topSources = Object.values(utmMap).sort((a, b) => b.revenue - a.revenue)

  // Horários de pico
  const hourMap: Record<number, number> = {}
  principais.forEach(s => {
    if (!s.status_date) return
    const hour = new Date(s.status_date).getHours()
    hourMap[hour] = (hourMap[hour] || 0) + 1
  })
  const peakHours = Object.entries(hourMap)
    .map(([h, count]) => ({ hour: Number(h), count }))
    .sort((a, b) => b.count - a.count)

  // Estados
  const stateMap: Record<string, number> = {}
  principais.forEach(s => {
    const state = s.customer_state || 'N/A'
    stateMap[state] = (stateMap[state] || 0) + 1
  })
  const topStates = Object.entries(stateMap)
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return NextResponse.json({
    totals: {
      orders: uniqueOrders.size,
      items_sold: all.length,
      revenue_principal: revPrincipais,
      revenue_bumps: revBumps,
      revenue_upsells: revUpsells,
      revenue_downsells: revDownsells,
      revenue: totalRevenue,
      refunds: allRefunds.length,
      refund_amount: totalRefundAmount,
      refund_rate: uniqueOrders.size > 0 ? Number((allRefunds.length / uniqueOrders.size * 100).toFixed(1)) : 0,
      net_revenue: netRevenue,
      avg_order_value: Number(avgOrderValue.toFixed(2)),
      bump_orders: ordersWithBump.size,
      bump_rate: Number(bumpRate.toFixed(1)),
      bump_revenue: revBumps,
      upsell_count: upsells.length,
      upsell_revenue: revUpsells,
      downsell_count: downsells.length,
      downsell_revenue: revDownsells,
      ad_spend: totalSpend,
      roas_real: totalSpend > 0 ? Number((netRevenue / totalSpend).toFixed(4)) : 0,
      cpa: uniqueOrders.size > 0 ? Number((totalSpend / uniqueOrders.size).toFixed(2)) : 0,
      profit: netRevenue - totalSpend,
    },
    products,
    top_bumps: topBumps,
    daily,
    payment_methods: paymentMethods,
    top_sources: topSources,
    peak_hours: peakHours.slice(0, 5),
    top_states: topStates,
    transactions: view === 'transactions' ? all.concat(allRefunds).sort((a, b) =>
      new Date(b.status_date || 0).getTime() - new Date(a.status_date || 0).getTime()
    ) : undefined,
  })
}
