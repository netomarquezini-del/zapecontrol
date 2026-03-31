import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { getTwilioClient } from '@/lib/sdr/twilio-client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { call_sids } = body as { call_sids: string[] }

    if (!call_sids || !Array.isArray(call_sids) || call_sids.length === 0) {
      return NextResponse.json(
        { error: 'call_sids is required and must be a non-empty array' },
        { status: 400 }
      )
    }

    const twilioClient = getTwilioClient()
    const supabase = getServiceSupabase()

    const results: { sid: string; success: boolean; error?: string }[] = []

    const hangupPromises = call_sids.map(async (sid) => {
      try {
        await twilioClient.calls(sid).update({ status: 'completed' })
        return { sid, success: true }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        console.error(`[hangup] Error hanging up ${sid}:`, msg)
        return { sid, success: false, error: msg }
      }
    })

    const hangupResults = await Promise.all(hangupPromises)
    results.push(...hangupResults)

    // Update DB records for all SIDs
    await supabase
      .from('sdr_calls')
      .update({
        status: 'canceled',
        ended_at: new Date().toISOString(),
      })
      .in('external_call_id', call_sids)

    return NextResponse.json({ results })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[hangup] Unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
