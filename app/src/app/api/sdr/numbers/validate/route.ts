import { NextResponse } from 'next/server'
import twilio from 'twilio'

export const dynamic = 'force-dynamic'

// ── POST: validate Twilio credentials ──────────────────────
export async function POST() {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (!accountSid || !authToken) {
      return NextResponse.json({
        valid: false,
        error: 'Variaveis de ambiente TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN nao configuradas.',
      })
    }

    const client = twilio(accountSid, authToken)
    const account = await client.api.accounts(accountSid).fetch()

    return NextResponse.json({
      valid: true,
      account_name: account.friendlyName,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({
      valid: false,
      error: `Falha na validacao: ${message}`,
    })
  }
}
