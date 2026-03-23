'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { getSupabase } from '@/lib/supabase'
import {
  Users,
  Clock,
  Zap,
  LayoutGrid,
  Loader2,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  RefreshCw,
} from 'lucide-react'
import PeriodSelector, { getTodayStartSP } from '@/components/cs/period-selector'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

/* ─── Types ─── */

interface CsMessage {
  id: string
  group_id: string
  sender_name: string | null
  sender_phone: string | null
  is_team_member: boolean
  timestamp: string
}

interface CsGroup {
  id: string
  name: string
}

interface ConsultantData {
  name: string
  msgs_today: number
  msgs_week: number
  avg_response_min: number
  groups_count: number
  proactive_pct: number
  status: 'excellent' | 'good' | 'attention' | 'critical'
}

type SortKey = 'name' | 'msgs_today' | 'msgs_week' | 'avg_response_min' | 'groups_count' | 'proactive_pct' | 'status'

/* ─── Constants ─── */

const AVATAR_COLORS = [
  'bg-lime-400',
  'bg-emerald-400',
  'bg-blue-400',
  'bg-purple-400',
  'bg-pink-400',
  'bg-orange-400',
  'bg-cyan-400',
  'bg-yellow-400',
]

const getAvatarColor = (name: string) =>
  AVATAR_COLORS[
    name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length
  ]

const STATUS_COLORS: Record<string, string> = {
  excellent: 'text-emerald-400 bg-emerald-400/8 border-emerald-400/15',
  good: 'text-lime-400 bg-lime-400/8 border-lime-400/15',
  attention: 'text-yellow-400 bg-yellow-400/8 border-yellow-400/15',
  critical: 'text-red-400 bg-red-400/8 border-red-400/15',
}

const STATUS_LABELS: Record<string, string> = {
  excellent: 'EXCELENTE',
  good: 'BOM',
  attention: 'ATEN\u00c7\u00c3O',
  critical: 'CR\u00cdTICO',
}

const STATUS_TEXT_COLORS: Record<string, string> = {
  excellent: 'text-emerald-400',
  good: 'text-lime-400',
  attention: 'text-yellow-400',
  critical: 'text-red-400',
}

const STATUS_ORDER: Record<string, number> = {
  excellent: 0,
  good: 1,
  attention: 2,
  critical: 3,
}

function cleanTeamName(name: string): string {
  return name
    .replace(/\s*[\|\-l]\s*Zape\s*Ecomm\s*/gi, '')
    .replace(/\s*Zape\s*Ecomm\s*/gi, '')
    .replace(/\s*Zape\s*/gi, '')
    .trim()
}

function getStatus(avgMin: number): 'excellent' | 'good' | 'attention' | 'critical' {
  if (avgMin > 0 && avgMin <= 15) return 'excellent'
  if (avgMin <= 25) return 'good'
  if (avgMin <= 35) return 'attention'
  return 'critical'
}

/* ─── Component ─── */

export default function CsConsultoresPage() {
  const [consultants, setConsultants] = useState<ConsultantData[]>([])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('msgs_week')
  const [sortAsc, setSortAsc] = useState(false)
  const [periodFrom, setPeriodFrom] = useState<Date>(() => getTodayStartSP())
  const [periodTo, setPeriodTo] = useState<Date>(() => new Date())

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = getSupabase()

    const todayStart = getTodayStartSP()

    // Fetch all messages in selected period and groups in parallel
    const [allMsgsRes, groupsRes] = await Promise.all([
      supabase
        .from('cs_messages')
        .select('id, group_id, sender_name, sender_phone, is_team_member, timestamp')
        .gte('timestamp', periodFrom.toISOString())
        .lte('timestamp', periodTo.toISOString())
        .order('timestamp', { ascending: true })
        .limit(10000),
      supabase.from('cs_groups').select('id, name').eq('is_active', true),
    ])

    const allMsgs: CsMessage[] = allMsgsRes.data || []
    const groups: CsGroup[] = groupsRes.data || []
    const groupMap = new Map(groups.map((g) => [g.id, g.name]))

    // Group messages by group_id
    const msgsByGroup: Record<string, CsMessage[]> = {}
    for (const m of allMsgs) {
      if (!msgsByGroup[m.group_id]) msgsByGroup[m.group_id] = []
      msgsByGroup[m.group_id].push(m)
    }

    // Build consultant stats
    const stats: Record<
      string,
      {
        name: string
        msgs_today: number
        msgs_week: number
        groups: Set<string>
        response_times: number[]
        proactive: number
        total: number
      }
    > = {}

    // Pass 1: count messages per consultant
    for (const m of allMsgs) {
      if (!m.is_team_member) continue
      const name = cleanTeamName(m.sender_name || 'Desconhecido')
      if (!name) continue
      if (!stats[name]) {
        stats[name] = {
          name,
          msgs_today: 0,
          msgs_week: 0,
          groups: new Set(),
          response_times: [],
          proactive: 0,
          total: 0,
        }
      }
      const t = new Date(m.timestamp)
      if (t >= todayStart) stats[name].msgs_today++
      stats[name].msgs_week++
      stats[name].groups.add(m.group_id)
      stats[name].total++
    }

    // Pass 2: response times and proactivity per group
    for (const [, msgs] of Object.entries(msgsByGroup)) {
      let pendingClientMsgs: { timestamp: string }[] = []
      for (let i = 0; i < msgs.length; i++) {
        if (msgs[i].is_team_member) {
          const teamName = cleanTeamName(msgs[i].sender_name || '')
          if (!stats[teamName]) continue

          // Proactivity: no client msg in same group within 30min before
          const isProactive = !msgs
            .slice(Math.max(0, i - 10), i)
            .some(
              (prev) =>
                !prev.is_team_member &&
                prev.group_id === msgs[i].group_id &&
                new Date(msgs[i].timestamp).getTime() -
                  new Date(prev.timestamp).getTime() <
                  1800000
            )
          if (isProactive) stats[teamName].proactive++

          // First team response: credit response time to this team member only
          if (pendingClientMsgs.length > 0) {
            const oldest = pendingClientMsgs[0]
            const diff =
              (new Date(msgs[i].timestamp).getTime() -
                new Date(oldest.timestamp).getTime()) /
              60000
            if (diff > 0 && diff < 1440) {
              stats[teamName].response_times.push(diff)
            }
            pendingClientMsgs = []
          }
        } else {
          // Client message: add to pending
          pendingClientMsgs.push({ timestamp: msgs[i].timestamp })
        }
      }
    }

    // Build final consultant data
    const result: ConsultantData[] = Object.values(stats).map((s) => {
      const avgResp =
        s.response_times.length > 0
          ? Math.round(
              s.response_times.reduce((a, b) => a + b, 0) /
                s.response_times.length
            )
          : 0
      const proactivePct =
        s.total > 0 ? Math.round((s.proactive / s.total) * 100) : 0

      return {
        name: s.name,
        msgs_today: s.msgs_today,
        msgs_week: s.msgs_week,
        avg_response_min: avgResp,
        groups_count: s.groups.size,
        proactive_pct: proactivePct,
        status: getStatus(avgResp),
      }
    })

    setConsultants(result)
    setLoading(false)
  }, [periodFrom, periodTo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Sorting
  const sorted = useMemo(() => {
    const arr = [...consultants]
    arr.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') {
        cmp = a.name.localeCompare(b.name)
      } else if (sortKey === 'status') {
        cmp = (STATUS_ORDER[a.status] ?? 4) - (STATUS_ORDER[b.status] ?? 4)
      } else {
        cmp = (a[sortKey] as number) - (b[sortKey] as number)
      }
      return sortAsc ? cmp : -cmp
    })
    return arr
  }, [consultants, sortKey, sortAsc])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  // KPIs
  const totalActive = consultants.length
  const avgResponseAll =
    consultants.length > 0
      ? Math.round(
          consultants.reduce((a, c) => a + c.avg_response_min, 0) /
            consultants.length
        )
      : 0
  const avgProactivity =
    consultants.length > 0
      ? Math.round(
          consultants.reduce((a, c) => a + c.proactive_pct, 0) /
            consultants.length
        )
      : 0
  const avgGroupsPerConsultant =
    consultants.length > 0
      ? (
          consultants.reduce((a, c) => a + c.groups_count, 0) /
          consultants.length
        ).toFixed(1)
      : '0'

  const avgResponseColor =
    avgResponseAll <= 15
      ? 'text-emerald-400'
      : avgResponseAll <= 25
        ? 'text-lime-400'
        : avgResponseAll <= 35
          ? 'text-yellow-400'
          : 'text-red-400'

  // Chart data
  const chartData = useMemo(
    () =>
      [...consultants]
        .sort((a, b) => a.avg_response_min - b.avg_response_min)
        .map((c) => ({
          name: c.name.length > 12 ? c.name.substring(0, 12) + '...' : c.name,
          fullName: c.name,
          tempo: c.avg_response_min,
        })),
    [consultants]
  )

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={10} className="text-zinc-700 ml-1 inline" />
    return sortAsc ? (
      <ChevronUp size={10} className="text-lime-400 ml-1 inline" />
    ) : (
      <ChevronDown size={10} className="text-lime-400 ml-1 inline" />
    )
  }

  return (
    <div className="space-y-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/8 border border-lime-400/15">
            <Users size={18} className="text-lime-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Consultores
            </h1>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
              Joana — Performance da Equipe
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <PeriodSelector
            from={periodFrom}
            to={periodTo}
            onChange={(f, t) => { setPeriodFrom(f); setPeriodTo(t) }}
          />
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-lime-400/10 border border-lime-400/20 px-5 py-2.5 text-[13px] font-bold text-lime-400 hover:bg-lime-400/15 cursor-pointer disabled:opacity-40 transition-all"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <RefreshCw size={15} />
            )}
            Atualizar
          </button>
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
                  Consultores Ativos
                </span>
              </div>
              <p className="text-2xl font-extrabold text-white">
                {totalActive}
              </p>
            </div>

            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5 hover:border-lime-400/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-zinc-600" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  Tempo M{'\u00e9'}dio Resposta
                </span>
              </div>
              <p className={`text-2xl font-extrabold ${avgResponseColor}`}>
                {avgResponseAll}
                <span className="text-sm font-semibold ml-0.5">min</span>
              </p>
            </div>

            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5 hover:border-lime-400/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-zinc-600" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  Proatividade M{'\u00e9'}dia
                </span>
              </div>
              <p className="text-2xl font-extrabold text-lime-400">
                {avgProactivity}%
              </p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-lime-400 transition-all"
                  style={{ width: `${avgProactivity}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5 hover:border-lime-400/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <LayoutGrid size={14} className="text-zinc-600" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  Grupos por Consultor
                </span>
              </div>
              <p className="text-2xl font-extrabold text-white">
                {avgGroupsPerConsultant}
              </p>
            </div>
          </div>

          {/* ─── Consultant Cards Grid ─── */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-white">
              Equipe
              <span className="text-zinc-600 font-semibold ml-2 text-[11px]">
                {consultants.length} consultores
              </span>
            </h2>
            {consultants.length === 0 ? (
              <div className="rounded-2xl border border-[#222222] bg-[#111111] px-5 py-12 text-center">
                <p className="text-[13px] font-semibold text-zinc-600">
                  Nenhum consultor encontrado nos {'\u00fa'}ltimos 7 dias.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sorted.map((c) => {
                  const avatarColor = getAvatarColor(c.name)
                  const initial = c.name.charAt(0).toUpperCase()
                  const respColor = STATUS_TEXT_COLORS[c.status] ?? 'text-zinc-400'

                  return (
                    <div
                      key={c.name}
                      className="rounded-2xl border border-[#222222] bg-[#111111] p-5 hover:border-lime-400/10 transition-all"
                    >
                      {/* Top: avatar + name + status */}
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${avatarColor} flex-shrink-0`}
                        >
                          <span className="text-sm font-extrabold text-black">
                            {initial}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-white truncate">
                            {c.name}
                          </p>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${STATUS_COLORS[c.status] ?? 'text-zinc-600 bg-zinc-800/50 border-zinc-700/30'}`}
                          >
                            {STATUS_LABELS[c.status] ?? c.status}
                          </span>
                        </div>
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-0.5">
                            Msgs Hoje
                          </p>
                          <p className="text-[15px] font-extrabold text-white">
                            {c.msgs_today}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-0.5">
                            Msgs Semana
                          </p>
                          <p className="text-[15px] font-extrabold text-white">
                            {c.msgs_week}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-0.5">
                            Tempo M{'\u00e9'}dio
                          </p>
                          <p className={`text-[15px] font-extrabold ${respColor}`}>
                            {c.avg_response_min}
                            <span className="text-[11px] font-semibold ml-0.5">
                              min
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-0.5">
                            Grupos
                          </p>
                          <p className="text-[15px] font-extrabold text-white">
                            {c.groups_count}
                          </p>
                        </div>
                      </div>

                      {/* Proactivity bar */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                            Proatividade
                          </p>
                          <p className="text-[11px] font-bold text-zinc-400">
                            {c.proactive_pct}%
                          </p>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-lime-400 transition-all"
                            style={{ width: `${Math.min(c.proactive_pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ─── Ranking Table ─── */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-white">
              Ranking
            </h2>
            <div className="rounded-2xl border border-[#222222] bg-[#111111] overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[40px_1fr_80px_80px_90px_70px_90px_90px] gap-4 px-5 py-3 border-b border-[#222222]">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  #
                </span>
                <button
                  onClick={() => handleSort('name')}
                  className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-left cursor-pointer hover:text-zinc-400 transition-colors"
                >
                  Consultor
                  <SortIcon col="name" />
                </button>
                <button
                  onClick={() => handleSort('msgs_today')}
                  className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right cursor-pointer hover:text-zinc-400 transition-colors"
                >
                  Msgs Hoje
                  <SortIcon col="msgs_today" />
                </button>
                <button
                  onClick={() => handleSort('msgs_week')}
                  className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right cursor-pointer hover:text-zinc-400 transition-colors"
                >
                  Msgs Sem.
                  <SortIcon col="msgs_week" />
                </button>
                <button
                  onClick={() => handleSort('avg_response_min')}
                  className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right cursor-pointer hover:text-zinc-400 transition-colors"
                >
                  Tempo M{'\u00e9'}d.
                  <SortIcon col="avg_response_min" />
                </button>
                <button
                  onClick={() => handleSort('groups_count')}
                  className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right cursor-pointer hover:text-zinc-400 transition-colors"
                >
                  Grupos
                  <SortIcon col="groups_count" />
                </button>
                <button
                  onClick={() => handleSort('proactive_pct')}
                  className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right cursor-pointer hover:text-zinc-400 transition-colors"
                >
                  Proativ.
                  <SortIcon col="proactive_pct" />
                </button>
                <button
                  onClick={() => handleSort('status')}
                  className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right cursor-pointer hover:text-zinc-400 transition-colors"
                >
                  Status
                  <SortIcon col="status" />
                </button>
              </div>

              {/* Rows */}
              {sorted.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-[13px] font-semibold text-zinc-600">
                    Nenhum dado de equipe dispon{'\u00ed'}vel.
                  </p>
                </div>
              ) : (
                sorted.map((c, i) => (
                  <div
                    key={c.name}
                    className="grid grid-cols-[40px_1fr_80px_80px_90px_70px_90px_90px] gap-4 px-5 py-3.5 border-b border-[#1a1a1a] hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-[13px] font-bold text-zinc-600">
                      {i + 1}
                    </span>
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full ${getAvatarColor(c.name)} flex-shrink-0`}
                      >
                        <span className="text-[10px] font-extrabold text-black">
                          {c.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[13px] font-semibold text-white truncate">
                        {c.name}
                      </span>
                    </div>
                    <span className="text-[13px] font-semibold text-white text-right">
                      {c.msgs_today}
                    </span>
                    <span className="text-[13px] font-semibold text-zinc-400 text-right">
                      {c.msgs_week}
                    </span>
                    <span
                      className={`text-[13px] font-semibold text-right ${STATUS_TEXT_COLORS[c.status] ?? 'text-zinc-400'}`}
                    >
                      {c.avg_response_min}min
                    </span>
                    <span className="text-[13px] font-semibold text-zinc-400 text-right">
                      {c.groups_count}
                    </span>
                    <span className="text-[13px] font-semibold text-zinc-400 text-right">
                      {c.proactive_pct}%
                    </span>
                    <div className="flex justify-end self-center">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${STATUS_COLORS[c.status] ?? 'text-zinc-600 bg-zinc-800/50 border-zinc-700/30'}`}
                      >
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ─── Comparativo Chart ─── */}
          {chartData.length > 0 && (
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5">
              <h2 className="text-sm font-extrabold text-white mb-4">
                Comparativo de Tempo de Resposta
                <span className="text-zinc-600 font-semibold ml-2 text-[11px]">
                  M{'\u00e9'}dia em minutos por consultor
                </span>
              </h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#222222"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#52525b', fontSize: 11, fontWeight: 600 }}
                      axisLine={{ stroke: '#222222' }}
                      tickLine={false}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tick={{ fill: '#52525b', fontSize: 11, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: 'min',
                        position: 'insideTopLeft',
                        offset: 10,
                        style: { fill: '#52525b', fontSize: 10, fontWeight: 700 },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#111111',
                        border: '1px solid #222222',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#fff',
                      }}
                      cursor={{ fill: 'rgba(163, 230, 53, 0.04)' }}
                      formatter={(value) => [`${value} min`, 'Tempo Médio']}
                      labelFormatter={(_: any, payload: any) =>
                        payload?.[0]?.payload?.fullName ?? _
                      }
                    />
                    <Bar
                      dataKey="tempo"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                      fill="#A3E635"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
