import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/joana/supabase'

function cleanGroupName(name: string): string {
  // Remove emojis at the start
  let clean = name.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\s]+/u, '')
  return clean.trim()
}

const POSITIVE_KEYWORDS = ['consegui', 'obrigado', 'valeu', 'top', 'show', 'funcionou', 'vendendo', 'resultado', 'excelente', 'maravilh', 'incrível', 'parabéns', 'perfeito', 'ótimo']
const NEGATIVE_KEYWORDS = ['erro', 'problema', 'não consigo', 'difícil', 'complicado', 'caro', 'cancelar', 'travou', 'bug', 'péssimo', 'horrível', 'frustrad', 'decepcion']

function classifyMessage(content: string): 'positive' | 'negative' | 'neutral' {
  const lower = content.toLowerCase()
  const hasPos = POSITIVE_KEYWORDS.some(w => lower.includes(w))
  const hasNeg = NEGATIVE_KEYWORDS.some(w => lower.includes(w))
  if (hasPos && !hasNeg) return 'positive'
  if (hasNeg && !hasPos) return 'negative'
  return 'neutral'
}

function calcClientScore(g: {
  team_messages: number,
  client_messages: number,
  days_inactive: number,
  avgResponseMin: number,
  proactiveTeamMsgs: number, // team msgs not preceded by client msg within 30min
  totalTeamMsgs: number,
  positiveCount: number,
  negativeCount: number,
  neutralCount: number,
}): number {
  // Factor 1: Response Time (30%) — how fast team responds to this client
  let responseScore = 50 // default if no data
  if (g.avgResponseMin > 0) {
    if (g.avgResponseMin <= 10) responseScore = 100
    else if (g.avgResponseMin <= 15) responseScore = 90
    else if (g.avgResponseMin <= 25) responseScore = 75
    else if (g.avgResponseMin <= 40) responseScore = 60
    else if (g.avgResponseMin <= 60) responseScore = 40
    else if (g.avgResponseMin <= 120) responseScore = 20
    else responseScore = 5
  }

  // Factor 2: Communication Balance (20%) — healthy 2-way communication
  let balanceScore = 0
  const total = g.team_messages + g.client_messages
  if (total > 0 && g.team_messages > 0 && g.client_messages > 0) {
    const ratio = Math.min(g.team_messages, g.client_messages) / Math.max(g.team_messages, g.client_messages)
    balanceScore = Math.round(ratio * 100)
  } else if (total === 0) {
    balanceScore = 0 // no activity
  } else if (g.team_messages === 0 && g.client_messages > 0) {
    balanceScore = 0 // client talking, team silent = bad
  } else if (g.client_messages === 0 && g.team_messages > 0) {
    balanceScore = 40 // team proactive but client not responding
  }

  // Factor 3: Team Proactivity (20%) — team initiates contact
  let proactivityScore = 10
  if (g.totalTeamMsgs > 0) {
    const proactivePct = g.proactiveTeamMsgs / g.totalTeamMsgs
    if (proactivePct >= 0.40) proactivityScore = 100
    else if (proactivePct >= 0.25) proactivityScore = 80
    else if (proactivePct >= 0.15) proactivityScore = 60
    else if (proactivePct >= 0.05) proactivityScore = 40
    else proactivityScore = 20
  }

  // Factor 4: Sentiment (15%) — positive vs negative tone from client
  let sentimentScore = 50 // neutral default
  const sentimentTotal = g.positiveCount + g.negativeCount + g.neutralCount
  if (sentimentTotal > 0) {
    const posRatio = g.positiveCount / sentimentTotal
    const negRatio = g.negativeCount / sentimentTotal
    if (negRatio >= 0.3) sentimentScore = 10 // very negative
    else if (negRatio >= 0.15) sentimentScore = 30
    else if (posRatio >= 0.3) sentimentScore = 100 // very positive
    else if (posRatio >= 0.15) sentimentScore = 75
    else sentimentScore = 50 // neutral
  }

  // Factor 5: Recency (15%) — how recently active
  let recencyScore = 0
  if (g.days_inactive <= 1) recencyScore = 100
  else if (g.days_inactive <= 3) recencyScore = 70
  else if (g.days_inactive <= 7) recencyScore = 40
  else if (g.days_inactive <= 14) recencyScore = 20
  else recencyScore = 0

  return Math.round(
    responseScore * 0.30 +
    balanceScore * 0.20 +
    proactivityScore * 0.20 +
    sentimentScore * 0.15 +
    recencyScore * 0.15
  )
}

function cleanTeamName(name: string): string {
  return name
    .replace(/\s*[\|\-]\s*Zape\s*Ecomm\s*/i, '')
    .replace(/\s*Zape\s*Ecomm\s*/i, '')
    .replace(/\s*Zape\s*/i, '')
    .trim()
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceClient()
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'today'
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')
    const filterParam = searchParams.get('filter') || 'all'

    const ACELERACAO_ID = '120363401620622735-group'
    const SHOPEE_ADS_IDS = [
      '120363422457783091-group',
      '120363407332110646-group',
      '120363407280170820-group',
      '120363404311146540-group',
      '120363424726740000-group',
    ]
    const COMMUNITY_IDS = [ACELERACAO_ID, ...SHOPEE_ADS_IDS]

    // Helper to apply group filter to a Supabase query builder
    function applyGroupFilter<T>(query: T): T {
      const q = query as any
      if (filterParam === 'consultoria') {
        return q.not('group_id', 'in', `(${COMMUNITY_IDS.join(',')})`)
      } else if (filterParam === 'aceleracao') {
        return q.eq('group_id', ACELERACAO_ID)
      } else if (filterParam === 'shopee-ads') {
        return q.in('group_id', SHOPEE_ADS_IDS)
      }
      return q
    }

    // Helper to apply filter to cs_groups queries (uses 'id' instead of 'group_id')
    function applyGroupFilterOnGroups<T>(query: T): T {
      const q = query as any
      if (filterParam === 'consultoria') {
        return q.not('id', 'in', `(${COMMUNITY_IDS.join(',')})`)
      } else if (filterParam === 'aceleracao') {
        return q.eq('id', ACELERACAO_ID)
      } else if (filterParam === 'shopee-ads') {
        return q.in('id', SHOPEE_ADS_IDS)
      }
      return q
    }

    const now = new Date()
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - 7)
    const lastWeekStart = new Date(now); lastWeekStart.setDate(lastWeekStart.getDate() - 14)
    const monthStart = new Date(now); monthStart.setDate(now.getDate() - 30)

    // If from/to are provided, use them; otherwise fall back to period param
    const periodStart = fromParam ? new Date(fromParam) : (period === 'month' ? monthStart : period === 'week' ? weekStart : todayStart)
    const periodEnd = toParam ? new Date(toParam) : now

    // ============================================================
    // Parallel queries
    // ============================================================
    const [
      groupsRes,
      msgsTodayRes,
      msgsYesterdayRes,
      msgsWeekRes,
      msgsLastWeekRes,
      teamTodayRes,
      allMsgsPeriodRes,
      peakHoursRes,
      negativeRes,
    ] = await Promise.all([
      // Groups
      applyGroupFilterOnGroups(supabase.from('cs_groups').select('id, name, last_activity').eq('is_active', true)),
      // Messages today
      applyGroupFilter(supabase.from('cs_messages').select('id', { count: 'exact', head: true }).gte('timestamp', todayStart.toISOString())),
      // Messages yesterday
      applyGroupFilter(supabase.from('cs_messages').select('id', { count: 'exact', head: true }).gte('timestamp', yesterdayStart.toISOString()).lt('timestamp', todayStart.toISOString())),
      // Messages this week
      applyGroupFilter(supabase.from('cs_messages').select('id', { count: 'exact', head: true }).gte('timestamp', weekStart.toISOString())),
      // Messages last week
      applyGroupFilter(supabase.from('cs_messages').select('id', { count: 'exact', head: true }).gte('timestamp', lastWeekStart.toISOString()).lt('timestamp', weekStart.toISOString())),
      // Team messages today
      applyGroupFilter(supabase.from('cs_messages').select('id', { count: 'exact', head: true }).eq('is_team_member', true).gte('timestamp', todayStart.toISOString())),
      // All messages in period (for detailed analysis)
      applyGroupFilter(supabase.from('cs_messages')
        .select('id, group_id, sender_name, sender_phone, is_team_member, content, message_type, timestamp')
        .gte('timestamp', periodStart.toISOString())
        .lte('timestamp', periodEnd.toISOString())
        .order('timestamp', { ascending: true })
        .limit(10000)),
      // Peak hours (last 7 days)
      applyGroupFilter(supabase.from('cs_messages')
        .select('timestamp')
        .gte('timestamp', weekStart.toISOString())
        .limit(10000)),
      // Negative keywords
      applyGroupFilter(supabase.from('cs_messages')
        .select('group_id, sender_name, content, timestamp')
        .eq('is_team_member', false)
        .gte('timestamp', weekStart.toISOString())
        .or('content.ilike.%cancelar%,content.ilike.%cancelamento%,content.ilike.%insatisfeito%,content.ilike.%problema%,content.ilike.%reclamar%,content.ilike.%péssimo%,content.ilike.%horrível%,content.ilike.%decepcionado%,content.ilike.%devolver%,content.ilike.%reembolso%')
        .limit(100)),
    ])

    const groups = groupsRes.data || []
    const allMsgs = allMsgsPeriodRes.data || []
    const peakMsgs = peakHoursRes.data || []

    // ============================================================
    // Overview
    // ============================================================
    const activeGroupIds = new Set(allMsgs.filter(m => {
      const t = new Date(m.timestamp)
      return t >= todayStart
    }).map(m => m.group_id))

    const msgsToday = msgsTodayRes.count || 0
    const msgsYesterday = msgsYesterdayRes.count || 0
    const msgsWeek = msgsWeekRes.count || 0
    const msgsLastWeek = msgsLastWeekRes.count || 0
    const teamToday = teamTodayRes.count || 0

    const overview = {
      total_groups: groups.length,
      active_groups_today: activeGroupIds.size,
      total_messages_today: msgsToday,
      total_messages_week: msgsWeek,
      team_messages_today: teamToday,
      client_messages_today: msgsToday - teamToday,
      team_ratio: msgsToday > 0 ? Math.round((teamToday / msgsToday) * 100) / 100 : 0,
    }

    // ============================================================
    // Response Time
    // ============================================================
    const responseTimes: number[] = []
    const msgsByGroup: Record<string, typeof allMsgs> = {}
    for (const m of allMsgs) {
      if (!msgsByGroup[m.group_id]) msgsByGroup[m.group_id] = []
      msgsByGroup[m.group_id].push(m)
    }

    for (const [, msgs] of Object.entries(msgsByGroup)) {
      let pendingClientMsgs: { timestamp: string }[] = []
      for (let i = 0; i < msgs.length; i++) {
        if (msgs[i].is_team_member) {
          // First team response clears all pending client messages
          if (pendingClientMsgs.length > 0) {
            const oldest = pendingClientMsgs[0]
            const diff = (new Date(msgs[i].timestamp).getTime() - new Date(oldest.timestamp).getTime()) / 60000
            if (diff > 0 && diff < 1440) responseTimes.push(diff)
            pendingClientMsgs = []
          }
        } else {
          pendingClientMsgs.push({ timestamp: msgs[i].timestamp })
        }
      }
    }

    const sortedRT = [...responseTimes].sort((a, b) => a - b)
    const avgRT = sortedRT.length > 0 ? Math.round(sortedRT.reduce((a, b) => a + b, 0) / sortedRT.length) : 0
    const medianRT = sortedRT.length > 0 ? Math.round(sortedRT[Math.floor(sortedRT.length / 2)]) : 0
    const maxRT = sortedRT.length > 0 ? Math.round(sortedRT[sortedRT.length - 1]) : 0

    const response_time = {
      avg_minutes: avgRT,
      median_minutes: medianRT,
      max_minutes: maxRT,
      under_15min_pct: sortedRT.length > 0 ? Math.round(sortedRT.filter(t => t <= 15).length / sortedRT.length * 100) : 0,
      under_30min_pct: sortedRT.length > 0 ? Math.round(sortedRT.filter(t => t <= 30).length / sortedRT.length * 100) : 0,
      under_60min_pct: sortedRT.length > 0 ? Math.round(sortedRT.filter(t => t <= 60).length / sortedRT.length * 100) : 0,
      total_responses: sortedRT.length,
    }

    // ============================================================
    // Peak Hours
    // ============================================================
    const hourCounts: Record<number, number> = {}
    for (let h = 0; h < 24; h++) hourCounts[h] = 0
    for (const m of peakMsgs) {
      const d = new Date(m.timestamp)
      const spHour = new Date(d.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).getHours()
      hourCounts[spHour] = (hourCounts[spHour] || 0) + 1
    }
    const peak_hours = Object.entries(hourCounts).map(([h, count]) => ({
      hour: Number(h),
      count: Math.round(count / 7), // daily average
    }))

    // ============================================================
    // Team Ranking
    // ============================================================
    const teamStats: Record<string, { name: string; msgs_today: number; msgs_week: number; groups: Set<string>; response_times: number[]; proactive: number; total: number }> = {}

    for (const m of allMsgs) {
      if (!m.is_team_member) continue
      const name = cleanTeamName(m.sender_name || 'Desconhecido')
      if (!teamStats[name]) {
        teamStats[name] = { name, msgs_today: 0, msgs_week: 0, groups: new Set(), response_times: [], proactive: 0, total: 0 }
      }
      const t = new Date(m.timestamp)
      if (t >= todayStart) teamStats[name].msgs_today++
      teamStats[name].msgs_week++
      teamStats[name].groups.add(m.group_id)
      teamStats[name].total++
    }

    // Calculate per-team response times and proactivity
    for (const [, msgs] of Object.entries(msgsByGroup)) {
      let pendingClientMsgs: { timestamp: string }[] = []
      for (let i = 0; i < msgs.length; i++) {
        if (msgs[i].is_team_member) {
          const teamName = cleanTeamName(msgs[i].sender_name || '')
          if (!teamStats[teamName]) continue

          // Check proactivity: no client msg in 30min before
          const isProactive = !msgs.slice(Math.max(0, i - 10), i).some(prev =>
            !prev.is_team_member &&
            prev.group_id === msgs[i].group_id &&
            (new Date(msgs[i].timestamp).getTime() - new Date(prev.timestamp).getTime()) < 1800000
          )
          if (isProactive) teamStats[teamName].proactive++

          // First team response: credit response time to this team member only
          if (pendingClientMsgs.length > 0) {
            const oldest = pendingClientMsgs[0]
            const diff = (new Date(msgs[i].timestamp).getTime() - new Date(oldest.timestamp).getTime()) / 60000
            if (diff > 0 && diff < 1440) {
              teamStats[teamName].response_times.push(diff)
            }
            pendingClientMsgs = []
          }
        } else {
          pendingClientMsgs.push({ timestamp: msgs[i].timestamp })
        }
      }
    }

    // Pre-compute raw stats for all consultants
    const teamRawStats = Object.values(teamStats).map(t => {
      const avgResp = t.response_times.length > 0
        ? Math.round(t.response_times.reduce((a, b) => a + b, 0) / t.response_times.length)
        : 0
      const proactivePct = t.total > 0 ? Math.round(t.proactive / t.total * 100) : 0
      return {
        name: t.name,
        messages_today: t.msgs_today,
        messages_week: t.msgs_week,
        groups_served: t.groups.size,
        avg_response_min: avgResp,
        proactive_pct: proactivePct,
        has_responses: t.response_times.length > 0,
      }
    })

    // Calculate team averages for relative scoring
    const avgMsgsWeek = teamRawStats.length > 0
      ? teamRawStats.reduce((a, c) => a + c.messages_week, 0) / teamRawStats.length
      : 1
    const avgGroupsServed = teamRawStats.length > 0
      ? teamRawStats.reduce((a, c) => a + c.groups_served, 0) / teamRawStats.length
      : 1

    // Composite score helpers
    function calcResponseTimeScore(avgMin: number, hasResponses: boolean): number {
      if (!hasResponses) return 70 // neutral for proactive-only consultants
      if (avgMin <= 10) return 100
      if (avgMin <= 15) return 85
      if (avgMin <= 25) return 70
      if (avgMin <= 35) return 50
      if (avgMin <= 60) return 30
      return 10
    }
    function calcProactivityScore(pct: number): number {
      if (pct >= 40) return 100
      if (pct >= 25) return 80
      if (pct >= 15) return 60
      if (pct >= 5) return 40
      return 20
    }
    function calcVolumeScore(msgs: number, avg: number): number {
      const ratio = avg > 0 ? msgs / avg : 0
      if (ratio >= 2) return 100
      if (ratio >= 1.5) return 85
      if (ratio >= 1) return 70
      if (ratio >= 0.5) return 50
      return 30
    }
    function calcCoverageScore(groups: number, avg: number): number {
      const ratio = avg > 0 ? groups / avg : 0
      if (ratio >= 2) return 100
      if (ratio >= 1.5) return 85
      if (ratio >= 1) return 70
      if (ratio >= 0.5) return 50
      return 30
    }
    function compositeStatus(score: number): string {
      if (score >= 80) return 'excellent'
      if (score >= 65) return 'good'
      if (score >= 45) return 'attention'
      return 'critical'
    }

    const team_ranking = teamRawStats
      .map(t => {
        const rtScore = calcResponseTimeScore(t.avg_response_min, t.has_responses)
        const proactScore = calcProactivityScore(t.proactive_pct)
        const volScore = calcVolumeScore(t.messages_week, avgMsgsWeek)
        const covScore = calcCoverageScore(t.groups_served, avgGroupsServed)
        const composite_score = Math.round(
          rtScore * 0.40 + proactScore * 0.25 + volScore * 0.20 + covScore * 0.15
        )

        return {
          name: t.name,
          messages_today: t.messages_today,
          messages_week: t.messages_week,
          groups_served: t.groups_served,
          avg_response_min: t.avg_response_min,
          proactive_pct: t.proactive_pct,
          composite_score,
          status: compositeStatus(composite_score),
        }
      })
      .sort((a, b) => b.messages_week - a.messages_week)
      .slice(0, 20)

    // ============================================================
    // Group Ranking
    // ============================================================
    const groupStats: Record<string, { name: string; msgs_today: number; msgs_week: number; team: number; client: number; last_activity: string | null }> = {}

    for (const g of groups) {
      groupStats[g.id] = { name: g.name, msgs_today: 0, msgs_week: 0, team: 0, client: 0, last_activity: g.last_activity }
    }

    for (const m of allMsgs) {
      if (!groupStats[m.group_id]) continue
      const t = new Date(m.timestamp)
      if (t >= todayStart) groupStats[m.group_id].msgs_today++
      groupStats[m.group_id].msgs_week++
      if (m.is_team_member) groupStats[m.group_id].team++
      else groupStats[m.group_id].client++
    }

    // Calculate per-group average response time
    const groupResponseTimes: Record<string, number[]> = {}
    for (const [groupId, msgs] of Object.entries(msgsByGroup)) {
      let pendingClientMsgs: { timestamp: string }[] = []
      for (let i = 0; i < msgs.length; i++) {
        if (msgs[i].is_team_member) {
          if (pendingClientMsgs.length > 0) {
            const oldest = pendingClientMsgs[0]
            const diff = (new Date(msgs[i].timestamp).getTime() - new Date(oldest.timestamp).getTime()) / 60000
            if (diff > 0 && diff < 1440) {
              if (!groupResponseTimes[groupId]) groupResponseTimes[groupId] = []
              groupResponseTimes[groupId].push(diff)
            }
            pendingClientMsgs = []
          }
        } else {
          pendingClientMsgs.push({ timestamp: msgs[i].timestamp })
        }
      }
    }

    // Pre-compute per-group proactivity and sentiment for client score
    const groupProactivity: Record<string, { proactive: number; total: number }> = {}
    for (const [groupId, msgs] of Object.entries(msgsByGroup)) {
      let proactive = 0
      let total = 0
      for (let i = 0; i < msgs.length; i++) {
        if (msgs[i].is_team_member) {
          total++
          const isProactive = !msgs.slice(Math.max(0, i - 10), i).some(prev =>
            !prev.is_team_member &&
            prev.group_id === msgs[i].group_id &&
            (new Date(msgs[i].timestamp).getTime() - new Date(prev.timestamp).getTime()) < 1800000
          )
          if (isProactive) proactive++
        }
      }
      groupProactivity[groupId] = { proactive, total }
    }

    const groupSentiment: Record<string, { positive: number; negative: number; neutral: number }> = {}
    for (const [groupId, msgs] of Object.entries(msgsByGroup)) {
      let positive = 0, negative = 0, neutral = 0
      for (const m of msgs) {
        if (!m.is_team_member && m.content) {
          const cls = classifyMessage(m.content)
          if (cls === 'positive') positive++
          else if (cls === 'negative') negative++
          else neutral++
        }
      }
      groupSentiment[groupId] = { positive, negative, neutral }
    }

    const group_ranking = Object.entries(groupStats)
      .map(([id, g]) => {
        const lastAct = g.last_activity ? new Date(g.last_activity) : null
        const daysInactive = lastAct ? Math.floor((now.getTime() - lastAct.getTime()) / 86400000) : 999

        const rts = groupResponseTimes[id] || []
        const avgResponseMin = rts.length > 0
          ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length)
          : 0

        const noMessages = g.msgs_week === 0 && g.msgs_today === 0

        const proact = groupProactivity[id] || { proactive: 0, total: 0 }
        const sent = groupSentiment[id] || { positive: 0, negative: 0, neutral: 0 }

        const engagement_score = noMessages ? 0 : calcClientScore({
          team_messages: g.team,
          client_messages: g.client,
          days_inactive: daysInactive,
          avgResponseMin,
          proactiveTeamMsgs: proact.proactive,
          totalTeamMsgs: proact.total,
          positiveCount: sent.positive,
          negativeCount: sent.negative,
          neutralCount: sent.neutral,
        })

        let engagement_status: string
        if (noMessages) engagement_status = 'inativo'
        else if (engagement_score >= 75) engagement_status = 'engajado'
        else if (engagement_score >= 50) engagement_status = 'moderado'
        else if (engagement_score >= 30) engagement_status = 'atencao'
        else engagement_status = 'critico'

        return {
          id,
          name: cleanGroupName(g.name),
          messages_today: g.msgs_today,
          messages_week: g.msgs_week,
          team_messages: g.team,
          client_messages: g.client,
          last_activity: g.last_activity,
          days_inactive: daysInactive,
          avg_response_min: avgResponseMin,
          engagement_score,
          engagement_status,
        }
      })
      .sort((a, b) => b.engagement_score - a.engagement_score)
      .slice(0, 50)

    // ============================================================
    // Alerts
    // ============================================================
    const inactive7 = groups.filter(g => {
      if (!g.last_activity) return true
      return (now.getTime() - new Date(g.last_activity).getTime()) > 7 * 86400000
    })
    const inactive14 = groups.filter(g => {
      if (!g.last_activity) return true
      return (now.getTime() - new Date(g.last_activity).getTime()) > 14 * 86400000
    })

    // Declining: groups with less messages this period vs previous
    const thisWeekByGroup: Record<string, number> = {}
    const lastWeekByGroup: Record<string, number> = {}

    for (const m of allMsgs) {
      const t = new Date(m.timestamp)
      if (t >= weekStart) thisWeekByGroup[m.group_id] = (thisWeekByGroup[m.group_id] || 0) + 1
    }

    // We need last week data separately
    const { data: lastWeekMsgs } = await applyGroupFilter(supabase.from('cs_messages')
      .select('group_id')
      .gte('timestamp', lastWeekStart.toISOString())
      .lt('timestamp', weekStart.toISOString())
      .limit(10000))

    for (const m of (lastWeekMsgs || [])) {
      lastWeekByGroup[m.group_id] = (lastWeekByGroup[m.group_id] || 0) + 1
    }

    const decliningGroups = Object.entries(thisWeekByGroup)
      .filter(([gid, count]) => {
        const prev = lastWeekByGroup[gid] || 0
        return prev > 0 && count < prev * 0.5 // 50% drop
      })
      .map(([gid]) => {
        const g = groups.find(g => g.id === gid)
        return { id: gid, name: g?.name || gid, this_week: thisWeekByGroup[gid], last_week: lastWeekByGroup[gid] || 0 }
      })

    const negativeKeywords = (negativeRes.data || []).map(m => {
      const g = groups.find(g => g.id === m.group_id)
      return {
        group_name: g?.name || m.group_id,
        sender: m.sender_name,
        content_preview: (m.content || '').substring(0, 120),
        timestamp: m.timestamp,
      }
    })

    const alerts = {
      no_response_count: 0, // calculated by cron
      inactive_7_days: inactive7.length,
      inactive_14_days: inactive14.length,
      negative_keywords_today: negativeKeywords.filter(k => new Date(k.timestamp) >= todayStart).length,
      negative_keywords_week: negativeKeywords.length,
      groups_declining: decliningGroups.length,
    }

    // ============================================================
    // Trends
    // ============================================================
    const todayDelta = msgsYesterday > 0 ? Math.round((msgsToday - msgsYesterday) / msgsYesterday * 100) : 0
    const weekDelta = msgsLastWeek > 0 ? Math.round((msgsWeek - msgsLastWeek) / msgsLastWeek * 100) : 0

    const trends = {
      today_vs_yesterday: { current: msgsToday, previous: msgsYesterday, delta_pct: todayDelta },
      this_week_vs_last: { current: msgsWeek, previous: msgsLastWeek, delta_pct: weekDelta },
    }

    // ============================================================
    // Client Health
    // ============================================================
    // Groups where team sends but client doesn't respond
    const onlyReceiving = Object.entries(groupStats)
      .filter(([, g]) => g.team > 3 && g.client === 0 && g.msgs_week > 0)
      .map(([id, g]) => ({ id, name: g.name, team_msgs: g.team }))
      .slice(0, 10)

    // Groups where client sends but team doesn't respond
    const onlySending = Object.entries(groupStats)
      .filter(([, g]) => g.client > 3 && g.team === 0 && g.msgs_week > 0)
      .map(([id, g]) => ({ id, name: g.name, client_msgs: g.client }))
      .slice(0, 10)

    const client_health = {
      only_receiving: onlyReceiving,
      only_sending: onlySending,
      declining: decliningGroups.slice(0, 10),
    }

    // Fetch AI analysis for consultoria
    const { data: aiAnalysis } = await supabase
      .from('cs_community_analysis')
      .select('analysis_type, data, created_at')
      .eq('group_id', 'consultoria-combined')
      .order('created_at', { ascending: false })
      .limit(10)

    const getAI = (type: string) => {
      const found = aiAnalysis?.find((a: any) => a.analysis_type === type)
      return found?.data || null
    }

    return NextResponse.json({
      period: { from: periodStart.toISOString(), to: periodEnd.toISOString() },
      overview,
      response_time,
      peak_hours,
      team_ranking,
      group_ranking,
      alerts,
      trends,
      client_health,
      negative_keywords: negativeKeywords.slice(0, 20),
      ai_topics: getAI('topics')?.topics || null,
      ai_insights: getAI('insights')?.insights || null,
      ai_questions: getAI('main_questions')?.questions || null,
      ai_analysis_available: (aiAnalysis?.length || 0) > 0,
      generated_at: now.toISOString(),
    })
  } catch (e: any) {
    console.error('[CS Analytics] Error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
