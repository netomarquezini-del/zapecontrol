'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import {
  BarChart3,
  Loader2,
  Clock,
  Users,
  MessageSquare,
  AlertTriangle,
  TrendingDown,
  VolumeX,
  MessageCircleOff,
} from 'lucide-react'
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

interface AnalyticsData {
  overview: {
    messages_today: number
    messages_yesterday: number
    active_groups: number
    total_groups: number
    avg_response_time_min: number
    team_messages_today: number
    client_messages_today: number
  }
  alerts: {
    no_response_1h: number
    inactive_7d: number
    negative_keywords: number
    declining_engagement: number
  }
  peak_hours: { hour: string; messages: number }[]
  team_performance: {
    name: string
    responses_today: number
    avg_response_min: number
    groups: number
    proactivity: number
    status: 'EXCELENTE' | 'BOM' | 'ATENÇÃO' | 'CRÍTICO'
  }[]
  client_ranking: {
    name: string
    msgs_today: number
    msgs_week: number
    team_msgs: number
    client_msgs: number
    last_activity: string | null
    status: 'Ativo' | 'Inativo' | 'Em Risco'
  }[]
  health: {
    declining: { name: string; change: string }[]
    no_response: { name: string; since: string }[]
    silent_clients: { name: string; since: string }[]
  }
  negative_keywords: {
    group: string
    keyword: string
    preview: string
    timestamp: string
  }[]
}

type Period = 'today' | 'week' | 'month'

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Hoje',
  week: 'Semana',
  month: 'Mês',
}

const STATUS_COLORS: Record<string, string> = {
  EXCELENTE: 'text-emerald-400 bg-emerald-400/8 border-emerald-400/15',
  BOM: 'text-lime-400 bg-lime-400/8 border-lime-400/15',
  'ATENÇÃO': 'text-yellow-400 bg-yellow-400/8 border-yellow-400/15',
  'CRÍTICO': 'text-red-400 bg-red-400/8 border-red-400/15',
}

const CLIENT_STATUS_DOT: Record<string, string> = {
  Ativo: 'bg-lime-400 shadow-[0_0_6px_rgba(163,230,53,0.5)]',
  Inativo: 'bg-zinc-600',
  'Em Risco': 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]',
}

function cleanName(name: string) {
  return name.replace(/\s*\|.*$/, '').trim()
}

function formatTimeAgo(dateStr: string | null) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export default function CsAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('today')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/cs/analytics?period=${period}`)
      const data = await res.json()
      setAnalytics(data)
    } catch (e) {
      console.error('Failed to fetch analytics:', e)
    }
    setLoading(false)
  }, [period])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const overview = analytics?.overview
  const msgDiff =
    overview && overview.messages_yesterday > 0
      ? Math.round(
          ((overview.messages_today - overview.messages_yesterday) /
            overview.messages_yesterday) *
            100
        )
      : 0

  const avgTime = overview?.avg_response_time_min ?? 0
  const avgTimeColor =
    avgTime <= 15
      ? 'text-emerald-400'
      : avgTime <= 30
        ? 'text-yellow-400'
        : 'text-red-400'

  const teamRatio =
    overview && overview.team_messages_today + overview.client_messages_today > 0
      ? Math.round(
          (overview.team_messages_today /
            (overview.team_messages_today + overview.client_messages_today)) *
            100
        )
      : 0

  return (
    <div className="space-y-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/8 border border-lime-400/15">
            <BarChart3 size={18} className="text-lime-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Analytics CS
            </h1>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
              Joana — Indicadores de Customer Success
            </p>
          </div>
        </div>

        {/* Period Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-[#222222] bg-[#111111] p-1">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-4 py-2 text-[12px] font-bold transition-all cursor-pointer ${
                period === p
                  ? 'bg-lime-400/10 text-lime-400 border border-lime-400/20'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={28} className="animate-spin text-lime-400" />
        </div>
      ) : !analytics ? (
        <div className="flex items-center justify-center py-32">
          <p className="text-[13px] font-semibold text-zinc-600">
            Erro ao carregar dados. Tente novamente.
          </p>
        </div>
      ) : (
        <>
          {/* ─── Section 1: Overview KPIs ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Mensagens Hoje */}
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5 hover:border-lime-400/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={14} className="text-zinc-600" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  Mensagens Hoje
                </span>
              </div>
              <p className="text-2xl font-extrabold text-white">
                {overview?.messages_today ?? 0}
              </p>
              {msgDiff !== 0 && (
                <p
                  className={`text-[11px] font-bold mt-1 ${msgDiff > 0 ? 'text-lime-400' : 'text-red-400'}`}
                >
                  {msgDiff > 0 ? '+' : ''}
                  {msgDiff}% vs ontem
                </p>
              )}
            </div>

            {/* Grupos Ativos */}
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5 hover:border-lime-400/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-zinc-600" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  Grupos Ativos
                </span>
              </div>
              <p className="text-2xl font-extrabold text-white">
                {overview?.active_groups ?? 0}
                <span className="text-sm font-semibold text-zinc-600 ml-1">
                  / {overview?.total_groups ?? 0}
                </span>
              </p>
            </div>

            {/* Tempo Médio Resposta */}
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5 hover:border-lime-400/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-zinc-600" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  Tempo Médio Resposta
                </span>
              </div>
              <p className={`text-2xl font-extrabold ${avgTimeColor}`}>
                {avgTime}
                <span className="text-sm font-semibold ml-0.5">min</span>
              </p>
            </div>

            {/* Ratio Equipe/Cliente */}
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5 hover:border-lime-400/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-zinc-600" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  Ratio Equipe/Cliente
                </span>
              </div>
              <p className="text-2xl font-extrabold text-white">
                {teamRatio}%
              </p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-lime-400 transition-all"
                  style={{ width: `${teamRatio}%` }}
                />
              </div>
            </div>
          </div>

          {/* ─── Section 2: Alertas Rápidos ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-red-500/15 bg-red-500/5 p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/15 flex-shrink-0">
                <MessageCircleOff size={16} className="text-red-400" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-red-400">
                  {analytics.alerts.no_response_1h}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-red-400/60">
                  Sem resposta &gt;1h
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-orange-500/15 bg-orange-500/5 p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/15 flex-shrink-0">
                <AlertTriangle size={16} className="text-orange-400" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-orange-400">
                  {analytics.alerts.inactive_7d}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-orange-400/60">
                  Inativos &gt;7 dias
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-yellow-500/15 bg-yellow-500/5 p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-500/10 border border-yellow-500/15 flex-shrink-0">
                <AlertTriangle size={16} className="text-yellow-400" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-yellow-400">
                  {analytics.alerts.negative_keywords}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-yellow-400/60">
                  Keywords negativas
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-500/15 bg-zinc-500/5 p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-500/10 border border-zinc-500/15 flex-shrink-0">
                <TrendingDown size={16} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-zinc-300">
                  {analytics.alerts.declining_engagement}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">
                  Queda engajamento
                </p>
              </div>
            </div>
          </div>

          {/* ─── Section 3: Horário de Pico ─── */}
          <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5">
            <h2 className="text-sm font-extrabold text-white mb-4">
              Horário de Pico
              <span className="text-zinc-600 font-semibold ml-2 text-[11px]">
                Mensagens por hora (últimos 7 dias)
              </span>
            </h2>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.peak_hours}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#222222"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: '#52525b', fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: '#222222' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#52525b', fontSize: 11, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
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
                    labelFormatter={(v) => `${v}h`}
                  />
                  <Bar
                    dataKey="messages"
                    fill="#A3E635"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ─── Section 4: Performance da Equipe ─── */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-white">
              Performance da Equipe
            </h2>
            <div className="rounded-2xl border border-[#222222] bg-[#111111] overflow-hidden">
              <div className="grid grid-cols-[40px_1fr_100px_100px_80px_100px_100px] gap-4 px-5 py-3 border-b border-[#222222]">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  #
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  Consultor
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">
                  Respostas
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">
                  Tempo Médio
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">
                  Grupos
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">
                  Proatividade
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">
                  Status
                </span>
              </div>
              {analytics.team_performance.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-[13px] font-semibold text-zinc-600">
                    Nenhum dado de equipe disponível.
                  </p>
                </div>
              ) : (
                analytics.team_performance.map((member, i) => (
                  <div
                    key={member.name}
                    className="grid grid-cols-[40px_1fr_100px_100px_80px_100px_100px] gap-4 px-5 py-3.5 border-b border-[#1a1a1a] hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-[13px] font-bold text-zinc-600">
                      {i + 1}
                    </span>
                    <span className="text-[13px] font-semibold text-white truncate">
                      {cleanName(member.name)}
                    </span>
                    <span className="text-[13px] font-semibold text-white text-right">
                      {member.responses_today}
                    </span>
                    <span className="text-[13px] font-semibold text-zinc-400 text-right">
                      {member.avg_response_min}min
                    </span>
                    <span className="text-[13px] font-semibold text-zinc-400 text-right">
                      {member.groups}
                    </span>
                    <span className="text-[13px] font-semibold text-zinc-400 text-right">
                      {member.proactivity}%
                    </span>
                    <div className="flex justify-end self-center">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${STATUS_COLORS[member.status] ?? 'text-zinc-600 bg-zinc-800/50 border-zinc-700/30'}`}
                      >
                        {member.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ─── Section 5: Ranking de Clientes ─── */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-white">
              Ranking de Clientes
              <span className="text-zinc-600 font-semibold ml-2 text-[11px]">
                Top 20
              </span>
            </h2>
            <div className="rounded-2xl border border-[#222222] bg-[#111111] overflow-hidden">
              <div className="grid grid-cols-[40px_1fr_80px_80px_80px_80px_100px_90px] gap-4 px-5 py-3 border-b border-[#222222]">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  #
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  Cliente
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">
                  Msgs Hoje
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">
                  Msgs Sem.
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">
                  Equipe
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">
                  Cliente
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">
                  Última Ativ.
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">
                  Status
                </span>
              </div>
              {analytics.client_ranking.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-[13px] font-semibold text-zinc-600">
                    Nenhum dado de clientes disponível.
                  </p>
                </div>
              ) : (
                analytics.client_ranking.slice(0, 20).map((client, i) => (
                  <div
                    key={`${client.name}-${i}`}
                    className="grid grid-cols-[40px_1fr_80px_80px_80px_80px_100px_90px] gap-4 px-5 py-3.5 border-b border-[#1a1a1a] hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-[13px] font-bold text-zinc-600">
                      {i + 1}
                    </span>
                    <span className="text-[13px] font-semibold text-white truncate">
                      {cleanName(client.name)}
                    </span>
                    <span className="text-[13px] font-semibold text-white text-right">
                      {client.msgs_today}
                    </span>
                    <span className="text-[13px] font-semibold text-zinc-400 text-right">
                      {client.msgs_week}
                    </span>
                    <span className="text-[13px] font-semibold text-zinc-400 text-right">
                      {client.team_msgs}
                    </span>
                    <span className="text-[13px] font-semibold text-zinc-400 text-right">
                      {client.client_msgs}
                    </span>
                    <span className="text-[12px] font-semibold text-zinc-500 text-right self-center">
                      {formatTimeAgo(client.last_activity)}
                    </span>
                    <div className="flex items-center justify-end gap-2 self-center">
                      <div
                        className={`h-2 w-2 rounded-full flex-shrink-0 ${CLIENT_STATUS_DOT[client.status] ?? 'bg-zinc-600'}`}
                      />
                      <span className="text-[11px] font-bold text-zinc-500">
                        {client.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ─── Section 6: Saúde dos Clientes ─── */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-white">
              Saúde dos Clientes
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Declining */}
              <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown size={14} className="text-orange-400" />
                  <span className="text-[12px] font-bold text-white">
                    Clientes em Queda
                  </span>
                </div>
                {analytics.health.declining.length === 0 ? (
                  <p className="text-[12px] font-semibold text-zinc-600">
                    Nenhum cliente em queda.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {analytics.health.declining.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl bg-orange-500/5 border border-orange-500/10 px-3 py-2"
                      >
                        <span className="text-[12px] font-semibold text-white truncate mr-2">
                          {cleanName(item.name)}
                        </span>
                        <span className="text-[11px] font-bold text-orange-400 flex-shrink-0">
                          {item.change}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* No Response */}
              <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <VolumeX size={14} className="text-red-400" />
                  <span className="text-[12px] font-bold text-white">
                    Clientes Sem Resposta
                  </span>
                </div>
                {analytics.health.no_response.length === 0 ? (
                  <p className="text-[12px] font-semibold text-zinc-600">
                    Todos respondidos.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {analytics.health.no_response.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl bg-red-500/5 border border-red-500/10 px-3 py-2"
                      >
                        <span className="text-[12px] font-semibold text-white truncate mr-2">
                          {cleanName(item.name)}
                        </span>
                        <span className="text-[11px] font-bold text-red-400 flex-shrink-0">
                          {item.since}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Silent Clients */}
              <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircleOff size={14} className="text-zinc-400" />
                  <span className="text-[12px] font-bold text-white">
                    Clientes Silenciosos
                  </span>
                </div>
                {analytics.health.silent_clients.length === 0 ? (
                  <p className="text-[12px] font-semibold text-zinc-600">
                    Todos engajados.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {analytics.health.silent_clients.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl bg-zinc-500/5 border border-zinc-500/10 px-3 py-2"
                      >
                        <span className="text-[12px] font-semibold text-white truncate mr-2">
                          {cleanName(item.name)}
                        </span>
                        <span className="text-[11px] font-bold text-zinc-400 flex-shrink-0">
                          {item.since}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── Section 7: Keywords Negativas ─── */}
          {analytics.negative_keywords.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold text-white">
                Keywords Negativas
                <span className="text-red-400/60 font-semibold ml-2 text-[11px]">
                  {analytics.negative_keywords.length} detectadas
                </span>
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {analytics.negative_keywords.map((kw, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-red-500/15 bg-red-500/5 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-bold text-red-400">
                        {kw.keyword}
                      </span>
                      <span className="text-[10px] font-semibold text-zinc-600">
                        {formatTimeAgo(kw.timestamp)}
                      </span>
                    </div>
                    <p className="text-[12px] font-semibold text-zinc-400 truncate">
                      {cleanName(kw.group)}
                    </p>
                    <p className="text-[11px] font-medium text-zinc-600 mt-1 truncate">
                      &ldquo;{kw.preview}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
