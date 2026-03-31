import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { processRecording } from '@/lib/sdr/recording-storage'

export const dynamic = 'force-dynamic'

/**
 * POST: Twilio recording status callback
 * Called by Twilio when recording status changes.
 * When status = 'completed', downloads from Twilio and uploads to Supabase Storage.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    const recordingSid = params['RecordingSid']
    const recordingUrl = params['RecordingUrl']
    const callSid = params['CallSid']
    const recordingStatus = params['RecordingStatus']

    console.log(
      `[api/sdr/calls/recording] RecordingSid=${recordingSid} CallSid=${callSid} Status=${recordingStatus}`
    )

    if (!recordingSid || !callSid) {
      // Return 200 to prevent Twilio retries
      return NextResponse.json({ ok: true })
    }

    // Only process completed recordings
    if (recordingStatus !== 'completed') {
      return NextResponse.json({ ok: true, status: recordingStatus })
    }

    if (!recordingUrl) {
      console.warn('[api/sdr/calls/recording] No RecordingUrl for completed recording')
      return NextResponse.json({ ok: true })
    }

    const supabase = getServiceSupabase()

    // Find the call record by external_call_id (Twilio CallSid)
    const { data: callRecord, error: findError } = await supabase
      .from('sdr_calls')
      .select('id')
      .eq('external_call_id', callSid)
      .single()

    if (findError || !callRecord) {
      console.error(
        `[api/sdr/calls/recording] Could not find call for CallSid=${callSid}:`,
        findError?.message
      )
      // Still return 200 to avoid Twilio retries
      return NextResponse.json({ ok: false, error: 'Call not found' })
    }

    // Process recording: download from Twilio, upload to Supabase Storage
    try {
      const storageUrl = await processRecording(callRecord.id, recordingUrl, recordingSid)

      console.log(
        `[api/sdr/calls/recording] Successfully stored recording for call ${callRecord.id}: ${storageUrl}`
      )

      return NextResponse.json({ ok: true, url: storageUrl })
    } catch (processError: unknown) {
      const msg = processError instanceof Error ? processError.message : 'Unknown error'
      console.error(`[api/sdr/calls/recording] Error processing recording:`, msg)

      // Fallback: store the Twilio URL directly so we don't lose the recording
      await supabase
        .from('sdr_calls')
        .update({ recording_url: `${recordingUrl}.mp3` })
        .eq('id', callRecord.id)

      return NextResponse.json({ ok: false, error: msg, fallback: true })
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/calls/recording] Unexpected:', message)
    // Always return 200 to prevent Twilio retries
    return NextResponse.json({ ok: false, error: message })
  }
}
