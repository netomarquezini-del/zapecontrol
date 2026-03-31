import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// ── POST: make a test call ─────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to_number } = body

    if (!to_number) {
      return NextResponse.json(
        { success: false, error: 'Campo obrigatorio: to_number' },
        { status: 400 }
      )
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (!accountSid || !authToken) {
      return NextResponse.json({
        success: false,
        error: 'Credenciais Twilio nao configuradas.',
      })
    }

    // Get a number from the pool to use as caller ID
    const supabase = getServiceSupabase()
    const { data: numbers, error: dbError } = await supabase
      .from('sdr_numbers')
      .select('number')
      .eq('status', 'ativo')
      .order('call_count', { ascending: true })
      .limit(1)

    if (dbError) {
      return NextResponse.json({
        success: false,
        error: `Erro ao buscar numero: ${dbError.message}`,
      })
    }

    if (!numbers || numbers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum numero ativo no pool. Adicione um numero primeiro.',
      })
    }

    const fromNumber = numbers[0].number
    // Format numbers for Twilio (E.164)
    const formattedFrom = fromNumber.startsWith('+') ? fromNumber : `+55${fromNumber}`
    const cleanTo = to_number.replace(/\D/g, '')
    const formattedTo = cleanTo.startsWith('55') ? `+${cleanTo}` : `+55${cleanTo}`

    const client = twilio(accountSid, authToken)

    const call = await client.calls.create({
      to: formattedTo,
      from: formattedFrom,
      // TwiML that plays a short message and hangs up
      twiml: '<Response><Say language="pt-BR">Teste de chamada do SDR Station realizado com sucesso.</Say><Hangup/></Response>',
      timeout: 20,
    })

    return NextResponse.json({
      success: true,
      call_sid: call.sid,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({
      success: false,
      error: `Falha ao iniciar chamada: ${message}`,
    })
  }
}
