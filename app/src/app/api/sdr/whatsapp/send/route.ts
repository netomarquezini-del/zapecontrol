import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { sendWhatsAppMessage } from '@/lib/sdr/whatsapp-client'

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

    // Get lead phone
    const { data: lead, error: leadError } = await supabase
      .from('sdr_leads')
      .select('id, telefone, nome')
      .eq('id', lead_id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead nao encontrado' }, { status: 404 })
    }

    if (!lead.telefone) {
      return NextResponse.json({ error: 'Lead sem telefone cadastrado' }, { status: 400 })
    }

    // Send via WhatsApp
    const result = await sendWhatsAppMessage(lead.telefone, content, media_url)

    if (!result.success) {
      console.error('[api/sdr/whatsapp/send] Send failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Falha ao enviar mensagem' },
        { status: 502 }
      )
    }

    // Save message to database
    const { data: message, error: msgError } = await supabase
      .from('sdr_messages')
      .insert({
        lead_id,
        sdr_user_id: body.sdr_user_id || null,
        channel: 'whatsapp',
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
      console.error('[api/sdr/whatsapp/send] DB save error:', msgError.message)
      // Message was sent but DB save failed - still return success
    }

    // Create interaction entry
    await supabase.from('sdr_interactions').insert({
      lead_id,
      sdr_user_id: body.sdr_user_id || null,
      type: 'message',
      summary: `WhatsApp enviado: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
      metadata: { channel: 'whatsapp', direction: 'outbound', provider: result.provider },
      reference_id: message?.id || null,
    })

    // Update lead last_contact_at and increment total_messages
    await supabase
      .from('sdr_leads')
      .update({
        last_contact_at: new Date().toISOString(),
        total_messages: (lead as Record<string, unknown>).total_messages
          ? ((lead as Record<string, unknown>).total_messages as number) + 1
          : 1,
      })
      .eq('id', lead_id)

    return NextResponse.json({
      message_id: message?.id || null,
      status: 'sent',
      provider: result.provider,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/whatsapp/send] unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
