import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import type { SdrScheduleStatus } from '@/lib/types-sdr'

export const dynamic = 'force-dynamic'

const VALID_STATUSES: SdrScheduleStatus[] = ['confirmado', 'realizado', 'no_show', 'cancelado']

const STATUS_LABELS: Record<string, string> = {
  confirmado: 'Reuniao confirmada pelo lead',
  realizado: 'Reuniao realizada com sucesso',
  no_show: 'Lead nao compareceu (no-show)',
  cancelado: 'Agendamento cancelado',
}

/**
 * PATCH: Update schedule status
 * Body: { status: 'confirmado' | 'realizado' | 'no_show' | 'cancelado', cancel_reason? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getServiceSupabase()
    const body = await request.json()
    const { status, cancel_reason } = body as { status: SdrScheduleStatus; cancel_reason?: string }

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Status invalido. Valores aceitos: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Get current schedule
    const { data: schedule, error: fetchErr } = await supabase
      .from('sdr_schedules')
      .select('id, lead_id, sdr_user_id, status')
      .eq('id', id)
      .single()

    if (fetchErr || !schedule) {
      return NextResponse.json({ error: 'Agendamento nao encontrado' }, { status: 404 })
    }

    // Build update payload with timestamp fields
    const now = new Date().toISOString()
    const updateData: Record<string, unknown> = { status }

    switch (status) {
      case 'confirmado':
        updateData.confirmed_at = now
        break
      case 'realizado':
        updateData.completed_at = now
        break
      case 'no_show':
        updateData.no_show_at = now
        break
      case 'cancelado':
        updateData.canceled_at = now
        updateData.cancel_reason = cancel_reason || 'Cancelado manualmente'
        break
    }

    const { data: updated, error: updateErr } = await supabase
      .from('sdr_schedules')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        sdr_leads ( id, nome, telefone, email, empresa, status )
      `)
      .single()

    if (updateErr) {
      console.error('[api/sdr/schedules/[id]/status] PATCH error:', updateErr.message)
      return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 })
    }

    // If canceled, revert lead status
    if (status === 'cancelado') {
      await supabase
        .from('sdr_leads')
        .update({ status: 'qualificado' })
        .eq('id', schedule.lead_id)
        .eq('status', 'agendado')
    }

    // Create interaction entry
    await supabase.from('sdr_interactions').insert({
      lead_id: schedule.lead_id,
      sdr_user_id: schedule.sdr_user_id || 'system',
      type: 'schedule',
      summary: STATUS_LABELS[status] || `Status alterado para ${status}`,
      metadata: {
        schedule_id: id,
        action: 'status_change',
        old_status: schedule.status,
        new_status: status,
      },
      reference_id: id,
    })

    return NextResponse.json(updated)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/schedules/[id]/status] PATCH unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
