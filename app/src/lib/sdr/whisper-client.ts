import OpenAI, { toFile } from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * Transcribe audio file using OpenAI Whisper API
 * @param audioUrl - URL of the audio file (Supabase Storage signed URL)
 * @returns Transcribed text and duration in seconds
 */
export async function transcribeAudio(
  audioUrl: string
): Promise<{ text: string; duration: number }> {
  // 1. Download audio from URL into Buffer
  const response = await fetch(audioUrl)

  if (!response.ok) {
    throw new Error(
      `Failed to download audio: ${response.status} ${response.statusText}`
    )
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer())

  // 2. Create File object from buffer
  const audioFile = await toFile(audioBuffer, 'recording.mp3', {
    type: 'audio/mpeg',
  })

  // 3. Call Whisper API
  const transcription = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file: audioFile,
    language: 'pt',
    response_format: 'verbose_json',
  })

  // 4. Return text and duration
  return {
    text: transcription.text,
    duration: transcription.duration ?? 0,
  }
}
