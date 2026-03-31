import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface CopilotContext {
  leadName: string
  leadCompany?: string
  leadCargo?: string
  previousInteractions?: string
  currentTranscript: string
}

export interface CopilotSuggestion {
  type: 'tip' | 'objection' | 'next_step' | 'warning'
  content: string
  confidence: number
}

/**
 * Generate copilot suggestions based on conversation context.
 * Uses streaming for real-time response via async generator.
 */
export async function* generateSuggestions(context: CopilotContext): AsyncGenerator<string> {
  const stream = await anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    system: `You are an AI copilot for an SDR (Sales Development Representative) during a live phone call.
Your role is to provide BRIEF, ACTIONABLE suggestions in real-time.

RULES:
- Keep suggestions SHORT (1-2 sentences max)
- Focus on: objection handling, next steps, rapport building
- Respond in Portuguese (BR)
- Format as JSON array of suggestions: [{"type": "tip|objection|next_step|warning", "content": "...", "confidence": 0.0-1.0}]
- Only suggest when there's something valuable to say
- If the conversation is flowing well, respond with empty array []

LEAD CONTEXT:
- Nome: ${context.leadName}
- Empresa: ${context.leadCompany || 'N/A'}
- Cargo: ${context.leadCargo || 'N/A'}
${context.previousInteractions ? `- Historico: ${context.previousInteractions}` : ''}`,
    messages: [{
      role: 'user',
      content: `Transcricao atual da ligacao:\n\n${context.currentTranscript}\n\nGere sugestoes para o SDR baseado nesta conversa.`
    }]
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text
    }
  }
}
