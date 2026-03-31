import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * WhatsApp inbound webhook handler.
 * Supports both Evolution API and Twilio webhook formats.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    const body = await request.json()

    let phone: string | null = null
    let content: string | null = null
    let externalMessageId: string | null = null

    // Detect format: Evolution API
    if (body.data?.key?.remoteJid || body.instance) {
      // Evolution API webhook format
      const remoteJid = body.data?.key?.remoteJid || ''
      phone = remoteJid.replace(/@s\.whatsapp\.net$/, '').replace(/@c\.us$/, '')
      content = body.data?.message?.conversation
        || body.data?.message?.extendedTextMessage?.text
        || body.data?.message?.imageMessage?.caption
        || '[media]'
      externalMessageId = body.data?.key?.id || null
    }
    // Detect format: Twilio
    else if (body.From && body.From.startsWith('whatsapp:')) {
      phone = body.From.replace('whatsapp:', '').replace('+', '')
      content = body.Body || '[media]'
      externalMessageId = body.MessageSid || null
    }
    // Unknown format
    else {
      console.warn('[whatsapp/webhook] Unknown payload format:', JSON.stringify(body).substring(0, 500))
      return NextResponse.json({ status: 'ignored' }, { status: 200 })
    }

    if (!phone || !content) {
      return NextResponse.json({ status: 'ignored', reason: 'no phone or content' }, { status: 200 })
    }

    // Normalize phone: ensure it starts with 55
    const normalizedPhone = phone.startsWith('55') ? phone : `55${phone}`

    // Find matching lead by phone
    const { data: leads } = await supabase
      .from('sdr_leads')
      .select('id, nome, telefone')
      .or(`telefone.eq.${normalizedPhone},telefone.eq.+${normalizedPhone},telefone.eq.${phone}`)
      .limit(1)

    const lead = leads?.[0]

    if (!lead) {
      console.warn('[whatsapp/webhook] No lead found for phone:', normalizedPhone)
      // Still return 200 to acknowledge the webhook
      return NextResponse.json({ status: 'no_lead_match', phone: normalizedPhone })
    }

    // Save inbound message
    const { data: message, error: msgError } = await supabase
      .from('sdr_messages')
      .insert({
        lead_id: lead.id,
        sdr_user_id: null,
        channel: 'whatsapp',
        direction: 'inbound',
        status: 'delivered',
        content,
        template_id: null,
        external_message_id: externalMessageId,
        delivered_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (msgError) {
      console.error('[whatsapp/webhook] DB save error:', msgError.message)
    }

    // Create interaction entry
    await supabase.from('sdr_interactions').insert({
      lead_id: lead.id,
      sdr_user_id: null,
      type: 'message',
      summary: `WhatsApp recebido: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
      metadata: { channel: 'whatsapp', direction: 'inbound' },
      reference_id: message?.id || null,
    })

    return NextResponse.json({ status: 'ok', message_id: message?.id })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    console.error('[whatsapp/webhook] unexpected:', msg)
    // Always return 200 to prevent webhook retries
    return NextResponse.json({ status: 'error', error: msg }, { status: 200 })
  }
}
