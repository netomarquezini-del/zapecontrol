import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { getTwilioClient, formatPhoneBR } from '@/lib/sdr/twilio-client'
import { selectBinaNumber } from '@/lib/sdr/bina-selector'

export const dynamic = 'force-dynamic'

const MAX_SIMULTANEOUS = 5

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lead_ids, sdr_user_id } = body as {
      lead_ids: string[]
      sdr_user_id: string
    }

    if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
      return NextResponse.json(
        { error: 'lead_ids is required and must be a non-empty array' },
        { status: 400 }
      )
    }

    if (lead_ids.length > MAX_SIMULTANEOUS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_SIMULTANEOUS} simultaneous calls allowed` },
        { status: 400 }
      )
    }

    if (!sdr_user_id) {
      return NextResponse.json(
        { error: 'sdr_user_id is required' },
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()
    const twilioClient = getTwilioClient()

    // Generate a batch ID to group these simultaneous calls
    const batchId = crypto.randomUUID()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || ''

    // Fetch all leads
    const { data: leads, error: leadsError } = await supabase
      .from('sdr_leads')
      .select('id, nome, telefone')
      .in('id', lead_ids)

    if (leadsError || !leads) {
      console.error('[api/sdr/calls/dial] Error fetching leads:', leadsError?.message)
      return NextResponse.json({ error: 'Erro ao buscar leads' }, { status: 500 })
    }

    const results: {
      lead_id: string
      call_id: string | null
      call_sid: string | null
      number_used: string | null
      error?: string
    }[] = []

    // Dial each lead in parallel
    const dialPromises = leads.map(async (lead) => {
      try {
        // Select BINA number
        const bina = await selectBinaNumber(lead.telefone)
        if (!bina) {
          return {
            lead_id: lead.id,
            call_id: null,
            call_sid: null,
            number_used: null,
            error: 'No available BINA number',
          }
        }

        const toNumber = formatPhoneBR(lead.telefone)

        // Create outbound call via Twilio
        const call = await twilioClient.calls.create({
          from: bina.number,
          to: toNumber,
          url: `${baseUrl}/api/sdr/calls/twiml?sdr_id=${sdr_user_id}`,
          statusCallback: `${baseUrl}/api/sdr/calls/webhook?batch_id=${batchId}&lead_id=${lead.id}`,
          statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
          statusCallbackMethod: 'POST',
          record: true,
          recordingStatusCallback: `${baseUrl}/api/sdr/calls/webhook?type=recording&lead_id=${lead.id}`,
          recordingStatusCallbackMethod: 'POST',
          machineDetection: 'Enable',
          machineDetectionTimeout: 5,
        })

        // Create sdr_calls record
        const { data: callRecord, error: insertError } = await supabase
          .from('sdr_calls')
          .insert({
            lead_id: lead.id,
            sdr_user_id,
            number_id: bina.numberId,
            direction: 'outbound',
            status: 'initiated',
            disposition: null,
            external_call_id: call.sid,
            started_at: new Date().toISOString(),
            notes: JSON.stringify({ batch_id: batchId }),
          })
          .select('id')
          .single()

        if (insertError) {
          console.error('[api/sdr/calls/dial] Insert call error:', insertError.message)
        }

        // Create sdr_interactions entry
        await supabase.from('sdr_interactions').insert({
          lead_id: lead.id,
          sdr_user_id,
          type: 'call',
          summary: `Ligacao iniciada para ${lead.nome} (${toNumber})`,
          metadata: {
            batch_id: batchId,
            call_sid: call.sid,
            bina_number: bina.number,
          },
          reference_id: callRecord?.id || null,
        })

        // Update lead last_contact_at
        await supabase
          .from('sdr_leads')
          .update({
            last_contact_at: new Date().toISOString(),
            total_calls: (lead as Record<string, unknown>).total_calls
              ? Number((lead as Record<string, unknown>).total_calls) + 1
              : 1,
          })
          .eq('id', lead.id)

        return {
          lead_id: lead.id,
          call_id: callRecord?.id || null,
          call_sid: call.sid,
          number_used: bina.number,
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        console.error(`[api/sdr/calls/dial] Error dialing lead ${lead.id}:`, msg)
        return {
          lead_id: lead.id,
          call_id: null,
          call_sid: null,
          number_used: null,
          error: msg,
        }
      }
    })

    const dialResults = await Promise.all(dialPromises)
    results.push(...dialResults)

    return NextResponse.json({
      batch_id: batchId,
      calls: results,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/calls/dial] Unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
