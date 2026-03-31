import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import type { SdrLeadStatus } from '@/lib/types-sdr'

export const dynamic = 'force-dynamic'

const VALID_STATUSES: SdrLeadStatus[] = [
  'novo', 'tentativa', 'conectado', 'qualificado', 'agendado', 'descartado',
]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getServiceSupabase()
    const body = await request.json()

    const { status } = body as { status: string }

    if (!status || !VALID_STATUSES.includes(status as SdrLeadStatus)) {
      return NextResponse.json(
        { error: `Status invalido. Valores aceitos: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Get current lead to check old status
    const { data: currentLead, error: fetchError } = await supabase
      .from('sdr_leads')
      .select('status')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead nao encontrado' }, { status: 404 })
      }
      console.error('[api/sdr/leads/[id]/status] fetch error:', fetchError.message)
      return NextResponse.json({ error: 'Erro ao buscar lead' }, { status: 500 })
    }

    const oldStatus = currentLead.status

    // Update lead status
    const { data: updatedLead, error: updateError } = await supabase
      .from('sdr_leads')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[api/sdr/leads/[id]/status] update error:', updateError.message)
      return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 })
    }

    // Create interaction entry for status change
    const { error: interactionError } = await supabase
      .from('sdr_interactions')
      .insert({
        lead_id: id,
        sdr_user_id: updatedLead.sdr_user_id || '00000000-0000-0000-0000-000000000000',
        type: 'note',
        summary: `Status alterado de "${oldStatus}" para "${status}"`,
        metadata: { old_status: oldStatus, new_status: status, action: 'pipeline_move' },
      })

    if (interactionError) {
      console.error('[api/sdr/leads/[id]/status] interaction error:', interactionError.message)
      // Non-blocking: lead was already updated, just log the error
    }

    return NextResponse.json(updatedLead)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/leads/[id]/status] unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
