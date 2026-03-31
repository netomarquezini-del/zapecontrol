import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface CallAnalysis {
  summary: string
  score: number
  objections: {
    objection: string
    handling: string
    quality: 'good' | 'average' | 'poor'
  }[]
  improvements: string[]
  next_steps: string
}

/**
 * Analyze call transcription using Claude API
 * @param transcription - Full text transcription
 * @param leadContext - Lead info (name, company, role)
 * @returns Structured analysis
 */
export async function analyzeCall(
  transcription: string,
  leadContext: { nome: string; empresa?: string; cargo?: string }
): Promise<CallAnalysis> {
  const leadInfo = [
    `Nome: ${leadContext.nome}`,
    leadContext.empresa ? `Empresa: ${leadContext.empresa}` : null,
    leadContext.cargo ? `Cargo: ${leadContext.cargo}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const prompt = `Voce e um analista de qualidade de ligacoes de SDR (Sales Development Representative). Analise a transcricao da ligacao abaixo e retorne uma avaliacao estruturada em JSON.

## Contexto do Lead
${leadInfo}

## Transcricao da Ligacao
${transcription}

## Instrucoes
Analise a ligacao considerando os seguintes criterios para a nota (score):
- 1-3 (Ruim): Sem rapport, objecoes ignoradas, sem proximo passo definido, tom inadequado
- 4-6 (Medio): Rapport basico, algumas objecoes tratadas, proximos passos vagos
- 7-9 (Bom): Bom rapport, objecoes bem tratadas, proximos passos claros e definidos
- 10 (Excepcional): Rapport excelente, todas objecoes superadas com maestria, compromisso firme do lead

Retorne APENAS um JSON valido (sem markdown, sem code blocks) com a seguinte estrutura:
{
  "summary": "Resumo de 3-5 frases sobre a ligacao",
  "score": <numero de 1 a 10>,
  "objections": [
    {
      "objection": "A objecao levantada pelo lead",
      "handling": "Como o SDR lidou com a objecao",
      "quality": "good" | "average" | "poor"
    }
  ],
  "improvements": ["Ponto de melhoria 1", "Ponto de melhoria 2"],
  "next_steps": "Sugestao de proximos passos baseada na conversa"
}

Se nao houver objecoes, retorne um array vazio para "objections".
Se a transcricao for muito curta ou ininteligivel, faca o melhor possivel com as informacoes disponiveis.`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  // Extract text from response
  const textBlock = response.content.find((block) => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  // Parse JSON — handle possible markdown code blocks
  let jsonStr = textBlock.text.trim()
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  const analysis: CallAnalysis = JSON.parse(jsonStr)

  // Validate and clamp score
  analysis.score = Math.max(1, Math.min(10, Math.round(analysis.score)))

  // Ensure arrays exist
  if (!Array.isArray(analysis.objections)) {
    analysis.objections = []
  }
  if (!Array.isArray(analysis.improvements)) {
    analysis.improvements = []
  }

  return analysis
}
