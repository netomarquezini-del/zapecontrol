import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * POST: One-time setup for SDR Station
 * Creates required Supabase Storage buckets
 * Call once after first deploy: POST /api/sdr/setup
 */
export async function POST() {
  const sb = getServiceSupabase()
  const results: Record<string, string> = {}

  // Create sdr-recordings bucket
  const { data: buckets } = await sb.storage.listBuckets()
  const recordingsExists = buckets?.some(b => b.name === 'sdr-recordings')

  if (!recordingsExists) {
    const { error } = await sb.storage.createBucket('sdr-recordings', {
      public: false,
      fileSizeLimit: 52428800, // 50MB max per recording
      allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm']
    })
    if (error) {
      results['sdr-recordings'] = `error: ${error.message}`
    } else {
      results['sdr-recordings'] = 'created'
    }
  } else {
    results['sdr-recordings'] = 'already exists'
  }

  // Verify SDR tables exist
  const { error: tableCheck } = await sb.from('sdr_leads').select('id').limit(1)
  results['database'] = tableCheck ? `tables missing: ${tableCheck.message}` : 'ok'

  // Check env vars
  const requiredVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY']
  const missingVars = requiredVars.filter(v => !process.env[v])
  results['env_vars'] = missingVars.length > 0 ? `missing: ${missingVars.join(', ')}` : 'all configured'

  return NextResponse.json({
    success: true,
    message: 'SDR Station setup check complete',
    results
  })
}
