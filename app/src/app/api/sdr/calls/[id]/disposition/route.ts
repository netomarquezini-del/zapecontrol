import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import type { SdrCallDisposition } from '@/lib/types-sdr'

export const dynamic = 'force-dynamic'

const VALID_DISPOSITIONS: SdrCallDisposition[] = [
  'atendeu',
  'nao_atendeu',
  'agendar',
  'sem_interesse',
  'numero_errado',
  'caixa_postal',
]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { disposition, notes } = body as {
      disposition: SdrCallDisposition
      notes?: string
    }

    if (!disposition || !VALID_DISPOSITIONS.includes(disposition)) {
      return NextResponse.json(
        { error: `Invalid disposition. Must be one of: ${VALID_DISPOSITIONS.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()

    // Get the call record first
    const { data: call, error: fetchError } = await supabase
      .from('sdr_calls')
      .select('id, lead_id, sdr_user_id')
      .eq('id', id)
      .single()

    if (fetchError || !call) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      )
    }

    // Update call disposition
    const updateData: Record<string, unknown> = { disposition }
    if (notes !== undefined) {
      updateData.notes = notes
    }

    const { error: updateError } = await supabase
      .from('sdr_calls')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('[disposition] Update error:', updateError.message)
      return NextResponse.json({ error: 'Erro ao atualizar disposicao' }, { status: 500 })
    }

    // Create interaction entry
    await supabase.from('sdr_interactions').insert({
      lead_id: call.lead_id,
      sdr_user_id: call.sdr_user_id,
      type: 'call',
      summary: `Disposicao: ${disposition}${notes ? ` - ${notes}` : ''}`,
      metadata: { disposition, notes, call_id: id },
      reference_id: id,
    })

    // Update lead status based on disposition
    let newLeadStatus: string | null = null
    if (disposition === 'agendar') {
      newLeadStatus = 'qualificado'
    } else if (disposition === 'sem_interesse' || disposition === 'numero_errado') {
      newLeadStatus = 'descartado'
    } else if (disposition === 'atendeu') {
      newLeadStatus = 'conectado'
    }

    if (newLeadStatus) {
      await supabase
        .from('sdr_leads')
        .update({ status: newLeadStatus })
        .eq('id', call.lead_id)
    }

    return NextResponse.json({ success: true, disposition })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[disposition] Unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
