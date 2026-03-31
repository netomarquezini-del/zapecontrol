import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { transcribeAudio } from '@/lib/sdr/whisper-client'
import { analyzeCall } from '@/lib/sdr/call-analyzer'
import { getSignedRecordingUrl } from '@/lib/sdr/recording-storage'

export const dynamic = 'force-dynamic'
export const maxDuration = 120 // Allow up to 2 minutes for transcription + analysis

/**
 * POST: Process a call's transcription + AI analysis
 * Body: { call_id: string, force?: boolean }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let transcriptionId: string | null = null

  try {
    const body = await request.json()
    const { call_id, force } = body as { call_id: string; force?: boolean }

    if (!call_id) {
      return NextResponse.json(
        { error: 'call_id is required' },
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()

    // 1. Get call record
    const { data: call, error: callError } = await supabase
      .from('sdr_calls')
      .select('id, lead_id, recording_url')
      .eq('id', call_id)
      .single()

    if (callError || !call) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      )
    }

    if (!call.recording_url) {
      return NextResponse.json(
        { error: 'Call has no recording' },
        { status: 400 }
      )
    }

    // 2. Check if transcription already exists
    const { data: existing } = await supabase
      .from('sdr_transcriptions')
      .select('id, status')
      .eq('call_id', call_id)
      .single()

    if (existing && existing.status === 'completed' && !force) {
      return NextResponse.json({
        success: true,
        transcription_id: existing.id,
        message: 'Transcription already completed',
        skipped: true,
      })
    }

    // 3. Upsert transcription record with status = 'transcribing'
    if (existing) {
      transcriptionId = existing.id
      await supabase
        .from('sdr_transcriptions')
        .update({
          status: 'transcribing',
          error_message: null,
          started_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      const { data: newTranscription, error: insertError } = await supabase
        .from('sdr_transcriptions')
        .insert({
          call_id,
          status: 'transcribing',
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (insertError || !newTranscription) {
        console.error('[transcriptions/process] Insert error:', insertError?.message)
        return NextResponse.json(
          { error: 'Failed to create transcription record' },
          { status: 500 }
        )
      }
      transcriptionId = newTranscription.id
    }

    // 4. Get signed URL for the recording
    // recording_url may be a public URL or a storage path
    let audioUrl = call.recording_url
    if (audioUrl.includes('/storage/v1/object/public/')) {
      // Extract path from public URL and create signed URL
      const pathMatch = audioUrl.match(/\/sdr-recordings\/(.+)$/)
      if (pathMatch) {
        audioUrl = await getSignedRecordingUrl(pathMatch[1])
      }
    } else if (!audioUrl.startsWith('http')) {
      // It's a storage path, get signed URL
      audioUrl = await getSignedRecordingUrl(audioUrl)
    }

    // 5. Transcribe with Whisper
    console.log(`[transcriptions/process] Transcribing call ${call_id}...`)
    const { text, duration } = await transcribeAudio(audioUrl)

    if (!text || text.trim().length === 0) {
      throw new Error('Transcription returned empty text')
    }

    // 6. Save transcription text, update status to 'analyzing'
    await supabase
      .from('sdr_transcriptions')
      .update({
        status: 'analyzing',
        transcription_text: text,
        duration_seconds: Math.round(duration),
        word_count: text.split(/\s+/).filter(Boolean).length,
        language: 'pt',
      })
      .eq('id', transcriptionId)

    // 7. Get lead context
    const { data: lead } = await supabase
      .from('sdr_leads')
      .select('nome, empresa, cargo')
      .eq('id', call.lead_id)
      .single()

    const leadContext = {
      nome: lead?.nome || 'Desconhecido',
      empresa: lead?.empresa || undefined,
      cargo: lead?.cargo || undefined,
    }

    // 8. Analyze with Claude
    console.log(`[transcriptions/process] Analyzing call ${call_id}...`)
    const analysis = await analyzeCall(text, leadContext)

    // 9. Save analysis and mark as completed
    const processingTimeMs = Date.now() - startTime

    await supabase
      .from('sdr_transcriptions')
      .update({
        status: 'completed',
        ai_summary: analysis.summary,
        ai_score: analysis.score,
        ai_sentiment: JSON.stringify({
          objections: analysis.objections,
          improvements: analysis.improvements,
        }),
        ai_next_steps: analysis.next_steps,
        completed_at: new Date().toISOString(),
      })
      .eq('id', transcriptionId)

    console.log(
      `[transcriptions/process] Completed call ${call_id} in ${processingTimeMs}ms (score: ${analysis.score})`
    )

    return NextResponse.json({
      success: true,
      transcription_id: transcriptionId,
      score: analysis.score,
      processing_time_ms: processingTimeMs,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[transcriptions/process] Error:', message)

    // Update transcription status to error if we have an ID
    if (transcriptionId) {
      const supabase = getServiceSupabase()
      await supabase
        .from('sdr_transcriptions')
        .update({
          status: 'error',
          error_message: message,
        })
        .eq('id', transcriptionId)
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
