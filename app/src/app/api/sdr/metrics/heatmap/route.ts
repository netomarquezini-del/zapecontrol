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

    // Use RPC or raw query for heatmap aggregation
    // Since Supabase JS doesn't support EXTRACT directly, we fetch calls and aggregate in JS
    let query = supabase
      .from('sdr_calls')
      .select('status, created_at')
      .gte('created_at', start)
      .lte('created_at', end)

    if (sdrId) {
      query = query.eq('sdr_user_id', sdrId)
    }

    const { data: calls, error } = await query

    if (error) {
      console.error('[api/sdr/metrics/heatmap] error:', error.message)
      return NextResponse.json({ error: 'Erro ao buscar dados do heatmap' }, { status: 500 })
    }

    // Build grid: day (0=Sun, 1=Mon, ..., 6=Sat) x hour (0-23)
    const grid: Record<string, { total: number; answered: number }> = {}

    // Initialize all cells
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        grid[`${day}-${hour}`] = { total: 0, answered: 0 }
      }
    }

    for (const call of (calls || [])) {
      // Convert to Sao Paulo timezone
      const date = new Date(call.created_at)
      // Approximate BRT (UTC-3) offset
      const spDate = new Date(date.getTime() - 3 * 60 * 60 * 1000)
      const day = spDate.getUTCDay()
      const hour = spDate.getUTCHours()

      const key = `${day}-${hour}`
      grid[key].total++
      if (call.status === 'answered' || call.status === 'completed') {
        grid[key].answered++
      }
    }

    const heatmap = Object.entries(grid).map(([key, val]) => {
      const [day, hour] = key.split('-').map(Number)
      return {
        day,
        hour,
        total: val.total,
        answered: val.answered,
        rate: val.total > 0 ? Math.round((val.answered / val.total) * 10000) / 100 : 0,
      }
    })

    return NextResponse.json(heatmap)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/metrics/heatmap] unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
