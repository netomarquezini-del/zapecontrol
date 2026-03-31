import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl
    const leadId = url.searchParams.get('lead_id')

    if (!leadId) {
      return NextResponse.json({ error: 'lead_id e obrigatorio' }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    // Fetch lead details
    const { data: lead, error: leadError } = await supabase
      .from('sdr_leads')
      .select('id, nome, telefone, email, empresa, cargo, origem, status, tags, notes, total_calls, total_messages, last_contact_at')
      .eq('id', leadId)
      .single()

    if (leadError) {
      if (leadError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead nao encontrado' }, { status: 404 })
      }
      console.error('[api/sdr/copilot/context] Lead error:', leadError.message)
      return NextResponse.json({ error: 'Erro ao buscar lead' }, { status: 500 })
    }

    // Fetch last 5 interactions
    const { data: interactions } = await supabase
      .from('sdr_interactions')
      .select('id, type, summary, metadata, created_at')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Fetch recent call history (last 5 completed calls)
    const { data: calls } = await supabase
      .from('sdr_calls')
      .select('id, direction, status, disposition, duration_seconds, started_at, notes')
      .eq('lead_id', leadId)
      .in('status', ['completed', 'answered'])
      .order('started_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      lead,
      interactions: interactions || [],
      calls: calls || [],
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/copilot/context] Unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
