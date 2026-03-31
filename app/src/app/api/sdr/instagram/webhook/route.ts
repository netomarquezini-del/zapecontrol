import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const META_APP_SECRET = process.env.META_APP_SECRET || ''
const META_WEBHOOK_VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || ''

/**
 * Webhook verification (GET) - Meta sends this to validate the endpoint.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === META_WEBHOOK_VERIFY_TOKEN) {
    console.log('[instagram/webhook] Verification successful')
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

/**
 * Receive Instagram DM webhook from Meta.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()

    // Validate signature if secret is configured
    if (META_APP_SECRET) {
      const signature = request.headers.get('x-hub-signature-256')
      if (!signature) {
        console.warn('[instagram/webhook] Missing X-Hub-Signature-256')
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
      }

      const expectedSig = 'sha256=' + crypto
        .createHmac('sha256', META_APP_SECRET)
        .update(rawBody)
        .digest('hex')

      if (signature !== expectedSig) {
        console.warn('[instagram/webhook] Invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const body = JSON.parse(rawBody)
    const supabase = getServiceSupabase()

    // Process each entry from Meta webhook
    const entries = body.entry || []
    for (const entry of entries) {
      const messaging = entry.messaging || []
      for (const event of messaging) {
        // Only process messages (not read receipts, reactions, etc.)
        if (!event.message || event.message.is_echo) continue

        const senderId = event.sender?.id
        const content = event.message?.text || '[media]'
        const externalMessageId = event.message?.mid || null

        if (!senderId) continue

        // Find lead by Instagram ID in custom_fields
        const { data: leads } = await supabase
          .from('sdr_leads')
          .select('id, nome')
          .or(
            `custom_fields->>instagram_id.eq.${senderId},custom_fields->>instagram_username.eq.${senderId}`
          )
          .limit(1)

        const lead = leads?.[0]

        if (!lead) {
          console.warn('[instagram/webhook] No lead found for sender:', senderId)
          continue
        }

        // Save inbound message
        const { data: message, error: msgError } = await supabase
          .from('sdr_messages')
          .insert({
            lead_id: lead.id,
            sdr_user_id: null,
            channel: 'instagram',
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
          console.error('[instagram/webhook] DB save error:', msgError.message)
        }

        // Create interaction
        await supabase.from('sdr_interactions').insert({
          lead_id: lead.id,
          sdr_user_id: null,
          type: 'message',
          summary: `Instagram DM recebido: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
          metadata: { channel: 'instagram', direction: 'inbound', sender_id: senderId },
          reference_id: message?.id || null,
        })
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    console.error('[instagram/webhook] unexpected:', msg)
    return NextResponse.json({ status: 'error' }, { status: 200 })
  }
}
