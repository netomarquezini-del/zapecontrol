import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { generateSuggestions } from '@/lib/sdr/copilot-engine'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lead_id, transcript } = body

    if (!lead_id || !transcript) {
      return new Response(
        JSON.stringify({ error: 'lead_id e transcript sao obrigatorios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = getServiceSupabase()

    // Fetch lead context
    const { data: lead, error: leadError } = await supabase
      .from('sdr_leads')
      .select('nome, empresa, cargo')
      .eq('id', lead_id)
      .single()

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: 'Lead nao encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Fetch recent interactions for context (last 5)
    const { data: interactions } = await supabase
      .from('sdr_interactions')
      .select('type, summary, created_at')
      .eq('lead_id', lead_id)
      .order('created_at', { ascending: false })
      .limit(5)

    const previousInteractions = interactions && interactions.length > 0
      ? interactions
          .map((i) => `[${i.type}] ${i.summary || 'Sem resumo'}`)
          .join(' | ')
      : undefined

    // Create SSE stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = generateSuggestions({
            leadName: lead.nome,
            leadCompany: lead.empresa ?? undefined,
            leadCargo: lead.cargo ?? undefined,
            previousInteractions,
            currentTranscript: transcript,
          })

          for await (const chunk of generator) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Stream error'
          console.error('[api/sdr/copilot/stream] Error:', message)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/copilot/stream] Unexpected:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
