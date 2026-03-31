import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { getTwilioClient } from '@/lib/sdr/twilio-client'
import twilio from 'twilio'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const batchId = url.searchParams.get('batch_id')
    const leadId = url.searchParams.get('lead_id')

    // Parse form data (body can only be consumed once)
    const formData = await request.formData()
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    // Validate Twilio signature if present
    const twilioSignature = request.headers.get('x-twilio-signature')
    const authToken = process.env.TWILIO_AUTH_TOKEN
    if (twilioSignature && authToken) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
      const requestUrl = `${baseUrl}${url.pathname}${url.search}`
      const isValid = twilio.validateRequest(authToken, twilioSignature, requestUrl, params)

      if (!isValid) {
        console.warn('[webhook] Invalid Twilio signature')
        // In production, reject invalid signatures. For development, we log and continue.
        // return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
      }
    }

    return await handleWebhook(params, type, batchId, leadId)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[webhook] Error:', message)
    // Return 200 to Twilio to prevent retries
    return new NextResponse('<Response/>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  }
}

async function handleWebhook(
  params: Record<string, string>,
  type: string | null,
  batchId: string | null,
  leadId: string | null
) {
  const supabase = getServiceSupabase()

  // Handle recording callback
  if (type === 'recording') {
    const recordingUrl = params['RecordingUrl']
    const callSid = params['CallSid']
    if (recordingUrl && callSid) {
      await supabase
        .from('sdr_calls')
        .update({ recording_url: `${recordingUrl}.mp3` })
        .eq('external_call_id', callSid)
    }
    return new NextResponse('<Response/>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  // Handle call status callback
  const callSid = params['CallSid']
  const callStatus = params['CallStatus']?.toLowerCase()
  const callDuration = params['CallDuration']
  const answeredBy = params['AnsweredBy']

  if (!callSid) {
    return new NextResponse('<Response/>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  console.log(`[webhook] CallSid=${callSid} Status=${callStatus} Duration=${callDuration} AnsweredBy=${answeredBy}`)

  // Map Twilio status to our status
  const statusMap: Record<string, string> = {
    initiated: 'initiated',
    queued: 'initiated',
    ringing: 'ringing',
    'in-progress': 'answered',
    completed: 'completed',
    busy: 'busy',
    'no-answer': 'no_answer',
    failed: 'failed',
    canceled: 'canceled',
  }

  const mappedStatus = statusMap[callStatus] || callStatus

  // Update call record
  const updateData: Record<string, unknown> = {
    status: mappedStatus,
  }

  if (mappedStatus === 'answered') {
    updateData.answered_at = new Date().toISOString()
  }

  if (mappedStatus === 'completed' || mappedStatus === 'no_answer' || mappedStatus === 'busy' || mappedStatus === 'failed') {
    updateData.ended_at = new Date().toISOString()
    if (callDuration) {
      updateData.duration_seconds = parseInt(callDuration, 10)
    }
  }

  // If answered by machine, mark as caixa_postal
  if (answeredBy === 'machine_start' || answeredBy === 'machine_end_beep' || answeredBy === 'machine_end_silence') {
    updateData.disposition = 'caixa_postal'
  }

  await supabase
    .from('sdr_calls')
    .update(updateData)
    .eq('external_call_id', callSid)

  // If this call was answered, hang up all other pending calls in the same batch
  if (mappedStatus === 'answered' && batchId) {
    await hangupOtherCallsInBatch(supabase, batchId, callSid)
  }

  // If no_answer or busy or failed, update lead status if all calls in batch are done
  if (['completed', 'no_answer', 'busy', 'failed', 'canceled'].includes(mappedStatus) && leadId) {
    // Update lead status to tentativa if not already in a later stage
    const { data: lead } = await supabase
      .from('sdr_leads')
      .select('status')
      .eq('id', leadId)
      .single()

    if (lead && lead.status === 'novo') {
      await supabase
        .from('sdr_leads')
        .update({ status: 'tentativa' })
        .eq('id', leadId)
    }
  }

  // Return TwiML for answered calls — connect to conference
  if (mappedStatus === 'answered') {
    // Get the sdr_user_id from the call record
    const { data: callRecord } = await supabase
      .from('sdr_calls')
      .select('sdr_user_id')
      .eq('external_call_id', callSid)
      .single()

    const sdrId = callRecord?.sdr_user_id || 'default'
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR">Esta ligacao pode ser gravada para fins de qualidade.</Say>
  <Dial>
    <Conference startConferenceOnEnter="true" endConferenceOnExit="false" waitUrl="">sdr-room-${sdrId}</Conference>
  </Dial>
</Response>`

    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  return new NextResponse('<Response/>', {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

async function hangupOtherCallsInBatch(
  supabase: ReturnType<typeof getServiceSupabase>,
  batchId: string,
  answeredCallSid: string
) {
  try {
    const twilioClient = getTwilioClient()

    // Find all other calls in this batch that are not the answered one
    const { data: otherCalls } = await supabase
      .from('sdr_calls')
      .select('external_call_id')
      .filter('notes', 'cs', `"batch_id":"${batchId}"`)
      .neq('external_call_id', answeredCallSid)
      .in('status', ['initiated', 'ringing'])

    if (otherCalls && otherCalls.length > 0) {
      const hangupPromises = otherCalls.map(async (call) => {
        if (call.external_call_id) {
          try {
            await twilioClient.calls(call.external_call_id).update({ status: 'completed' })
          } catch (e) {
            console.warn(`[webhook] Could not hangup ${call.external_call_id}:`, e)
          }
        }
      })
      await Promise.all(hangupPromises)

      // Update DB records
      const sids = otherCalls
        .map((c) => c.external_call_id)
        .filter(Boolean) as string[]
      if (sids.length > 0) {
        await supabase
          .from('sdr_calls')
          .update({ status: 'canceled', ended_at: new Date().toISOString() })
          .in('external_call_id', sids)
      }
    }
  } catch (err) {
    console.error('[webhook] Error hanging up batch calls:', err)
  }
}
