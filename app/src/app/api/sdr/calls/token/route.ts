import { NextResponse } from 'next/server'
import twilio from 'twilio'

export const dynamic = 'force-dynamic'

const AccessToken = twilio.jwt.AccessToken
const VoiceGrant = AccessToken.VoiceGrant

export async function GET() {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const apiKey = process.env.TWILIO_API_KEY
    const apiSecret = process.env.TWILIO_API_SECRET
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID

    if (!accountSid || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Twilio credentials not configured' },
        { status: 500 }
      )
    }

    // Identity for this token — in production, use the authenticated user's ID
    const identity = `sdr-agent-${Date.now()}`

    const token = new AccessToken(accountSid, apiKey, apiSecret, {
      identity,
      ttl: 3600, // 1 hour
    })

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true,
    })

    token.addGrant(voiceGrant)

    return NextResponse.json({
      token: token.toJwt(),
      identity,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/calls/token] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
