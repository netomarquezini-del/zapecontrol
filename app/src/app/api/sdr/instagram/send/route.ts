import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { sendInstagramMessage } from '@/lib/sdr/instagram-client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    const body = await request.json()
    const { lead_id, content, media_url } = body

    if (!lead_id || !content) {
      return NextResponse.json(
        { error: 'lead_id e content sao obrigatorios' },
        { status: 400 }
      )
    }

    // Get lead instagram info
    const { data: lead, error: leadError } = await supabase
      .from('sdr_leads')
      .select('id, nome, custom_fields')
      .eq('id', lead_id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead nao encontrado' }, { status: 404 })
    }

    // Instagram recipient ID stored in custom_fields
    const customFields = (lead.custom_fields || {}) as Record<string, string>
    const instagramId = customFields.instagram_id || customFields.instagram_username
    if (!instagramId) {
      return NextResponse.json(
        { error: 'Lead sem Instagram ID configurado (custom_fields.instagram_id)' },
        { status: 400 }
      )
    }

    // Send via Instagram
    const result = await sendInstagramMessage(instagramId, content, media_url)

    if (!result.success) {
      console.error('[api/sdr/instagram/send] Send failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Falha ao enviar mensagem Instagram' },
        { status: 502 }
      )
    }

    // Save message
    const { data: message, error: msgError } = await supabase
      .from('sdr_messages')
      .insert({
        lead_id,
        sdr_user_id: body.sdr_user_id || null,
        channel: 'instagram',
        direction: 'outbound',
        status: 'sent',
        content,
        template_id: null,
        external_message_id: result.externalMessageId || null,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (msgError) {
      console.error('[api/sdr/instagram/send] DB save error:', msgError.message)
    }

    // Create interaction
    await supabase.from('sdr_interactions').insert({
      lead_id,
      sdr_user_id: body.sdr_user_id || null,
      type: 'message',
      summary: `Instagram DM enviado: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
      metadata: { channel: 'instagram', direction: 'outbound' },
      reference_id: message?.id || null,
    })

    return NextResponse.json({
      message_id: message?.id || null,
      status: 'sent',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/instagram/send] unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
