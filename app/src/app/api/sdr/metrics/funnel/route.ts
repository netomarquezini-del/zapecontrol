import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import type { SdrLeadStatus } from '@/lib/types-sdr'

export const dynamic = 'force-dynamic'

const PIPELINE_ORDER: SdrLeadStatus[] = [
  'novo',
  'tentativa',
  'conectado',
  'qualificado',
  'agendado',
  'descartado',
]

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    const url = request.nextUrl

    const period = url.searchParams.get('period') || '7d'
    const startDate = url.searchParams.get('start_date') || undefined
    const endDate = url.searchParams.get('end_date') || undefined
    const sdrId = url.searchParams.get('sdr_id') || undefined

    const now = new Date()
    let start: string
    let end: string = now.toISOString()

    switch (period) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        break
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        break
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
        break
      case 'custom':
        start = startDate ? new Date(startDate).toISOString() : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        if (endDate) end = new Date(endDate + 'T23:59:59').toISOString()
        break
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    }

    let query = supabase
      .from('sdr_leads')
      .select('status')
      .gte('created_at', start)
      .lte('created_at', end)

    if (sdrId) {
      query = query.eq('sdr_user_id', sdrId)
    }

    const { data: leads, error } = await query

    if (error) {
      console.error('[api/sdr/metrics/funnel] error:', error.message)
      return NextResponse.json({ error: 'Erro ao buscar dados do funil' }, { status: 500 })
    }

    const allLeads = leads || []
    const total = allLeads.length

    const countMap: Record<string, number> = {}
    for (const lead of allLeads) {
      countMap[lead.status] = (countMap[lead.status] || 0) + 1
    }

    const funnel = PIPELINE_ORDER.map(status => ({
      status,
      count: countMap[status] || 0,
      percentage: total > 0 ? Math.round(((countMap[status] || 0) / total) * 10000) / 100 : 0,
    }))

    return NextResponse.json(funnel)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/metrics/funnel] unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
