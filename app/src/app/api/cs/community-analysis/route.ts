import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/joana/supabase'
import OpenAI from 'openai'

const COMMUNITY_GROUP_ID = '120363401620622735-group'
const SHOPEE_ADS_GROUP_IDS = [
  '120363422457783091-group',
  '120363407332110646-group',
  '120363407280170820-group',
  '120363404311146540-group',
  '120363424726740000-group',
]

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const secret = req.headers.get('x-cron-secret')
    if (secret !== process.env.CRON_SECRET && secret !== 'joana-cs-cron-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const fromDate = body.from ? new Date(body.from) : (() => { const d = new Date(); d.setHours(d.getHours() - 6); return d })()
    const toDate = body.to ? new Date(body.to) : new Date()

    const supabase = getServiceClient()
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // Analyze both community groups
    const groupSets = [
      { id: 'community', groupIds: [COMMUNITY_GROUP_ID], name: 'Programa de Aceleração Zape' },
      { id: 'shopee-ads', groupIds: SHOPEE_ADS_GROUP_IDS, name: 'Shopee ADS 2.0' },
    ]

    const results = []

    for (const groupSet of groupSets) {
      // Fetch messages
      let query = supabase
        .from('cs_messages')
        .select('sender_name, is_team_member, content, timestamp')
        .gte('timestamp', fromDate.toISOString())
        .lte('timestamp', toDate.toISOString())
        .order('timestamp', { ascending: true })
        .limit(5000)

      if (groupSet.groupIds.length === 1) {
        query = query.eq('group_id', groupSet.groupIds[0])
      } else {
        query = query.in('group_id', groupSet.groupIds)
      }

      const { data: messages } = await query

      if (!messages || messages.length < 5) {
        results.push({ group: groupSet.name, skipped: true, reason: 'Not enough messages' })
        continue
      }

      // Build message text for Claude (truncate to fit context)
      const msgText = messages
        .filter(m => m.content)
        .map(m => {
          const role = m.is_team_member ? '[EQUIPE]' : '[ALUNO]'
          const content = (m.content || '').substring(0, 150)
          return `${m.timestamp.substring(11, 16)} ${role} ${m.sender_name}: ${content}`
        })
        .join('\n')
        .substring(0, 80000) // limit to ~80K chars

      // Call GPT-4o-mini
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 2000,
        temperature: 0.3,
        messages: [
          { role: 'system', content: 'Você é um analista de comunidades de e-commerce. Responda APENAS com JSON válido, sem markdown ou texto adicional.' },
          { role: 'user', content: `Analise as mensagens do grupo "${groupSet.name}" (comunidade de vendedores de marketplace como Shopee e Mercado Livre).

Membros marcados como [EQUIPE] são mentores/suporte da Zape Ecomm. Membros [ALUNO] são participantes.

Mensagens do período ${fromDate.toISOString().substring(0, 10)} a ${toDate.toISOString().substring(0, 10)}:

${msgText}

Retorne um JSON com:
{
  "sentiment": {
    "positive_count": number,
    "negative_count": number,
    "question_count": number,
    "neutral_count": number,
    "positive_examples": [{"content": "msg", "sender": "nome", "keywords": ["palavra"]}] (top 3),
    "negative_examples": [{"content": "msg", "sender": "nome", "keywords": ["palavra"]}] (top 3)
  },
  "topics": [
    {"name": "descrição do tema/questão discutida", "count": number, "trend": "up|stable|down"}
  ] (top 10 TEMAS/QUESTÕES reais discutidos — NÃO palavras soltas. Exemplos: "Dúvidas sobre precificação de produtos", "Problemas com frete na Shopee", "Como configurar cupom de ADS", "Reclamações sobre taxa da plataforma". Cada tópico deve ser uma frase curta descrevendo o TEMA da conversa),
  "insights": [
    "insight 1 em português",
    "insight 2",
    "insight 3"
  ] (3-5 observações ACIONÁVEIS sobre o grupo. Ex: "Muitos alunos com dúvida sobre X — criar tutorial dedicado", "Engajamento caiu desde terça — verificar se houve problema", "3 alunos novos estão ajudando outros — reconhecer publicamente"),
  "main_questions": [
    {"question": "pergunta ou dúvida real dos participantes", "sender": "nome", "answered": true/false}
  ] (top 10 perguntas/dúvidas reais feitas pelos participantes — frases reais ou resumidas)
}` }
        ]
      })

      const responseText = response.choices[0]?.message?.content || ''
      let analysis
      try {
        // Try to extract JSON from response (handle markdown code blocks)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null
      } catch {
        results.push({ group: groupSet.name, error: 'Failed to parse Claude response' })
        continue
      }

      if (!analysis) {
        results.push({ group: groupSet.name, error: 'No analysis returned' })
        continue
      }

      const groupId = groupSet.groupIds.length === 1 ? groupSet.groupIds[0] : 'shopee-ads-combined'
      const tokensUsed = (response.usage?.prompt_tokens || 0) + (response.usage?.completion_tokens || 0)

      // Store each analysis type
      const types = ['sentiment', 'topics', 'insights', 'main_questions']
      for (const type of types) {
        if (analysis[type]) {
          await supabase.from('cs_community_analysis').insert({
            group_id: groupId,
            period_start: fromDate.toISOString(),
            period_end: toDate.toISOString(),
            analysis_type: type,
            data: type === 'insights' ? { insights: analysis[type] } :
                  type === 'topics' ? { topics: analysis[type] } :
                  type === 'main_questions' ? { questions: analysis[type] } :
                  analysis[type],
            model_used: 'gpt-4o-mini',
            tokens_used: Math.round(tokensUsed / 4),
          })
        }
      }

      results.push({ group: groupSet.name, success: true, tokens: tokensUsed, types: types.filter(t => analysis[t]) })
    }

    return NextResponse.json({ success: true, results })
  } catch (e: any) {
    console.error('[Community Analysis] Error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
