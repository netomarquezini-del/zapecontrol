import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    const url = request.nextUrl

    const period = url.searchParams.get('period') || '7d'
    const startDate = url.searchParams.get('start_date') || undefined
    const endDate = url.searchParams.get('end_date') || undefined

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

    const { data: schedules, error } = await supabase
      .from('sdr_schedules')
      .select('status')
      .gte('scheduled_at', start)
      .lte('scheduled_at', end)

    if (error) {
      console.error('[api/sdr/metrics/noshow] error:', error.message)
      return NextResponse.json({ error: 'Erro ao buscar agendamentos' }, { status: 500 })
    }

    const all = schedules || []
    const totalScheduled = all.length
    const realized = all.filter(s => s.status === 'realizado').length
    const noShow = all.filter(s => s.status === 'no_show').length
    const noShowRate = totalScheduled > 0 ? (noShow / totalScheduled) * 100 : 0

    return NextResponse.json({
      total_scheduled: totalScheduled,
      realized,
      no_show: noShow,
      no_show_rate: Math.round(noShowRate * 100) / 100,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/metrics/noshow] unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
