'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Users,
  MessageSquare,
  HelpCircle,
  Heart,
  Loader2,
  Search,
  Sparkles,
  Zap,
  TrendingUp,
  Hash,
} from 'lucide-react'
import PeriodSelector, { getTodayStartSP } from '@/components/cs/period-selector'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

/* ─── Types ─── */

interface SentimentExample {
  content: string
  sender: string
  keywords: string[]
  timestamp: string
}

interface GroupBreakdown {
  id: string
  name: string
  messages: number
  members: number
}

interface CommunityData {
  group_name: string
  kpis: {
    total_messages: number
    active_members: number
    questions_asked: number
    sentiment: { positive_pct: number; negative_pct: number; label: string }
  }
  group_breakdown: GroupBreakdown[]
  evolution: { date: string; messages: number; members: number }[]
  peak_hours: { hour: number; count: number }[]
  day_of_week: { day: string; count: number }[]
  participants: {
    name: string
    messages: number
    questions: number
    helps_given: number
    sentiment_label: string
    status: string
  }[]
  sentiment_detail: {
    positive_count: number
    negative_count: number
    question_count: number
    neutral_count: number
    positive_examples: SentimentExample[]
    negative_examples: SentimentExample[]
  } | null
  topics: { name: string; count: number }[] | null
  keywords: { word: string; count: number }[]
  insights: string[] | null
  team_activity: { total_msgs: number; members: string[] }
  ai_analysis_available: boolean
}

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

const PARTICIPANT_STATUS_COLORS: Record<string, string> = {
  ENGAJADO: 'text-emerald-400 bg-emerald-400/8 border-emerald-400/15',
  MODERADO: 'text-yellow-400 bg-yellow-400/8 border-yellow-400/15',
  SILENCIOSO: 'text-zinc-400 bg-zinc-400/8 border-zinc-400/15',
}

const TOOLTIP_STYLE = {
  background: '#111111',
  border: '1px solid #222222',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 700,
  color: '#fff',
}

const CURSOR_STYLE = { fill: 'rgba(163, 230, 53, 0.04)' }

/* ─── Component ─── */

export default function CsShopeeAdsPage() {
  const [data, setData] = useState<CommunityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodFrom, setPeriodFrom] = useState<Date>(() => getTodayStartSP())
  const [periodTo, setPeriodTo] = useState<Date>(() => new Date())
  const [participantSearch, setParticipantSearch] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/cs/shopee-ads?from=${periodFrom.toISOString()}&to=${periodTo.toISOString()}`
      )
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error('Failed to fetch Shopee ADS data:', e)
    }
    setLoading(false)
  }, [periodFrom, periodTo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredParticipants = useMemo(() => {
    if (!data?.participants) return []
    if (!participantSearch.trim()) return data.participants
    const q = participantSearch.toLowerCase()
    return data.participants.filter((p) => p.name.toLowerCase().includes(q))
  }, [data?.participants, participantSearch])

  const kpis = data?.kpis
  const sentimentPct = kpis?.sentiment?.positive_pct ?? 0
  const sentimentColor =
    sentimentPct > 60 ? 'text-emerald-400' : sentimentPct >= 40 ? 'text-yellow-400' : 'text-red-400'
  const sentimentBarColor =
    sentimentPct > 60 ? 'bg-emerald-400' : sentimentPct >= 40 ? 'bg-yellow-400' : 'bg-red-400'

  // Sentiment detail totals
  const sd = data?.sentiment_detail
  const sentimentTotal = sd
    ? sd.positive_count + sd.negative_count + sd.question_count + sd.neutral_count
    : 0
  const pctOf = (v: number) => (sentimentTotal > 0 ? Math.round((v / sentimentTotal) * 100) : 0)

  // Keywords: find max count for relative sizing
  const maxKeywordCount = useMemo(() => {
    if (!data?.keywords?.length) return 1
    return Math.max(...data.keywords.map((k) => k.count), 1)
  }, [data?.keywords])

  // Topics: find max count for bars
  const maxTopicCount = useMemo(() => {
    if (!data?.topics?.length) return 1
    return Math.max(...data.topics.map((t) => t.count), 1)
  }, [data?.topics])

  return (
    <div className="space-y-8">
      {/* ─── 1. Header ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/8 border border-lime-400/15">
            <Zap size={18} className="text-lime-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Shopee ADS
            </h1>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
              {`Comunidade Shopee ADS 2.0 \u2014 5 Grupos`}
            </p>
          </div>
        </div>

        <PeriodSelector
          from={periodFrom}
          to={periodTo}
          onChange={(f, t) => {
            setPeriodFrom(f)
            setPeriodTo(t)
          }}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={28} className="animate-spin text-lime-400" />
        </div>
      ) : !data ? (
        <div className="flex items-center justify-center py-32">
          <p className="text-[13px] font-semibold text-zinc-600">
            Erro ao carregar dados. Tente novamente.
          </p>
        </div>
      ) : (
        <>
          {/* ─── 2. KPI Cards ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total de Mensagens */}
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5 hover:border-lime-400/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={14} className="text-zinc-600" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  Total de Mensagens
                </span>
              </div>
              <p className="text-2xl font-extrabold text-white">
                {kpis?.total_messages ?? 0}
              </p>
            </div>

            {/* Membros Ativos */}
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5 hover:border-lime-400/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-zinc-600" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  Membros Ativos
                </span>
              </div>
              <p className="text-2xl font-extrabold text-white">
                {kpis?.active_members ?? 0}
              </p>
            </div>

            {/* Perguntas Feitas */}
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5 hover:border-lime-400/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle size={14} className="text-zinc-600" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  Perguntas Feitas
                </span>
              </div>
              <p className="text-2xl font-extrabold text-white">
                {kpis?.questions_asked ?? 0}
              </p>
            </div>

            {/* Sentimento Geral */}
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5 hover:border-lime-400/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Heart size={14} className="text-zinc-600" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  Sentimento Geral
                </span>
              </div>
              <p className={`text-2xl font-extrabold ${sentimentColor}`}>
                {sentimentPct}%
                <span className="text-sm font-semibold ml-1 text-zinc-500">
                  positivo
                </span>
              </p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${sentimentBarColor} transition-all`}
                  style={{ width: `${sentimentPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* ─── 2.5. Breakdown por Grupo ─── */}
          {data.group_breakdown && data.group_breakdown.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold text-white">
                Breakdown por Grupo
                <span className="text-zinc-600 font-semibold ml-2 text-[11px]">
                  {data.group_breakdown.length} grupos
                </span>
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {data.group_breakdown.map((g) => (
                  <div
                    key={g.id}
                    className="rounded-2xl border border-[#222222] bg-[#111111] p-5 hover:border-lime-400/10 transition-all"
                  >
                    <p className="text-[12px] font-bold text-white truncate mb-3" title={g.name}>
                      {g.name}
                    </p>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-lg font-extrabold text-white">{g.messages}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600">
                          Mensagens
                        </p>
                      </div>
                      <div className="h-8 w-px bg-[#222222]" />
                      <div>
                        <p className="text-lg font-extrabold text-white">{g.members}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600">
                          Membros
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── 3. Evolucao ─── */}
          {data.evolution.length > 0 && (
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5">
              <h2 className="text-sm font-extrabold text-white mb-4">
                {`Evolução`}
                <span className="text-zinc-600 font-semibold ml-2 text-[11px]">
                  Volume de Mensagens
                </span>
              </h2>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.evolution}
                    margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="fillLimeShopee" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#A3E635" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#A3E635" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#222222"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
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
                      contentStyle={TOOLTIP_STYLE}
                      cursor={{ stroke: 'rgba(163, 230, 53, 0.2)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="messages"
                      stroke="#A3E635"
                      strokeWidth={2}
                      fill="url(#fillLimeShopee)"
                      name="Mensagens"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ─── 4. Horarios de Pico + Dia da Semana ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Peak Hours */}
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5">
              <h2 className="text-sm font-extrabold text-white mb-4">
                {`Horários de Pico`}
              </h2>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.peak_hours}
                    layout="vertical"
                    margin={{ top: 5, right: 15, left: 5, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#222222"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fill: '#52525b', fontSize: 11, fontWeight: 600 }}
                      axisLine={{ stroke: '#222222' }}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="hour"
                      type="category"
                      tick={{ fill: '#52525b', fontSize: 11, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}h`}
                      width={35}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      cursor={CURSOR_STYLE}
                      labelFormatter={(v) => `${v}h`}
                    />
                    <Bar
                      dataKey="count"
                      fill="#A3E635"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={20}
                      name="Mensagens"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Day of Week */}
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5">
              <h2 className="text-sm font-extrabold text-white mb-4">
                Dia da Semana
              </h2>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.day_of_week}
                    margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#222222"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
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
                      contentStyle={TOOLTIP_STYLE}
                      cursor={CURSOR_STYLE}
                    />
                    <Bar
                      dataKey="count"
                      fill="#A3E635"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                      name="Mensagens"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ─── 5. Ranking de Participantes ─── */}
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-extrabold text-white">
                Ranking de Participantes
                <span className="text-zinc-600 font-semibold ml-2 text-[11px]">
                  {data.participants.length} membros
                </span>
              </h2>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
                />
                <input
                  type="text"
                  placeholder="Buscar participante..."
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  className="w-full sm:w-[260px] rounded-xl border border-[#222222] bg-[#111111] pl-9 pr-4 py-2.5 text-[13px] font-semibold text-white placeholder-zinc-700 outline-none focus:border-lime-400/30 transition-colors"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[#222222] bg-[#111111] overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[40px_1fr_70px_80px_70px_90px_100px] gap-4 px-5 py-3 border-b border-[#222222]">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  #
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  Nome
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">
                  Msgs
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">
                  Perguntas
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">
                  Ajudas
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">
                  Sentimento
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">
                  Status
                </span>
              </div>

              {/* Table rows */}
              {filteredParticipants.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-[13px] font-semibold text-zinc-600">
                    Nenhum participante encontrado.
                  </p>
                </div>
              ) : (
                filteredParticipants.map((p, i) => {
                  const avatarColor = getAvatarColor(p.name)
                  const initial = p.name.charAt(0).toUpperCase()
                  const statusKey = p.status?.toUpperCase() ?? ''
                  const statusCls =
                    PARTICIPANT_STATUS_COLORS[statusKey] ??
                    'text-zinc-600 bg-zinc-800/50 border-zinc-700/30'

                  return (
                    <div
                      key={`${p.name}-${i}`}
                      className="grid grid-cols-[40px_1fr_70px_80px_70px_90px_100px] gap-4 px-5 py-3.5 border-b border-[#1a1a1a] hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="text-[13px] font-bold text-zinc-600">
                        {i + 1}
                      </span>
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full ${avatarColor} flex-shrink-0`}
                        >
                          <span className="text-[10px] font-extrabold text-black">
                            {initial}
                          </span>
                        </div>
                        <span className="text-[13px] font-semibold text-white truncate">
                          {p.name}
                        </span>
                      </div>
                      <span className="text-[13px] font-semibold text-white text-right">
                        {p.messages}
                      </span>
                      <span className="text-[13px] font-semibold text-zinc-400 text-right">
                        {p.questions}
                      </span>
                      <span className="text-[13px] font-semibold text-zinc-400 text-right">
                        {p.helps_given}
                      </span>
                      <span className="text-[13px] font-semibold text-zinc-400 text-right">
                        {p.sentiment_label}
                      </span>
                      <div className="flex justify-end self-center">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${statusCls}`}
                        >
                          {statusKey || p.status}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* ─── 6. Analise de Sentimento ─── */}
          {sd && (
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold text-white">
                {`Análise de Sentimento`}
              </h2>
              <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5">
                {/* Stacked bar */}
                {sentimentTotal > 0 && (
                  <div className="mb-6">
                    <div className="flex h-4 w-full rounded-full overflow-hidden">
                      {sd.positive_count > 0 && (
                        <div
                          className="bg-emerald-400 transition-all"
                          style={{ width: `${pctOf(sd.positive_count)}%` }}
                          title={`Positivo: ${sd.positive_count} (${pctOf(sd.positive_count)}%)`}
                        />
                      )}
                      {sd.negative_count > 0 && (
                        <div
                          className="bg-red-400 transition-all"
                          style={{ width: `${pctOf(sd.negative_count)}%` }}
                          title={`Negativo: ${sd.negative_count} (${pctOf(sd.negative_count)}%)`}
                        />
                      )}
                      {sd.question_count > 0 && (
                        <div
                          className="bg-blue-400 transition-all"
                          style={{ width: `${pctOf(sd.question_count)}%` }}
                          title={`Perguntas: ${sd.question_count} (${pctOf(sd.question_count)}%)`}
                        />
                      )}
                      {sd.neutral_count > 0 && (
                        <div
                          className="bg-zinc-500 transition-all"
                          style={{ width: `${pctOf(sd.neutral_count)}%` }}
                          title={`Neutro: ${sd.neutral_count} (${pctOf(sd.neutral_count)}%)`}
                        />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                        <span className="text-[11px] font-semibold text-zinc-400">
                          Positivo {pctOf(sd.positive_count)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                        <span className="text-[11px] font-semibold text-zinc-400">
                          Negativo {pctOf(sd.negative_count)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                        <span className="text-[11px] font-semibold text-zinc-400">
                          Perguntas {pctOf(sd.question_count)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
                        <span className="text-[11px] font-semibold text-zinc-400">
                          Neutro {pctOf(sd.neutral_count)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Examples: 2-column grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Positive examples */}
                  <div>
                    <h3 className="text-[12px] font-bold text-emerald-400 mb-3">
                      Mensagens Positivas
                    </h3>
                    {sd.positive_examples.length === 0 ? (
                      <p className="text-[12px] font-semibold text-zinc-600">
                        Nenhum exemplo disponivel.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {sd.positive_examples.map((ex, i) => (
                          <div
                            key={i}
                            className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3"
                          >
                            <p className="text-[12px] font-semibold text-zinc-300 line-clamp-2 mb-1.5">
                              &ldquo;{ex.content}&rdquo;
                            </p>
                            <p className="text-[11px] font-semibold text-emerald-400/70 mb-2">
                              {ex.sender}
                            </p>
                            {ex.keywords.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {ex.keywords.map((kw, ki) => (
                                  <span
                                    key={ki}
                                    className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-400/10 border border-emerald-400/20 text-emerald-400"
                                  >
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Negative examples */}
                  <div>
                    <h3 className="text-[12px] font-bold text-red-400 mb-3">
                      Mensagens Negativas
                    </h3>
                    {sd.negative_examples.length === 0 ? (
                      <p className="text-[12px] font-semibold text-zinc-600">
                        Nenhum exemplo disponivel.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {sd.negative_examples.map((ex, i) => (
                          <div
                            key={i}
                            className="rounded-xl border border-red-500/15 bg-red-500/5 p-3"
                          >
                            <p className="text-[12px] font-semibold text-zinc-300 line-clamp-2 mb-1.5">
                              &ldquo;{ex.content}&rdquo;
                            </p>
                            <p className="text-[11px] font-semibold text-red-400/70 mb-2">
                              {ex.sender}
                            </p>
                            {ex.keywords.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {ex.keywords.map((kw, ki) => (
                                  <span
                                    key={ki}
                                    className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-400/10 border border-red-400/20 text-red-400"
                                  >
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── 7. Topicos + Palavras ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Topicos em Alta */}
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={14} className="text-lime-400" />
                <h2 className="text-sm font-extrabold text-white">
                  {`Tópicos em Alta`}
                </h2>
              </div>
              {data.topics && data.topics.length > 0 ? (
                <div className="space-y-2.5">
                  {data.topics.map((topic, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[12px] font-bold text-zinc-500 w-5 text-right flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-semibold text-white truncate">
                            {topic.name}
                          </span>
                          <span className="text-[11px] font-bold text-zinc-500 ml-2 flex-shrink-0">
                            {topic.count}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-lime-400 transition-all"
                            style={{
                              width: `${Math.round((topic.count / maxTopicCount) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] font-semibold text-zinc-600">
                  {`Análise de IA não disponível`}
                </p>
              )}
            </div>

            {/* Palavras Mais Citadas */}
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Hash size={14} className="text-lime-400" />
                <h2 className="text-sm font-extrabold text-white">
                  Palavras Mais Citadas
                </h2>
              </div>
              {data.keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.keywords.map((kw, i) => {
                    const ratio = kw.count / maxKeywordCount
                    const fontSize = 11 + Math.round(ratio * 7)
                    const opacity = 0.4 + ratio * 0.6
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-lime-400/8 border border-lime-400/15 text-lime-400 font-bold"
                        style={{ fontSize: `${fontSize}px`, opacity }}
                      >
                        {kw.word}
                        <span className="text-[9px] font-semibold text-lime-400/50">
                          {kw.count}
                        </span>
                      </span>
                    )
                  })}
                </div>
              ) : (
                <p className="text-[12px] font-semibold text-zinc-600">
                  Nenhuma palavra encontrada.
                </p>
              )}
            </div>
          </div>

          {/* ─── 8. Insights ─── */}
          {data.insights && data.insights.length > 0 ? (
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={14} className="text-lime-400" />
                <h2 className="text-sm font-extrabold text-white">
                  Insights
                </h2>
              </div>
              <ul className="space-y-2.5">
                {data.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div
                      className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${
                        AVATAR_COLORS[i % AVATAR_COLORS.length]
                      }`}
                    />
                    <p className="text-[13px] font-semibold text-zinc-300 leading-relaxed">
                      {insight}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-zinc-600" />
                <h2 className="text-sm font-extrabold text-white">
                  Insights
                </h2>
              </div>
              <p className="text-[12px] font-semibold text-zinc-600">
                {`Insights via IA serão gerados automaticamente`}
              </p>
            </div>
          )}

          {/* ─── 9. Atividade da Equipe Zape ─── */}
          <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-lime-400" />
              <h2 className="text-sm font-extrabold text-white">
                Atividade da Equipe Zape
              </h2>
            </div>
            <p className="text-[13px] font-semibold text-zinc-300 mb-2">
              <span className="text-lime-400 font-extrabold">
                {data.team_activity.total_msgs}
              </span>{' '}
              mensagens da equipe Zape
            </p>
            {data.team_activity.members.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.team_activity.members.map((member, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-semibold text-zinc-400 px-2.5 py-1 rounded-lg bg-zinc-800/50 border border-zinc-700/30"
                  >
                    {member}
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
