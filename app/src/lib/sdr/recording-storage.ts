/**
 * Download recording from Twilio and upload to Supabase Storage.
 */

import { getServiceSupabase } from '@/lib/supabase'

const BUCKET = 'sdr-recordings'

/**
 * Download a recording from Twilio, upload to Supabase Storage,
 * and update the sdr_calls record with the storage URL.
 */
export async function processRecording(
  callId: string,
  recordingUrl: string,
  recordingSid: string
): Promise<string> {
  const supabase = getServiceSupabase()

  // 1. Download audio from Twilio
  const audioUrl = recordingUrl.endsWith('.mp3') ? recordingUrl : `${recordingUrl}.mp3`

  // Twilio requires Basic Auth for recording downloads
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  const headers: Record<string, string> = {}
  if (accountSid && authToken) {
    headers['Authorization'] = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`
  }

  const response = await fetch(audioUrl, { headers })

  if (!response.ok) {
    throw new Error(`Failed to download recording: ${response.status} ${response.statusText}`)
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer())

  // 2. Upload to Supabase Storage
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const storagePath = `recordings/${year}/${month}/${callId}.mp3`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Failed to upload recording to storage: ${uploadError.message}`)
  }

  // 3. Get public URL (or signed if bucket is private)
  let storageUrl: string

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath)

  if (publicUrlData?.publicUrl) {
    storageUrl = publicUrlData.publicUrl
  } else {
    // Fallback to signed URL
    storageUrl = await getSignedRecordingUrl(storagePath)
  }

  // 4. Update sdr_calls with storage URL
  const { error: updateError } = await supabase
    .from('sdr_calls')
    .update({ recording_url: storageUrl })
    .eq('id', callId)

  if (updateError) {
    console.error(`[recording-storage] Failed to update call ${callId}:`, updateError.message)
    // Don't throw — the file is uploaded, just the DB update failed
  }

  console.log(`[recording-storage] Processed recording ${recordingSid} for call ${callId} -> ${storagePath}`)

  // 5. Return the storage URL
  return storageUrl
}

/**
 * Generate a signed URL with 1 hour expiration for a recording path.
 */
export async function getSignedRecordingUrl(path: string): Promise<string> {
  const supabase = getServiceSupabase()

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600) // 1 hour

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${error?.message || 'No URL returned'}`)
  }

  return data.signedUrl
}
