import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/joana/supabase'
import { isQuestion, classifySentimentKeyword, extractTopWords } from '@/lib/community-utils'

const COMMUNITY_GROUP_ID = '120363401620622735-group'

const SP_DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

function cleanName(name: string): string {
  return name
    .replace(/\s*[\|\-]\s*[Zz]ape\s*[Ee]comm?\s*/i, '')
    .replace(/\s*[Zz]ape\s*[Ee]comm?\s*/i, '')
    .replace(/\s*[Zz]ape\s*/i, '')
    .trim() || name
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceClient()
    const { searchParams } = new URL(req.url)
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    const now = new Date()
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
    const periodStart = fromParam ? new Date(fromParam) : todayStart
    const periodEnd = toParam ? new Date(toParam) : now

    // Parallel queries
    const [msgsRes, analysisRes, groupRes] = await Promise.all([
      supabase
        .from('cs_messages')
        .select('id, sender_name, sender_phone, is_team_member, content, message_type, timestamp')
        .eq('group_id', COMMUNITY_GROUP_ID)
        .gte('timestamp', periodStart.toISOString())
        .lte('timestamp', periodEnd.toISOString())
        .order('timestamp', { ascending: true })
        .limit(10000),
      supabase
        .from('cs_community_analysis')
        .select('analysis_type, data, created_at')
        .eq('group_id', COMMUNITY_GROUP_ID)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('cs_groups')
        .select('name')
        .eq('id', COMMUNITY_GROUP_ID)
        .single(),
    ])

    const messages = msgsRes.data || []
    const analyses = analysisRes.data || []
    const groupName = groupRes.data?.name || 'Programa de Aceleração Zape'

    // ─── KPIs ───
    const nonTeamMsgs = messages.filter(m => !m.is_team_member)
    const teamMsgs = messages.filter(m => m.is_team_member)
    const uniqueMembers = new Set(nonTeamMsgs.map(m => m.sender_phone || m.sender_name))
    const questions = nonTeamMsgs.filter(m => m.content && isQuestion(m.content))

    let positiveCount = 0, negativeCount = 0, questionCount = questions.length, neutralCount = 0
    const positiveExamples: { content: string; sender: string; keywords: string[]; timestamp: string }[] = []
    const negativeExamples: { content: string; sender: string; keywords: string[]; timestamp: string }[] = []

    const positiveWords = ['consegui', 'obrigado', 'valeu', 'top', 'show', 'funcionou', 'vendendo', 'resultado', 'primeira venda', 'excelente', 'maravilh', 'incrível', 'parabéns', 'perfeito', 'ótimo']
    const negativeWords = ['erro', 'problema', 'não consigo', 'dúvida', 'difícil', 'complicado', 'caro', 'cancelar', 'travou', 'bug', 'péssimo', 'horrível', 'frustrad']

    for (const m of nonTeamMsgs) {
      if (!m.content) continue
      const sentiment = classifySentimentKeyword(m.content)
      if (sentiment === 'positive') {
        positiveCount++
        if (positiveExamples.length < 5) {
          const kws = positiveWords.filter(w => m.content.toLowerCase().includes(w))
          positiveExamples.push({ content: m.content.substring(0, 200), sender: cleanName(m.sender_name || ''), keywords: kws, timestamp: m.timestamp })
        }
      } else if (sentiment === 'negative') {
        negativeCount++
        if (negativeExamples.length < 5) {
          const kws = negativeWords.filter(w => m.content.toLowerCase().includes(w))
          negativeExamples.push({ content: m.content.substring(0, 200), sender: cleanName(m.sender_name || ''), keywords: kws, timestamp: m.timestamp })
        }
      } else {
        neutralCount++
      }
    }

    const totalSentiment = positiveCount + negativeCount + neutralCount
    const positivePct = totalSentiment > 0 ? Math.round(positiveCount / totalSentiment * 100) : 0
    const negativePct = totalSentiment > 0 ? Math.round(negativeCount / totalSentiment * 100) : 0

    const kpis = {
      total_messages: messages.length,
      active_members: uniqueMembers.size,
      questions_asked: questionCount,
      sentiment: {
        positive_pct: positivePct,
        negative_pct: negativePct,
        label: positivePct > 60 ? 'Positivo' : positivePct > 40 ? 'Neutro' : 'Negativo'
      }
    }

    // ─── Evolution (by day) ───
    const dayBuckets: Record<string, { messages: number; members: Set<string> }> = {}
    for (const m of messages) {
      const day = m.timestamp.substring(0, 10)
      if (!dayBuckets[day]) dayBuckets[day] = { messages: 0, members: new Set() }
      dayBuckets[day].messages++
      if (!m.is_team_member) dayBuckets[day].members.add(m.sender_phone || m.sender_name)
    }
    const evolution = Object.entries(dayBuckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({ date, messages: d.messages, members: d.members.size }))

    // ─── Peak Hours ───
    const hourCounts: Record<number, number> = {}
    for (let h = 0; h < 24; h++) hourCounts[h] = 0
    for (const m of messages) {
      const d = new Date(m.timestamp)
      const spHour = new Date(d.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).getHours()
      hourCounts[spHour]++
    }
    const peak_hours = Object.entries(hourCounts).map(([h, count]) => ({ hour: Number(h), count }))

    // ─── Day of Week ───
    const dayCounts: Record<string, number> = {}
    for (const name of SP_DAY_NAMES) dayCounts[name] = 0
    for (const m of messages) {
      const d = new Date(m.timestamp)
      const spDate = new Date(d.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
      dayCounts[SP_DAY_NAMES[spDate.getDay()]]++
    }
    const day_of_week = SP_DAY_NAMES.map(day => ({ day, count: dayCounts[day] }))

    // ─── Participant Ranking ───
    const participantStats: Record<string, { name: string; messages: number; questions: number; helps_given: number; positive: number; negative: number; neutral: number }> = {}

    for (const m of nonTeamMsgs) {
      const name = cleanName(m.sender_name || 'Desconhecido')
      if (!participantStats[name]) {
        participantStats[name] = { name, messages: 0, questions: 0, helps_given: 0, positive: 0, negative: 0, neutral: 0 }
      }
      participantStats[name].messages++
      if (m.content && isQuestion(m.content)) participantStats[name].questions++

      if (m.content) {
        const s = classifySentimentKeyword(m.content)
        if (s === 'positive') participantStats[name].positive++
        else if (s === 'negative') participantStats[name].negative++
        else participantStats[name].neutral++
      }
    }

    // Detect "helps given": participant message within 10min after another participant's question
    for (let i = 1; i < messages.length; i++) {
      const curr = messages[i]
      if (curr.is_team_member) continue
      const currName = cleanName(curr.sender_name || '')

      // Look back for a question from someone else
      for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
        const prev = messages[j]
        if (prev.is_team_member) continue
        const prevName = cleanName(prev.sender_name || '')
        if (prevName === currName) continue

        if (prev.content && isQuestion(prev.content)) {
          const diff = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 60000
          if (diff > 0 && diff <= 10) {
            if (participantStats[currName]) participantStats[currName].helps_given++
          }
          break
        }
      }
    }

    const participants = Object.values(participantStats)
      .map(p => {
        const total = p.positive + p.negative + p.neutral
        const sentimentScore = total > 0 ? p.positive / total : 0.5
        let status = 'silencioso'
        if (p.messages >= 5 || p.helps_given >= 1) status = 'engajado'
        else if (p.messages >= 2) status = 'moderado'

        return {
          name: p.name,
          messages: p.messages,
          questions: p.questions,
          helps_given: p.helps_given,
          sentiment_label: sentimentScore > 0.5 ? 'Positivo' : sentimentScore > 0.3 ? 'Neutro' : 'Negativo',
          status,
        }
      })
      .sort((a, b) => b.messages - a.messages)
      .slice(0, 50)

    // ─── Keywords ───
    const allContents = messages.filter(m => m.content).map(m => m.content)
    const keywords = extractTopWords(allContents, 30)

    // ─── AI Analysis (from stored results) ───
    const getAnalysis = (type: string) => {
      const found = analyses.find(a => a.analysis_type === type)
      return found?.data || null
    }

    const sentiment_detail = {
      positive_count: positiveCount,
      negative_count: negativeCount,
      question_count: questionCount,
      neutral_count: neutralCount,
      positive_examples: positiveExamples,
      negative_examples: negativeExamples,
    }

    // ─── Team Activity ───
    const teamNames = new Set(teamMsgs.map(m => cleanName(m.sender_name || '')))

    return NextResponse.json({
      group_name: groupName,
      period: { from: periodStart.toISOString(), to: periodEnd.toISOString() },
      kpis,
      evolution,
      peak_hours,
      day_of_week,
      participants,
      sentiment_detail,
      topics: getAnalysis('topics')?.topics || null,
      keywords,
      insights: getAnalysis('insights')?.insights || null,
      team_activity: { total_msgs: teamMsgs.length, members: Array.from(teamNames) },
      ai_analysis_available: analyses.length > 0,
      generated_at: now.toISOString(),
    })
  } catch (e: any) {
    console.error('[CS Community] Error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
