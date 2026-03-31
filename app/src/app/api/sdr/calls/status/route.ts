import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const idsParam = url.searchParams.get('ids')

    if (!idsParam) {
      return NextResponse.json({ error: 'ids parameter is required' }, { status: 400 })
    }

    const ids = idsParam.split(',').filter(Boolean)
    if (ids.length === 0) {
      return NextResponse.json({ calls: [] })
    }

    const supabase = getServiceSupabase()

    const { data, error } = await supabase
      .from('sdr_calls')
      .select('id, status, disposition, duration_seconds, external_call_id')
      .in('id', ids)

    if (error) {
      console.error('[api/sdr/calls/status] Error:', error.message)
      return NextResponse.json({ error: 'Erro ao buscar status' }, { status: 500 })
    }

    return NextResponse.json({ calls: data || [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/calls/status] Unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
