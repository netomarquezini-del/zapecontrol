import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const sdrId = url.searchParams.get('sdr_id') || 'default'

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR">Esta ligacao pode ser gravada para fins de qualidade.</Say>
  <Dial>
    <Conference startConferenceOnEnter="true" endConferenceOnExit="false" waitUrl="" beep="false">sdr-room-${sdrId}</Conference>
  </Dial>
</Response>`

    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[twiml] Error:', message)

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR">Ocorreu um erro. Tente novamente.</Say>
  <Hangup/>
</Response>`

    return new NextResponse(errorTwiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  }
}
