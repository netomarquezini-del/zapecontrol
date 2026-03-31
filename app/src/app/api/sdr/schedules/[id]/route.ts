import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET: Single schedule with lead details
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getServiceSupabase()

    const { data, error } = await supabase
      .from('sdr_schedules')
      .select(`
        *,
        sdr_leads ( id, nome, telefone, email, empresa, status )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Agendamento nao encontrado' }, { status: 404 })
      }
      console.error('[api/sdr/schedules/[id]] GET error:', error.message)
      return NextResponse.json({ error: 'Erro ao buscar agendamento' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/schedules/[id]] GET unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * PUT: Update schedule (reschedule)
 * Body: { scheduled_at?, closer_user_id?, duration_minutes?, meeting_link?, notes? }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getServiceSupabase()
    const body = await request.json()

    const allowedFields = [
      'scheduled_at',
      'closer_user_id',
      'duration_minutes',
      'meeting_link',
      'notes',
    ]

    const updateData: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in body) {
        updateData[key] = body[key]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    // If rescheduling, reset followup flags
    if (updateData.scheduled_at) {
      updateData.followup_sent_d1 = false
      updateData.followup_sent_d0 = false
    }

    const { data, error } = await supabase
      .from('sdr_schedules')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        sdr_leads ( id, nome, telefone, email, empresa, status )
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Agendamento nao encontrado' }, { status: 404 })
      }
      console.error('[api/sdr/schedules/[id]] PUT error:', error.message)
      return NextResponse.json({ error: 'Erro ao atualizar agendamento' }, { status: 500 })
    }

    // Log interaction for reschedule
    if (body.scheduled_at) {
      await supabase.from('sdr_interactions').insert({
        lead_id: data.lead_id,
        sdr_user_id: data.sdr_user_id || 'system',
        type: 'schedule',
        summary: `Reuniao reagendada para ${new Date(body.scheduled_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
        metadata: {
          schedule_id: id,
          action: 'rescheduled',
          new_scheduled_at: body.scheduled_at,
        },
        reference_id: id,
      })
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/schedules/[id]] PUT unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE: Cancel schedule and revert lead status
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getServiceSupabase()

    // Get the schedule first to know the lead_id
    const { data: schedule, error: fetchErr } = await supabase
      .from('sdr_schedules')
      .select('id, lead_id, sdr_user_id, status')
      .eq('id', id)
      .single()

    if (fetchErr || !schedule) {
      return NextResponse.json({ error: 'Agendamento nao encontrado' }, { status: 404 })
    }

    if (schedule.status === 'cancelado') {
      return NextResponse.json({ error: 'Agendamento ja cancelado' }, { status: 400 })
    }

    // Cancel the schedule
    const { error: updateErr } = await supabase
      .from('sdr_schedules')
      .update({
        status: 'cancelado',
        canceled_at: new Date().toISOString(),
        cancel_reason: 'Cancelado manualmente',
      })
      .eq('id', id)

    if (updateErr) {
      console.error('[api/sdr/schedules/[id]] DELETE error:', updateErr.message)
      return NextResponse.json({ error: 'Erro ao cancelar agendamento' }, { status: 500 })
    }

    // Revert lead status to 'qualificado' (previous stage before agendado)
    await supabase
      .from('sdr_leads')
      .update({ status: 'qualificado' })
      .eq('id', schedule.lead_id)
      .eq('status', 'agendado')

    // Log interaction
    await supabase.from('sdr_interactions').insert({
      lead_id: schedule.lead_id,
      sdr_user_id: schedule.sdr_user_id || 'system',
      type: 'schedule',
      summary: 'Agendamento cancelado',
      metadata: {
        schedule_id: id,
        action: 'canceled',
      },
      reference_id: id,
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/schedules/[id]] DELETE unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
