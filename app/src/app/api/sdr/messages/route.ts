import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    const url = request.nextUrl

    const leadId = url.searchParams.get('lead_id')
    if (!leadId) {
      return NextResponse.json({ error: 'lead_id e obrigatorio' }, { status: 400 })
    }

    const channel = url.searchParams.get('channel')
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)))
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10))

    let query = supabase
      .from('sdr_messages')
      .select('*', { count: 'exact' })
      .eq('lead_id', leadId)

    if (channel) {
      query = query.eq('channel', channel)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('[api/sdr/messages] GET error:', error.message)
      return NextResponse.json({ error: 'Erro ao buscar mensagens' }, { status: 500 })
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/messages] GET unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
