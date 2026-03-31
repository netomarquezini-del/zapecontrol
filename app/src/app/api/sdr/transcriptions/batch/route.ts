import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { transcribeAudio } from '@/lib/sdr/whisper-client'
import { analyzeCall } from '@/lib/sdr/call-analyzer'
import { getSignedRecordingUrl } from '@/lib/sdr/recording-storage'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for batch processing

/**
 * POST: Process all unprocessed recordings (batch)
 * Processes sequentially to avoid rate limits.
 */
export async function POST() {
  try {
    const supabase = getServiceSupabase()

    // Find calls with recordings that don't have a completed transcription
    // 1. Get all call IDs that already have completed transcriptions
    const { data: completedTranscriptions } = await supabase
      .from('sdr_transcriptions')
      .select('call_id')
      .eq('status', 'completed')

    const completedCallIds = (completedTranscriptions || []).map(
      (t) => t.call_id
    )

    // 2. Get calls with recording_url that are NOT in the completed set
    let query = supabase
      .from('sdr_calls')
      .select('id, lead_id, recording_url')
      .not('recording_url', 'is', null)
      .order('started_at', { ascending: false })
      .limit(50) // Process max 50 at a time

    if (completedCallIds.length > 0) {
      query = query.not('id', 'in', `(${completedCallIds.join(',')})`)
    }

    const { data: calls, error: callsError } = await query

    if (callsError) {
      console.error('[transcriptions/batch] Query error:', callsError.message)
      return NextResponse.json(
        { error: 'Erro ao buscar chamadas' },
        { status: 500 }
      )
    }

    if (!calls || calls.length === 0) {
      return NextResponse.json({
        processed: 0,
        errors: 0,
        message: 'No unprocessed recordings found',
      })
    }

    // Also include calls with error transcriptions (for retry)
    const { data: errorTranscriptions } = await supabase
      .from('sdr_transcriptions')
      .select('call_id')
      .eq('status', 'error')

    const errorCallIds = (errorTranscriptions || []).map((t) => t.call_id)

    // Merge: calls without any transcription + calls with error status
    const callsToProcess = [
      ...calls.filter((c) => !errorCallIds.includes(c.id)),
      ...calls.filter((c) => errorCallIds.includes(c.id)),
    ]

    // Deduplicate
    const uniqueCalls = Array.from(
      new Map(callsToProcess.map((c) => [c.id, c])).values()
    )

    let processed = 0
    let errors = 0

    // Process sequentially to avoid rate limits
    for (const call of uniqueCalls) {
      try {
        console.log(
          `[transcriptions/batch] Processing call ${call.id} (${processed + 1}/${uniqueCalls.length})`
        )

        const startTime = Date.now()

        // Upsert transcription record
        const { data: existing } = await supabase
          .from('sdr_transcriptions')
          .select('id')
          .eq('call_id', call.id)
          .single()

        let transcriptionId: string

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
          const { data: newT, error: insErr } = await supabase
            .from('sdr_transcriptions')
            .insert({
              call_id: call.id,
              status: 'transcribing',
              started_at: new Date().toISOString(),
            })
            .select('id')
            .single()

          if (insErr || !newT) {
            throw new Error(`Insert failed: ${insErr?.message}`)
          }
          transcriptionId = newT.id
        }

        // Get audio URL
        let audioUrl = call.recording_url
        if (audioUrl.includes('/storage/v1/object/public/')) {
          const pathMatch = audioUrl.match(/\/sdr-recordings\/(.+)$/)
          if (pathMatch) {
            audioUrl = await getSignedRecordingUrl(pathMatch[1])
          }
        } else if (!audioUrl.startsWith('http')) {
          audioUrl = await getSignedRecordingUrl(audioUrl)
        }

        // Transcribe
        const { text, duration } = await transcribeAudio(audioUrl)

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

        // Get lead context
        const { data: lead } = await supabase
          .from('sdr_leads')
          .select('nome, empresa, cargo')
          .eq('id', call.lead_id)
          .single()

        // Analyze
        const analysis = await analyzeCall(text, {
          nome: lead?.nome || 'Desconhecido',
          empresa: lead?.empresa || undefined,
          cargo: lead?.cargo || undefined,
        })

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

        processed++
        console.log(
          `[transcriptions/batch] Completed call ${call.id} in ${processingTimeMs}ms`
        )
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        console.error(
          `[transcriptions/batch] Error processing call ${call.id}:`,
          msg
        )

        // Mark as error
        await supabase
          .from('sdr_transcriptions')
          .update({
            status: 'error',
            error_message: msg,
          })
          .eq('call_id', call.id)

        errors++
      }
    }

    return NextResponse.json({
      processed,
      errors,
      total: uniqueCalls.length,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[transcriptions/batch] Unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
