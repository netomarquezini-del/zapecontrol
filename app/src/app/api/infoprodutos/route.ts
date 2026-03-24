import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const period = params.get('period') || '7d'
  const view = params.get('view') || 'dashboard' // dashboard | transactions

  const supabase = getServiceSupabase()

  const now = new Date()
  const startDate = new Date()
  switch (period) {
    case 'today': startDate.setHours(0, 0, 0, 0); break
    case 'yesterday': startDate.setDate(now.getDate() - 1); startDate.setHours(0, 0, 0, 0); break
    case '3d': startDate.setDate(now.getDate() - 3); break
    case '7d': startDate.setDate(now.getDate() - 7); break
    case '14d': startDate.setDate(now.getDate() - 14); break
    case '30d': startDate.setDate(now.getDate() - 30); break
    case 'this_month': startDate.setDate(1); startDate.setHours(0, 0, 0, 0); break
    default: startDate.setDate(now.getDate() - 7)
  }

  // Vendas aprovadas
  const { data: sales, error: salesError } = await supabase
    .from('ticto_sales')
    .select('*')
    .eq('status', 'authorized')
    .gte('status_date', startDate.toISOString())
    .order('status_date', { ascending: false })

  if (salesError) return NextResponse.json({ error: salesError.message }, { status: 500 })

  // Reembolsos
  const { data: refunds } = await supabase
    .from('ticto_sales')
    .select('*')
    .in('status', ['refunded', 'chargeback'])
    .gte('status_date', startDate.toISOString())

  // Gasto Meta Ads
  const { data: metaData } = await supabase
    .from('meta_ads_account_insights')
    .select('date, spend')
    .gte('date', startDate.toISOString().split('T')[0])

  const allSales = sales || []
  const allRefunds = refunds || []
  const totalSpend = (metaData || []).reduce((s, r) => s + Number(r.spend), 0)

  // Totais
  const totalRevenue = allSales.reduce((s, r) => s + Number(r.paid_amount || 0), 0)
  const totalRefundAmount = allRefunds.reduce((s, r) => s + Number(r.paid_amount || 0), 0)
  const netRevenue = totalRevenue - totalRefundAmount

  // Order bump detection (vendas com paid_amount > price = tem bump)
  const withBump = allSales.filter(s => Number(s.paid_amount) > Number(s.price) && Number(s.price) > 0)
  const bumpRevenue = withBump.reduce((s, r) => s + (Number(r.paid_amount) - Number(r.price)), 0)

  // Métodos de pagamento
  const paymentMethods: Record<string, number> = {}
  allSales.forEach(s => {
    const m = s.payment_method || 'unknown'
    paymentMethods[m] = (paymentMethods[m] || 0) + 1
  })

  // Vendas por dia
  const dailyMap: Record<string, { count: number; revenue: number; refunds: number; refund_amount: number }> = {}
  allSales.forEach(s => {
    const date = s.status_date ? new Date(s.status_date).toISOString().split('T')[0] : ''
    if (!date) return
    if (!dailyMap[date]) dailyMap[date] = { count: 0, revenue: 0, refunds: 0, refund_amount: 0 }
    dailyMap[date].count++
    dailyMap[date].revenue += Number(s.paid_amount || 0)
  })
  allRefunds.forEach(r => {
    const date = r.status_date ? new Date(r.status_date).toISOString().split('T')[0] : ''
    if (!date) return
    if (!dailyMap[date]) dailyMap[date] = { count: 0, revenue: 0, refunds: 0, refund_amount: 0 }
    dailyMap[date].refunds++
    dailyMap[date].refund_amount += Number(r.paid_amount || 0)
  })

  const daily = Object.entries(dailyMap)
    .map(([date, d]) => ({ date, ...d, net: d.revenue - d.refund_amount }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Top UTMs (de onde vieram as vendas)
  const utmMap: Record<string, { count: number; revenue: number; source: string; campaign: string }> = {}
  allSales.forEach(s => {
    const key = s.utm_source || 'direto'
    if (!utmMap[key]) utmMap[key] = { count: 0, revenue: 0, source: s.utm_source || 'direto', campaign: s.utm_campaign || '' }
    utmMap[key].count++
    utmMap[key].revenue += Number(s.paid_amount || 0)
  })
  const topSources = Object.values(utmMap).sort((a, b) => b.revenue - a.revenue)

  // Horários de pico (hora do dia com mais vendas)
  const hourMap: Record<number, number> = {}
  allSales.forEach(s => {
    if (!s.status_date) return
    const hour = new Date(s.status_date).getHours()
    hourMap[hour] = (hourMap[hour] || 0) + 1
  })
  const peakHours = Object.entries(hourMap)
    .map(([h, count]) => ({ hour: Number(h), count }))
    .sort((a, b) => b.count - a.count)

  // Estados
  const stateMap: Record<string, number> = {}
  allSales.forEach(s => {
    const state = s.customer_state || 'N/A'
    stateMap[state] = (stateMap[state] || 0) + 1
  })
  const topStates = Object.entries(stateMap)
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return NextResponse.json({
    totals: {
      sales: allSales.length,
      revenue: totalRevenue,
      refunds: allRefunds.length,
      refund_amount: totalRefundAmount,
      refund_rate: allSales.length > 0 ? Number((allRefunds.length / allSales.length * 100).toFixed(1)) : 0,
      net_revenue: netRevenue,
      ticket_medio: allSales.length > 0 ? Number((totalRevenue / allSales.length).toFixed(2)) : 0,
      order_bump_count: withBump.length,
      order_bump_rate: allSales.length > 0 ? Number((withBump.length / allSales.length * 100).toFixed(1)) : 0,
      order_bump_revenue: bumpRevenue,
      ad_spend: totalSpend,
      roas_real: totalSpend > 0 ? Number((netRevenue / totalSpend).toFixed(4)) : 0,
      cpa: allSales.length > 0 ? Number((totalSpend / allSales.length).toFixed(2)) : 0,
      profit: netRevenue - totalSpend,
    },
    daily,
    payment_methods: paymentMethods,
    top_sources: topSources,
    peak_hours: peakHours.slice(0, 5),
    top_states: topStates,
    transactions: view === 'transactions' ? allSales.concat(allRefunds).sort((a, b) =>
      new Date(b.status_date || 0).getTime() - new Date(a.status_date || 0).getTime()
    ) : undefined,
  })
}
