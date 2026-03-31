import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET: Get upcoming schedules (today + tomorrow) for workspace indicator
 * Returns schedules with lead info, sorted by scheduled_at
 */
export async function GET() {
  try {
    const supabase = getServiceSupabase()
    const now = new Date()

    // Start of today
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    // End of tomorrow
    const tomorrowEnd = new Date(todayStart)
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 2)
    tomorrowEnd.setMilliseconds(tomorrowEnd.getMilliseconds() - 1)

    const { data, error } = await supabase
      .from('sdr_schedules')
      .select(`
        id,
        lead_id,
        closer_user_id,
        sdr_user_id,
        status,
        scheduled_at,
        duration_minutes,
        meeting_link,
        notes,
        sdr_leads ( id, nome, telefone, empresa )
      `)
      .in('status', ['agendado', 'confirmado'])
      .gte('scheduled_at', todayStart.toISOString())
      .lte('scheduled_at', tomorrowEnd.toISOString())
      .order('scheduled_at', { ascending: true })

    if (error) {
      console.error('[api/sdr/schedules/upcoming] GET error:', error.message)
      return NextResponse.json({ error: 'Erro ao buscar agendamentos' }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/schedules/upcoming] GET unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
