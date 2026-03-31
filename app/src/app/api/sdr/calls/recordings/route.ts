import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET: List calls that have recordings, with lead and transcription info.
 * Supports filters: date range, sdr_user_id, lead search, min duration, pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    const url = request.nextUrl

    const sdrId = url.searchParams.get('sdr_id')
    const search = url.searchParams.get('search')
    const dateFrom = url.searchParams.get('date_from')
    const dateTo = url.searchParams.get('date_to')
    const minDuration = url.searchParams.get('min_duration')
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '25', 10)))
    const offset = (page - 1) * limit

    // Query calls with recording_url not null, join lead name
    let query = supabase
      .from('sdr_calls')
      .select(
        `
        id,
        lead_id,
        sdr_user_id,
        direction,
        status,
        disposition,
        duration_seconds,
        recording_url,
        external_call_id,
        started_at,
        answered_at,
        ended_at,
        notes,
        created_at,
        sdr_leads!sdr_calls_lead_id_fkey ( id, nome, telefone, empresa ),
        sdr_transcriptions ( id, status, ai_summary, ai_score, ai_sentiment, transcription_text )
      `,
        { count: 'exact' }
      )
      .not('recording_url', 'is', null)

    if (sdrId) {
      query = query.eq('sdr_user_id', sdrId)
    }

    if (dateFrom) {
      query = query.gte('started_at', dateFrom)
    }

    if (dateTo) {
      // Add end of day
      const endDate = dateTo.includes('T') ? dateTo : `${dateTo}T23:59:59.999Z`
      query = query.lte('started_at', endDate)
    }

    if (minDuration) {
      const minSecs = parseInt(minDuration, 10)
      if (!isNaN(minSecs) && minSecs > 0) {
        query = query.gte('duration_seconds', minSecs)
      }
    }

    if (search) {
      // Search in joined lead name/phone — we need to filter after fetch
      // Supabase doesn't support filtering on joined tables easily in this way,
      // so we use a separate approach: fetch lead IDs first
      const { data: matchingLeads } = await supabase
        .from('sdr_leads')
        .select('id')
        .or(`nome.ilike.%${search}%,telefone.ilike.%${search}%,empresa.ilike.%${search}%`)

      if (matchingLeads && matchingLeads.length > 0) {
        const leadIds = matchingLeads.map((l) => l.id)
        query = query.in('lead_id', leadIds)
      } else {
        // No matching leads — return empty
        return NextResponse.json({
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        })
      }
    }

    query = query
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('[api/sdr/calls/recordings] GET error:', error.message)
      return NextResponse.json({ error: 'Erro ao buscar gravacoes' }, { status: 500 })
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/calls/recordings] GET unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
