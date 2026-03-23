'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import {
  HeartHandshake,
  Loader2,
  Search,
  Users,
  AlertTriangle,
  MessageSquare,
  MessageCircleOff,
  TrendingDown,
  ShieldAlert,
  Moon,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

/* ─── Types ─── */

interface CsGroup {
  id: string
  name: string
  last_activity: string | null
  is_active: boolean
}

interface HealthScore {
  group_id: string
  score: number
  calculated_at: string
}

interface CsMessage {
  id: string
  group_id: string
  timestamp: string
  is_team_member: boolean
  content: string | null
  sender_name: string | null
}

interface GroupMember {
  group_id: string
  name: string
  is_team: boolean
}

type HealthStatus = 'healthy' | 'attention' | 'risk' | 'critical' | 'none'
type FilterStatus = 'all' | HealthStatus

interface ClientRow {
  id: string
  name: string
  messages_week: number
  team_members: string[]
  client_msgs: number
  last_activity: string | null
  negative_count: number
  health_status: HealthStatus
  health_score: number | null
}

interface DecliningGroup {
  id: string
  name: string
  this_week: number
  last_week: number
}

interface NegativeKeywordGroup {
  id: string
  name: string
  count: number
  preview: string
}

interface InactiveGroup {
  id: string
  name: string
  days_inactive: number
}

/* ─── Constants ─── */

const NEGATIVE_KEYWORDS = [
  'cancelar', 'cancelamento', 'insatisfeito', 'problema',
  'reclamar', 'reclamacao', 'pessimo', 'horrivel',
  'decepcionado', 'devolver', 'reembolso',
  'reclamação', 'péssimo', 'horrível',
]

const STATUS_CONFIG: Record<HealthStatus, { label: string; dot: string; cls: string }> = {
  healthy: {
    label: 'Saudavel',
    dot: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]',
    cls: 'text-emerald-400 bg-emerald-400/8 border-emerald-400/15',
  },
  attention: {
    label: 'Atencao',
    dot: 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.4)]',
    cls: 'text-yellow-400 bg-yellow-400/8 border-yellow-400/15',
  },
  risk: {
    label: 'Risco',
    dot: 'bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.4)]',
    cls: 'text-orange-400 bg-orange-400/8 border-orange-400/15',
  },
  critical: {
    label: 'Critico',
    dot: 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]',
    cls: 'text-red-400 bg-red-400/8 border-red-400/15',
  },
  none: {
    label: 'Sem score',
    dot: 'bg-zinc-600',
    cls: 'text-zinc-600 bg-zinc-800/50 border-zinc-700/30',
  },
}

const FILTER_LABELS: Record<FilterStatus, string> = {
  all: 'Todos',
  healthy: 'Saudavel',
  attention: 'Atencao',
  risk: 'Risco',
  critical: 'Critico',
  none: 'Sem score',
}

const PIE_COLORS: Record<string, string> = {
  'Saudavel': '#34d399',
  'Atencao': '#facc15',
  'Risco': '#fb923c',
  'Critico': '#f87171',
  'Sem score': '#52525b',
}

/* ─── Helpers ─── */

function getHealthStatus(score: number | null): HealthStatus {
  if (score === null) return 'none'
  if (score > 70) return 'healthy'
  if (score >= 50) return 'attention'
  if (score >= 30) return 'risk'
  return 'critical'
}

function cleanName(name: string) {
  return name.replace(/\s*\|.*$/, '').trim()
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return 'sem atividade'
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'agora'
  if (hours < 24) return `${hours}h atras`
  const days = Math.floor(hours / 24)
  return `${days}d atras`
}

function matchesNegativeKeyword(content: string): boolean {
  const lower = content.toLowerCase()
  return NEGATIVE_KEYWORDS.some((kw) => lower.includes(kw))
}

/* ─── Component ─── */

export default function CsClientesPage() {
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('all')

  // Data
  const [clients, setClients] = useState<ClientRow[]>([])
  const [declining, setDeclining] = useState<DecliningGroup[]>([])
  const [negativeGroups, setNegativeGroups] = useState<NegativeKeywordGroup[]>([])
  const [inactive, setInactive] = useState<InactiveGroup[]>([])

  // KPIs
  const [activeCount, setActiveCount] = useState(0)
  const [atRiskCount, setAtRiskCount] = useState(0)
  const [avgEngagement, setAvgEngagement] = useState(0)
  const [noReplyCount, setNoReplyCount] = useState(0)

  // Pie data
  const [pieData, setPieData] = useState<{ name: string; value: number }[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = getSupabase()

    const now = new Date()
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const twoWeeksAgo = new Date(now)
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const [groupsRes, msgs7dRes, msgs14dRes, scoresRes, membersRes] = await Promise.all([
      supabase
        .from('cs_groups')
        .select('id, name, last_activity, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true }),
      supabase
        .from('cs_messages')
        .select('id, group_id, timestamp, is_team_member, content, sender_name')
        .gte('timestamp', weekAgo.toISOString()),
      supabase
        .from('cs_messages')
        .select('id, group_id, timestamp, is_team_member, content, sender_name')
        .gte('timestamp', twoWeeksAgo.toISOString())
        .lt('timestamp', weekAgo.toISOString()),
      supabase
        .from('cs_health_scores')
        .select('group_id, score, calculated_at')
        .order('calculated_at', { ascending: false }),
      supabase
        .from('cs_group_members')
        .select('group_id, name, is_team')
        .eq('is_team', true),
    ])

    const groups: CsGroup[] = groupsRes.data ?? []
    const msgs7d: CsMessage[] = msgs7dRes.data ?? []
    const msgs14d: CsMessage[] = msgs14dRes.data ?? []
    const scores: HealthScore[] = scoresRes.data ?? []
    const members: GroupMember[] = membersRes.data ?? []

    // Latest score per group
    const latestScores = new Map<string, HealthScore>()
    for (const s of scores) {
      if (!latestScores.has(s.group_id)) {
        latestScores.set(s.group_id, s)
      }
    }

    // Team members per group
    const teamByGroup = new Map<string, string[]>()
    for (const m of members) {
      const existing = teamByGroup.get(m.group_id) ?? []
      existing.push(cleanName(m.name))
      teamByGroup.set(m.group_id, existing)
    }

    // Messages this week per group
    const msgsThisWeek = new Map<string, CsMessage[]>()
    for (const msg of msgs7d) {
      const arr = msgsThisWeek.get(msg.group_id) ?? []
      arr.push(msg)
      msgsThisWeek.set(msg.group_id, arr)
    }

    // Messages last week per group
    const msgsLastWeek = new Map<string, number>()
    for (const msg of msgs14d) {
      msgsLastWeek.set(msg.group_id, (msgsLastWeek.get(msg.group_id) ?? 0) + 1)
    }

    // Negative keyword messages per group (client messages only)
    const negByGroup = new Map<string, { count: number; preview: string }>()
    for (const msg of msgs7d) {
      if (!msg.is_team_member && msg.content && matchesNegativeKeyword(msg.content)) {
        const existing = negByGroup.get(msg.group_id)
        if (existing) {
          existing.count++
        } else {
          negByGroup.set(msg.group_id, {
            count: 1,
            preview: msg.content.substring(0, 80),
          })
        }
      }
    }

    // Build client rows
    const clientRows: ClientRow[] = groups.map((g) => {
      const weekMsgs = msgsThisWeek.get(g.id) ?? []
      const totalMsgsWeek = weekMsgs.length
      const teamMsgsWeek = weekMsgs.filter((m) => m.is_team_member).length
      const clientMsgsWeek = totalMsgsWeek - teamMsgsWeek
      const team = teamByGroup.get(g.id) ?? []
      const score = latestScores.get(g.id)
      const neg = negByGroup.get(g.id)

      return {
        id: g.id,
        name: g.name,
        messages_week: totalMsgsWeek,
        team_members: [...new Set(team)],
        client_msgs: clientMsgsWeek,
        last_activity: g.last_activity,
        negative_count: neg?.count ?? 0,
        health_status: getHealthStatus(score?.score ?? null),
        health_score: score?.score ?? null,
      }
    })

    // Sort by messages_week desc
    clientRows.sort((a, b) => b.messages_week - a.messages_week)

    // KPIs
    const sevenDaysMs = 7 * 24 * 3600 * 1000
    const active = groups.filter((g) => {
      if (!g.last_activity) return false
      return Date.now() - new Date(g.last_activity).getTime() < sevenDaysMs
    })

    const risk = clientRows.filter((c) => {
      const isInactive = !c.last_activity || Date.now() - new Date(c.last_activity).getTime() > sevenDaysMs
      const hasNeg = c.negative_count > 0
      return isInactive || hasNeg
    })

    // Average engagement (msgs/week across groups that have messages)
    const groupsWithMsgs = clientRows.filter((c) => c.messages_week > 0)
    const avgEng = groupsWithMsgs.length > 0
      ? Math.round(groupsWithMsgs.reduce((acc, c) => acc + c.messages_week, 0) / groupsWithMsgs.length)
      : 0

    // No reply: groups where client sent messages but team hasn't replied this week
    const noReply = clientRows.filter((c) => {
      const weekMsgs = msgsThisWeek.get(c.id) ?? []
      const hasClientMsg = weekMsgs.some((m) => !m.is_team_member)
      const hasTeamMsg = weekMsgs.some((m) => m.is_team_member)
      return hasClientMsg && !hasTeamMsg
    })

    // Health distribution pie
    const distribution: Record<string, number> = {
      'Saudavel': 0,
      'Atencao': 0,
      'Risco': 0,
      'Critico': 0,
      'Sem score': 0,
    }
    for (const c of clientRows) {
      const cfg = STATUS_CONFIG[c.health_status]
      distribution[cfg.label]++
    }
    const pie = Object.entries(distribution)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }))

    // At Risk sections
    // 1. Declining (>50% drop)
    const decliningList: DecliningGroup[] = []
    for (const g of groups) {
      const thisWeek = (msgsThisWeek.get(g.id) ?? []).length
      const lastWeek = msgsLastWeek.get(g.id) ?? 0
      if (lastWeek > 0 && thisWeek < lastWeek * 0.5) {
        decliningList.push({
          id: g.id,
          name: g.name,
          this_week: thisWeek,
          last_week: lastWeek,
        })
      }
    }
    decliningList.sort((a, b) => (a.this_week / a.last_week) - (b.this_week / b.last_week))

    // 2. Negative keywords
    const negList: NegativeKeywordGroup[] = []
    for (const g of groups) {
      const neg = negByGroup.get(g.id)
      if (neg) {
        negList.push({ id: g.id, name: g.name, count: neg.count, preview: neg.preview })
      }
    }
    negList.sort((a, b) => b.count - a.count)

    // 3. Inactive >7 days
    const inactiveList: InactiveGroup[] = []
    for (const g of groups) {
      if (!g.last_activity) {
        inactiveList.push({ id: g.id, name: g.name, days_inactive: 999 })
      } else {
        const daysInactive = Math.floor((Date.now() - new Date(g.last_activity).getTime()) / (24 * 3600 * 1000))
        if (daysInactive > 7) {
          inactiveList.push({ id: g.id, name: g.name, days_inactive: daysInactive })
        }
      }
    }
    inactiveList.sort((a, b) => b.days_inactive - a.days_inactive)

    // Set all state
    setClients(clientRows)
    setActiveCount(active.length)
    setAtRiskCount(risk.length)
    setAvgEngagement(avgEng)
    setNoReplyCount(noReply.length)
    setPieData(pie)
    setDeclining(decliningList)
    setNegativeGroups(negList)
    setInactive(inactiveList)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filtered & searched clients
  const filteredClients = clients.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || c.health_status === filter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/8 border border-lime-400/15">
            <HeartHandshake size={18} className="text-lime-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Clientes</h1>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
              Joana — Saude e Engajamento
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={28} className="animate-spin text-lime-400" />
        </div>
      ) : (
        <>
          {/* ─── KPI Cards ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5 hover:border-lime-400/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-zinc-600" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  Clientes Ativos
                </span>
              </div>
              <p className="text-2xl font-extrabold text-white">{activeCount}</p>
              <p className="text-[10px] font-semibold text-zinc-600 mt-1">ultimos 7 dias</p>
            </div>

            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5 hover:border-lime-400/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-red-400" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  Em Risco
                </span>
              </div>
              <p className={`text-2xl font-extrabold ${atRiskCount > 0 ? 'text-red-400' : 'text-white'}`}>
                {atRiskCount}
              </p>
              <p className="text-[10px] font-semibold text-zinc-600 mt-1">inativos ou keywords neg.</p>
            </div>

            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5 hover:border-lime-400/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={14} className="text-lime-400" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  Engajamento Medio
                </span>
              </div>
              <p className="text-2xl font-extrabold text-lime-400">
                {avgEngagement}
                <span className="text-sm font-semibold text-zinc-600 ml-1">msgs/sem</span>
              </p>
            </div>

            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5 hover:border-lime-400/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircleOff size={14} className="text-zinc-600" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  Sem Resposta
                </span>
              </div>
              <p className={`text-2xl font-extrabold ${noReplyCount > 0 ? 'text-orange-400' : 'text-white'}`}>
                {noReplyCount}
              </p>
              <p className="text-[10px] font-semibold text-zinc-600 mt-1">equipe nao respondeu</p>
            </div>
          </div>

          {/* ─── Health Distribution Pie ─── */}
          <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5">
            <h2 className="text-sm font-extrabold text-white mb-4">
              Distribuicao de Saude
              <span className="text-zinc-600 font-semibold ml-2 text-[11px]">
                {clients.length} clientes
              </span>
            </h2>
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="h-[240px] w-[240px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, i) => (
                        <Cell
                          key={`cell-${i}`}
                          fill={PIE_COLORS[entry.name] ?? '#52525b'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#111111',
                        border: '1px solid #222222',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#fff',
                      }}
                      formatter={(value) => [`${value} grupos`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-4">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[entry.name] ?? '#52525b' }}
                    />
                    <span className="text-[12px] font-semibold text-zinc-400">
                      {entry.name}
                    </span>
                    <span className="text-[12px] font-extrabold text-white">
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Client Table ─── */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-extrabold text-white">Clientes</h2>
              <span className="text-[11px] font-bold text-zinc-600">
                {filteredClients.length} de {clients.length}
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(FILTER_LABELS) as FilterStatus[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-3.5 py-1.5 text-[11px] font-bold transition-all cursor-pointer border ${
                    filter === f
                      ? f === 'all'
                        ? 'bg-lime-400/10 text-lime-400 border-lime-400/20'
                        : f === 'none'
                          ? 'bg-zinc-600/10 text-zinc-400 border-zinc-600/20'
                          : `${STATUS_CONFIG[f as HealthStatus].cls}`
                      : 'text-zinc-500 hover:text-zinc-300 border-transparent hover:border-zinc-700'
                  }`}
                >
                  {FILTER_LABELS[f]}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full rounded-xl border border-[#222222] bg-[#111111] pl-11 pr-4 py-3 text-[13px] font-semibold text-white placeholder-zinc-700 outline-none focus:border-lime-400/30 transition-colors"
              />
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-[#222222] bg-[#111111] overflow-hidden">
              <div className="grid grid-cols-[1fr_80px_90px_80px_100px_70px_100px] gap-4 px-5 py-3 border-b border-[#222222]">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Grupo</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">Msgs Sem.</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">Equipe</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">Cliente</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">Ultima Ativ.</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">Neg.</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">Status</span>
              </div>
              {filteredClients.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-[13px] font-semibold text-zinc-600">
                    {clients.length === 0
                      ? 'Nenhum cliente encontrado.'
                      : 'Nenhum cliente encontrado para esta busca/filtro.'}
                  </p>
                </div>
              ) : (
                filteredClients.map((client) => {
                  const cfg = STATUS_CONFIG[client.health_status]
                  return (
                    <div
                      key={client.id}
                      className="grid grid-cols-[1fr_80px_90px_80px_100px_70px_100px] gap-4 px-5 py-3.5 border-b border-[#1a1a1a] hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                        <span className="text-[13px] font-semibold text-white truncate">
                          {cleanName(client.name)}
                        </span>
                      </div>
                      <span className="text-[13px] font-semibold text-white text-right self-center">
                        {client.messages_week}
                      </span>
                      <span className="text-[12px] font-semibold text-zinc-400 text-right self-center truncate">
                        {client.team_members.length > 0
                          ? client.team_members.slice(0, 2).join(', ')
                          : '—'}
                      </span>
                      <span className="text-[13px] font-semibold text-zinc-400 text-right self-center">
                        {client.client_msgs}
                      </span>
                      <span className="text-[12px] font-semibold text-zinc-500 text-right self-center">
                        {timeAgo(client.last_activity)}
                      </span>
                      <span className={`text-[13px] font-bold text-right self-center ${client.negative_count > 0 ? 'text-red-400' : 'text-zinc-600'}`}>
                        {client.negative_count > 0 ? client.negative_count : '—'}
                      </span>
                      <div className="flex justify-end self-center">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${cfg.cls}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* ─── At Risk Section ─── */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-white">Em Risco</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Declining */}
              <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown size={14} className="text-orange-400" />
                  <span className="text-[12px] font-bold text-white">Em Queda</span>
                  <span className="text-[11px] text-zinc-600 font-semibold">
                    {declining.length}
                  </span>
                </div>
                {declining.length === 0 ? (
                  <p className="text-[12px] font-semibold text-zinc-600">
                    Nenhum cliente em queda.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {declining.map((item) => {
                      const dropPct = Math.round((1 - item.this_week / item.last_week) * 100)
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-xl bg-orange-500/5 border border-orange-500/10 px-3 py-2"
                        >
                          <span className="text-[12px] font-semibold text-white truncate mr-2">
                            {cleanName(item.name)}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[11px] font-bold text-orange-400">
                              {item.this_week}/{item.last_week}
                            </span>
                            <span className="text-[10px] font-bold text-red-400">
                              -{dropPct}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Negative Keywords */}
              <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert size={14} className="text-yellow-400" />
                  <span className="text-[12px] font-bold text-white">Keywords Negativas</span>
                  <span className="text-[11px] text-zinc-600 font-semibold">
                    {negativeGroups.length}
                  </span>
                </div>
                {negativeGroups.length === 0 ? (
                  <p className="text-[12px] font-semibold text-zinc-600">
                    Nenhuma keyword negativa detectada.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {negativeGroups.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl bg-yellow-500/5 border border-yellow-500/10 px-3 py-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-semibold text-white truncate mr-2">
                            {cleanName(item.name)}
                          </span>
                          <span className="text-[11px] font-bold text-yellow-400 flex-shrink-0">
                            {item.count} msgs
                          </span>
                        </div>
                        <p className="text-[10px] font-medium text-zinc-600 mt-1 truncate">
                          &ldquo;{item.preview}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Inactive */}
              <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Moon size={14} className="text-zinc-400" />
                  <span className="text-[12px] font-bold text-white">Inativos</span>
                  <span className="text-[11px] text-zinc-600 font-semibold">
                    {inactive.length}
                  </span>
                </div>
                {inactive.length === 0 ? (
                  <p className="text-[12px] font-semibold text-zinc-600">
                    Todos os clientes ativos.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {inactive.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl bg-zinc-500/5 border border-zinc-500/10 px-3 py-2"
                      >
                        <span className="text-[12px] font-semibold text-white truncate mr-2">
                          {cleanName(item.name)}
                        </span>
                        <span className="text-[11px] font-bold text-zinc-400 flex-shrink-0">
                          {item.days_inactive === 999 ? 'sem atividade' : `${item.days_inactive}d`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
