import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { sendWhatsAppTemplate } from '@/lib/sdr/whatsapp-client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    const body = await request.json()
    const { lead_id, template_id, variables } = body

    if (!lead_id || !template_id) {
      return NextResponse.json(
        { error: 'lead_id e template_id sao obrigatorios' },
        { status: 400 }
      )
    }

    // Fetch template
    const { data: template, error: tmplError } = await supabase
      .from('sdr_message_templates')
      .select('*')
      .eq('id', template_id)
      .eq('is_active', true)
      .single()

    if (tmplError || !template) {
      return NextResponse.json({ error: 'Template nao encontrado ou inativo' }, { status: 404 })
    }

    // Get lead
    const { data: lead, error: leadError } = await supabase
      .from('sdr_leads')
      .select('id, telefone, nome, empresa')
      .eq('id', lead_id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead nao encontrado' }, { status: 404 })
    }

    if (!lead.telefone) {
      return NextResponse.json({ error: 'Lead sem telefone cadastrado' }, { status: 400 })
    }

    // Replace {{variable}} placeholders
    let renderedContent = template.content as string
    const vars: Record<string, string> = {
      nome: lead.nome || '',
      empresa: lead.empresa || '',
      ...((variables as Record<string, string>) || {}),
    }

    for (const [key, value] of Object.entries(vars)) {
      renderedContent = renderedContent.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, 'gi'),
        value
      )
    }

    // Send rendered message
    const result = await sendWhatsAppTemplate(lead.telefone, renderedContent)

    if (!result.success) {
      console.error('[api/sdr/whatsapp/send-template] Send failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Falha ao enviar template' },
        { status: 502 }
      )
    }

    // Save message with template reference
    const { data: message, error: msgError } = await supabase
      .from('sdr_messages')
      .insert({
        lead_id,
        sdr_user_id: body.sdr_user_id || null,
        channel: 'whatsapp',
        direction: 'outbound',
        status: 'sent',
        content: renderedContent,
        template_id,
        external_message_id: result.externalMessageId || null,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (msgError) {
      console.error('[api/sdr/whatsapp/send-template] DB save error:', msgError.message)
    }

    // Create interaction
    await supabase.from('sdr_interactions').insert({
      lead_id,
      sdr_user_id: body.sdr_user_id || null,
      type: 'message',
      summary: `Template WhatsApp "${template.name}": ${renderedContent.substring(0, 80)}...`,
      metadata: { channel: 'whatsapp', direction: 'outbound', template_id, template_name: template.name },
      reference_id: message?.id || null,
    })

    // Increment template usage
    await supabase
      .from('sdr_message_templates')
      .update({ usage_count: ((template.usage_count as number) || 0) + 1 })
      .eq('id', template_id)

    return NextResponse.json({
      message_id: message?.id || null,
      status: 'sent',
      rendered_content: renderedContent,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/whatsapp/send-template] unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
