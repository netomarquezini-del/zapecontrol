import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET: Get transcription + analysis for a call
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ call_id: string }> }
) {
  try {
    const { call_id } = await params

    if (!call_id) {
      return NextResponse.json(
        { error: 'call_id is required' },
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()

    const { data, error } = await supabase
      .from('sdr_transcriptions')
      .select('*')
      .eq('call_id', call_id)
      .single()

    if (error || !data) {
      // No transcription found — return null status so the UI knows it's pending
      if (error?.code === 'PGRST116') {
        return NextResponse.json({
          data: null,
          status: 'not_found',
        })
      }
      console.error('[transcriptions/[call_id]] GET error:', error?.message)
      return NextResponse.json(
        { error: 'Erro ao buscar transcricao' },
        { status: 500 }
      )
    }

    // Parse ai_sentiment JSON string back to object
    let parsedSentiment = null
    if (data.ai_sentiment && typeof data.ai_sentiment === 'string') {
      try {
        parsedSentiment = JSON.parse(data.ai_sentiment)
      } catch {
        parsedSentiment = data.ai_sentiment
      }
    } else {
      parsedSentiment = data.ai_sentiment
    }

    return NextResponse.json({
      data: {
        ...data,
        ai_sentiment: parsedSentiment,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[transcriptions/[call_id]] Unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
