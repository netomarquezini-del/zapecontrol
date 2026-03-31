import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET: List schedules with filters
 * Query params: closer_id, status, sdr_id, date_from, date_to
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    const { searchParams } = new URL(request.url)

    const closerId = searchParams.get('closer_id')
    const status = searchParams.get('status')
    const sdrId = searchParams.get('sdr_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    let query = supabase
      .from('sdr_schedules')
      .select(`
        *,
        sdr_leads ( id, nome, telefone, email, empresa, status )
      `)
      .order('scheduled_at', { ascending: true })

    if (closerId) {
      query = query.eq('closer_user_id', closerId)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (sdrId) {
      query = query.eq('sdr_user_id', sdrId)
    }
    if (dateFrom) {
      query = query.gte('scheduled_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('scheduled_at', dateTo)
    }

    const { data, error } = await query

    if (error) {
      console.error('[api/sdr/schedules] GET error:', error.message)
      return NextResponse.json({ error: 'Erro ao buscar agendamentos' }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/schedules] GET unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST: Create a new schedule
 * Body: { lead_id, closer_id, scheduled_at, sdr_user_id?, duration_minutes?, meeting_link?, notes? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    const body = await request.json()
    const { lead_id, closer_id, scheduled_at, sdr_user_id, duration_minutes, meeting_link, notes } = body

    if (!lead_id || !closer_id || !scheduled_at) {
      return NextResponse.json(
        { error: 'Campos obrigatorios: lead_id, closer_id, scheduled_at' },
        { status: 400 }
      )
    }

    // Validate that the lead exists
    const { data: lead, error: leadErr } = await supabase
      .from('sdr_leads')
      .select('id, nome')
      .eq('id', lead_id)
      .single()

    if (leadErr || !lead) {
      return NextResponse.json({ error: 'Lead nao encontrado' }, { status: 404 })
    }

    // Create the schedule
    const { data: schedule, error: insertErr } = await supabase
      .from('sdr_schedules')
      .insert({
        lead_id,
        closer_user_id: closer_id,
        sdr_user_id: sdr_user_id || null,
        scheduled_at,
        duration_minutes: duration_minutes || 30,
        meeting_link: meeting_link || null,
        notes: notes || null,
        status: 'agendado',
        followup_sent_d1: false,
        followup_sent_d0: false,
      })
      .select()
      .single()

    if (insertErr) {
      console.error('[api/sdr/schedules] POST error:', insertErr.message)
      return NextResponse.json({ error: 'Erro ao criar agendamento' }, { status: 500 })
    }

    // Update lead status to 'agendado'
    await supabase
      .from('sdr_leads')
      .update({ status: 'agendado' })
      .eq('id', lead_id)

    // Create interaction entry
    await supabase.from('sdr_interactions').insert({
      lead_id,
      sdr_user_id: sdr_user_id || 'system',
      type: 'schedule',
      summary: `Reuniao agendada para ${new Date(scheduled_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
      metadata: {
        schedule_id: schedule.id,
        closer_user_id: closer_id,
        scheduled_at,
      },
      reference_id: schedule.id,
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/schedules] POST unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
