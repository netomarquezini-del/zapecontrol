import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const level = params.get('level') || 'account'

  const supabase = getServiceSupabase()

  let startStr = params.get('startDate') || ''
  const endStr = params.get('endDate') || ''
  const filterCampaign = params.get('campaign_id') || ''
  const filterAdset = params.get('adset_id') || ''

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

  const tableMap: Record<string, string> = {
    account: 'meta_ads_account_insights',
    campaigns: 'meta_ads_campaign_insights',
    adsets: 'meta_ads_adset_insights',
    ads: 'meta_ads_ad_insights',
  }

  const table = tableMap[level] || tableMap.account

  let query = supabase.from(table).select('*').gte('date', startStr)
  if (endStr) query = query.lte('date', endStr)
  if (filterCampaign && (level === 'adsets' || level === 'ads')) {
    query = query.eq('campaign_id', filterCampaign)
  }
  if (filterAdset && level === 'ads') {
    query = query.eq('adset_id', filterAdset)
  }
  const { data, error } = await query.order('date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (level === 'account' && data && data.length > 0) {
    const totals = data.reduce(
      (acc, row) => ({
        spend: acc.spend + Number(row.spend),
        impressions: acc.impressions + Number(row.impressions),
        clicks: acc.clicks + Number(row.clicks),
        reach: acc.reach + Number(row.reach),
        purchases: acc.purchases + Number(row.purchases),
        revenue: acc.revenue + Number(row.revenue),
        add_to_cart: acc.add_to_cart + Number(row.add_to_cart || 0),
        initiate_checkout: acc.initiate_checkout + Number(row.initiate_checkout || 0),
        landing_page_views: acc.landing_page_views + Number(row.landing_page_views || 0),
        add_payment_info: acc.add_payment_info + Number(row.add_payment_info || 0),
      }),
      { spend: 0, impressions: 0, clicks: 0, reach: 0, purchases: 0, revenue: 0, add_to_cart: 0, initiate_checkout: 0, landing_page_views: 0, add_payment_info: 0 }
    )

    const imposto = totals.spend * 0.12
    const t = {
      ...totals,
      ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
      cpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
      cost_per_purchase: totals.purchases > 0 ? totals.spend / totals.purchases : 0,
      cost_per_landing_page_view: totals.landing_page_views > 0 ? totals.spend / totals.landing_page_views : 0,
      cost_per_add_payment_info: totals.add_payment_info > 0 ? totals.spend / totals.add_payment_info : 0,
      roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
      frequency: totals.reach > 0 ? totals.impressions / totals.reach : 0,
      imposto,
      margem: totals.revenue - totals.spend - imposto,
    }

    return NextResponse.json({ totals: t, daily: data })
  }

  // Campaigns, Adsets, Ads — aggregate by entity
  if (['campaigns', 'adsets', 'ads'].includes(level) && data) {
    const idField = level === 'campaigns' ? 'campaign_id' : level === 'adsets' ? 'adset_id' : 'ad_id'
    const nameField = level === 'campaigns' ? 'campaign_name' : level === 'adsets' ? 'adset_name' : 'ad_name'
    const grouped: Record<string, Record<string, unknown>> = {}

    for (const row of data) {
      const id = row[idField] as string
      if (!grouped[id]) {
        grouped[id] = {
          [idField]: id,
          [nameField]: row[nameField],
          ...(level === 'adsets' ? { campaign_id: row.campaign_id, campaign_name: row.campaign_name } : {}),
          ...(level === 'ads' ? { campaign_id: row.campaign_id, campaign_name: row.campaign_name, adset_id: row.adset_id, adset_name: row.adset_name } : {}),
          spend: 0, impressions: 0, clicks: 0, purchases: 0, revenue: 0,
          landing_page_views: 0, add_payment_info: 0,
        }
      }
      ;(grouped[id].spend as number) += Number(row.spend)
      ;(grouped[id].impressions as number) += Number(row.impressions)
      ;(grouped[id].clicks as number) += Number(row.clicks)
      ;(grouped[id].purchases as number) += Number(row.purchases)
      ;(grouped[id].revenue as number) += Number(row.revenue)
      ;(grouped[id].landing_page_views as number) += Number(row.landing_page_views || 0)
      ;(grouped[id].add_payment_info as number) += Number(row.add_payment_info || 0)
    }

    const result = Object.values(grouped).map((g) => {
      const spend = g.spend as number
      const impressions = g.impressions as number
      const clicks = g.clicks as number
      const purchases = g.purchases as number
      const revenue = g.revenue as number
      const lpv = g.landing_page_views as number
      const api = g.add_payment_info as number
      return {
        ...g,
        spend, impressions, clicks, purchases, revenue,
        cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cost_per_purchase: purchases > 0 ? spend / purchases : 0,
        cost_per_landing_page_view: lpv > 0 ? spend / lpv : 0,
        cost_per_add_payment_info: api > 0 ? spend / api : 0,
        roas: spend > 0 ? revenue / spend : 0,
      }
    })

    result.sort((a, b) => b.spend - a.spend)
    return NextResponse.json({ data: result })
  }

  return NextResponse.json({ data })
}
