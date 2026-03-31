'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart3, Loader2, Download, Phone, PhoneIncoming, Clock, DollarSign,
  Users, UserCheck, CalendarCheck, Zap, MessageCircle, Instagram, TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from 'recharts'
import type { SdrLeadStatus } from '@/lib/types-sdr'
import { PIPELINE_STATUSES } from '@/lib/types-sdr'

// ══════════════════════════════════════════════════════════════
//  Types
// ══════════════════════════════════════════════════════════════

interface KPIs {
  total_calls: number
  calls_answered: number
  connection_rate: number
  calls_per_hour: number
  avg_call_duration: number
  cost_per_connection: number
  total_leads: number
  leads_qualified: number
  leads_scheduled: number
  speed_to_lead_avg: number
}

interface CallsByDay {
  date: string
  total: number
  answered: number
}

interface CallsBySdr {
  sdr_id: string
  sdr_name: string
  total: number
  answered: number
  avg_duration: number
  connection_rate: number
  schedules: number
}

interface MetricsData {
  kpis: KPIs
  calls_by_day: CallsByDay[]
  calls_by_sdr: CallsBySdr[]
}

interface FunnelItem {
  status: SdrLeadStatus
  count: number
  percentage: number
}

interface HeatmapCell {
  day: number
  hour: number
  total: number
  answered: number
  rate: number
}

interface ChannelData {
  whatsapp: { sent: number; delivered: number; read: number; response_rate: number; avg_response_time: number }
  instagram: { sent: number; delivered: number; read: number; response_rate: number; avg_response_time: number }
  phone: { total: number; answered: number; connection_rate: number; avg_duration: number }
}

interface NoShowData {
  total_scheduled: number
  realized: number
  no_show: number
  no_show_rate: number
}

type Period = 'today' | '7d' | '30d' | 'custom'

// ══════════════════════════════════════════════════════════════
//  Helpers
// ══════════════════════════════════════════════════════════════

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatSpeedToLead(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}min`
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return `${h}h ${m}min`
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'custom', label: 'Personalizado' },
]

function buildParams(period: Period, sdrId: string, startDate: string, endDate: string) {
  const p = new URLSearchParams({ period })
  if (sdrId) p.set('sdr_id', sdrId)
  if (period === 'custom' && startDate) p.set('start_date', startDate)
  if (period === 'custom' && endDate) p.set('end_date', endDate)
  return p.toString()
}

// ══════════════════════════════════════════════════════════════
//  Tooltip component for Recharts
// ══════════════════════════════════════════════════════════════

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2 shadow-lg">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs font-medium" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  Main Page
// ══════════════════════════════════════════════════════════════

export default function SdrMetricasPage() {
  const [period, setPeriod] = useState<Period>('7d')
  const [sdrId, setSdrId] = useState('')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [funnel, setFunnel] = useState<FunnelItem[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([])
  const [channels, setChannels] = useState<ChannelData | null>(null)
  const [noshow, setNoshow] = useState<NoShowData | null>(null)
  const [sdrOptions, setSdrOptions] = useState<{ id: string; name: string }[]>([])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const qs = buildParams(period, sdrId, customStart, customEnd)

    try {
      const [metricsRes, funnelRes, heatmapRes, channelsRes, noshowRes] = await Promise.all([
        fetch(`/api/sdr/metrics?${qs}`),
        fetch(`/api/sdr/metrics/funnel?${qs}`),
        fetch(`/api/sdr/metrics/heatmap?${qs}`),
        fetch(`/api/sdr/metrics/channels?${qs}`),
        fetch(`/api/sdr/metrics/noshow?${qs}`),
      ])

      const [metricsData, funnelData, heatmapData, channelsData, noshowData] = await Promise.all([
        metricsRes.json(),
        funnelRes.json(),
        heatmapRes.json(),
        channelsRes.json(),
        noshowRes.json(),
      ])

      setMetrics(metricsData)
      setFunnel(Array.isArray(funnelData) ? funnelData : [])
      setHeatmap(Array.isArray(heatmapData) ? heatmapData : [])
      setChannels(channelsData)
      setNoshow(noshowData)

      // Build SDR options from ranking data
      if (metricsData?.calls_by_sdr?.length) {
        const opts = metricsData.calls_by_sdr.map((s: CallsBySdr) => ({
          id: s.sdr_id,
          name: s.sdr_name,
        }))
        setSdrOptions(prev => {
          const existing = new Set(prev.map(p => p.id))
          const merged = [...prev]
          for (const o of opts) {
            if (!existing.has(o.id)) merged.push(o)
          }
          return merged
        })
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err)
    } finally {
      setLoading(false)
    }
  }, [period, sdrId, customStart, customEnd])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // ── CSV Export ──
  function exportCSV() {
    if (!metrics) return

    const rows: string[][] = []
    rows.push(['Metrica', 'Valor'])
    rows.push(['Total Chamadas', String(metrics.kpis.total_calls)])
    rows.push(['Chamadas Atendidas', String(metrics.kpis.calls_answered)])
    rows.push(['Taxa de Conexao (%)', String(metrics.kpis.connection_rate)])
    rows.push(['Chamadas/Hora', String(metrics.kpis.calls_per_hour)])
    rows.push(['Tempo Medio (s)', String(metrics.kpis.avg_call_duration)])
    rows.push(['Custo por Conexao (R$)', String(metrics.kpis.cost_per_connection)])
    rows.push(['Total Leads', String(metrics.kpis.total_leads)])
    rows.push(['Qualificados', String(metrics.kpis.leads_qualified)])
    rows.push(['Agendados', String(metrics.kpis.leads_scheduled)])
    rows.push(['Speed to Lead (s)', String(metrics.kpis.speed_to_lead_avg)])
    rows.push([])
    rows.push(['Data', 'Total Chamadas', 'Atendidas'])
    for (const d of metrics.calls_by_day) {
      rows.push([d.date, String(d.total), String(d.answered)])
    }
    rows.push([])
    rows.push(['SDR', 'Chamadas', 'Atendidas', 'Taxa Conexao (%)', 'Tempo Medio (s)', 'Agendamentos'])
    for (const s of metrics.calls_by_sdr) {
      rows.push([s.sdr_name, String(s.total), String(s.answered), String(s.connection_rate), String(Math.round(s.avg_duration)), String(s.schedules)])
    }

    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sdr-metricas-${period}-${new Date().toISOString().substring(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Heatmap helpers ──
  function getHeatmapCell(day: number, hour: number): HeatmapCell {
    return heatmap.find(h => h.day === day && h.hour === hour) || { day, hour, total: 0, answered: 0, rate: 0 }
  }

  function heatmapColor(rate: number, total: number): string {
    if (total === 0) return 'bg-[#1a1a1a]'
    if (rate >= 80) return 'bg-lime-400/80'
    if (rate >= 60) return 'bg-lime-400/50'
    if (rate >= 40) return 'bg-lime-400/30'
    if (rate >= 20) return 'bg-lime-400/15'
    return 'bg-lime-400/5'
  }

  const kpis = metrics?.kpis

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 lg:p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-lime-400/10 border border-lime-400/20">
            <BarChart3 size={20} className="text-lime-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Metricas SDR</h1>
        </div>

        <button
          onClick={exportCSV}
          disabled={!metrics}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#222222] border border-[#333] text-sm text-zinc-300 hover:bg-[#2a2a2a] hover:text-white transition-colors disabled:opacity-40"
        >
          <Download size={16} />
          Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {PERIOD_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === opt.value
                ? 'bg-lime-400 text-black'
                : 'bg-[#1a1a1a] border border-[#333] text-zinc-400 hover:text-white hover:border-zinc-500'
            }`}
          >
            {opt.label}
          </button>
        ))}

        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-sm text-white"
            />
            <span className="text-zinc-500 text-sm">ate</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-sm text-white"
            />
          </div>
        )}

        <select
          value={sdrId}
          onChange={e => setSdrId(e.target.value)}
          className="px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-sm text-zinc-300 min-w-[160px]"
        >
          <option value="">Todos SDRs</option>
          {sdrOptions.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={32} className="animate-spin text-lime-400" />
        </div>
      ) : !metrics ? (
        <div className="rounded-2xl border border-[#222222] bg-[#111111] p-10 text-center">
          <p className="text-sm text-zinc-500">Erro ao carregar metricas</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Row 1: Primary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              icon={<PhoneIncoming size={18} className="text-lime-400" />}
              label="Taxa de Conexao"
              value={`${kpis!.connection_rate}%`}
              sub={`${kpis!.calls_answered} de ${kpis!.total_calls} chamadas`}
              accent
            />
            <KPICard
              icon={<Phone size={18} className="text-blue-400" />}
              label="Chamadas/Hora"
              value={String(kpis!.calls_per_hour)}
              sub={`${kpis!.total_calls} chamadas no periodo`}
            />
            <KPICard
              icon={<Clock size={18} className="text-amber-400" />}
              label="Tempo Medio"
              value={formatDuration(kpis!.avg_call_duration)}
              sub="Duracao media das chamadas atendidas"
            />
            <KPICard
              icon={<DollarSign size={18} className="text-emerald-400" />}
              label="Custo por Conexao"
              value={`R$ ${kpis!.cost_per_connection.toFixed(2)}`}
              sub="Estimativa baseada em minutos"
            />
          </div>

          {/* Row 2: Secondary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              icon={<Users size={18} className="text-violet-400" />}
              label="Total Leads"
              value={String(kpis!.total_leads)}
              sub="Leads criados no periodo"
            />
            <KPICard
              icon={<UserCheck size={18} className="text-indigo-400" />}
              label="Qualificados"
              value={String(kpis!.leads_qualified)}
              sub={kpis!.total_leads > 0 ? `${((kpis!.leads_qualified / kpis!.total_leads) * 100).toFixed(1)}% do total` : '0% do total'}
            />
            <KPICard
              icon={<CalendarCheck size={18} className="text-emerald-400" />}
              label="Agendados"
              value={String(kpis!.leads_scheduled)}
              sub={kpis!.total_leads > 0 ? `${((kpis!.leads_scheduled / kpis!.total_leads) * 100).toFixed(1)}% do total` : '0% do total'}
            />
            <KPICard
              icon={<Zap size={18} className="text-yellow-400" />}
              label="Speed to Lead"
              value={formatSpeedToLead(kpis!.speed_to_lead_avg)}
              sub="Tempo medio ate primeiro contato"
            />
          </div>

          {/* Row 3: Calls by day line chart */}
          <div className="rounded-2xl border border-[#222222] bg-[#111111] p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Chamadas por Dia</h2>
            {metrics.calls_by_day.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">Sem dados para o periodo</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.calls_by_day}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="date"
                    stroke="#666"
                    tick={{ fill: '#999', fontSize: 12 }}
                    tickFormatter={v => {
                      const parts = v.split('-')
                      return `${parts[2]}/${parts[1]}`
                    }}
                  />
                  <YAxis stroke="#666" tick={{ fill: '#999', fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: '#999' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total"
                    stroke="#a3e635"
                    strokeWidth={2}
                    dot={{ fill: '#a3e635', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="answered"
                    name="Atendidas"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    dot={{ fill: '#60a5fa', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Row 4: Funnel + Channels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Funnel */}
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Funil do Pipeline</h2>
              {funnel.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8">Sem dados</p>
              ) : (
                <div className="space-y-3">
                  {funnel.filter(f => f.status !== 'descartado').map(item => {
                    const config = PIPELINE_STATUSES.find(p => p.value === item.status)
                    const maxCount = Math.max(...funnel.map(f => f.count), 1)
                    const barWidth = Math.max(4, (item.count / maxCount) * 100)
                    return (
                      <div key={item.status} className="flex items-center gap-3">
                        <span className="text-xs text-zinc-400 w-24 text-right shrink-0">
                          {config?.label || item.status}
                        </span>
                        <div className="flex-1 h-8 bg-[#1a1a1a] rounded-lg overflow-hidden relative">
                          <div
                            className="h-full rounded-lg transition-all duration-500"
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor: config?.color || '#a3e635',
                              opacity: 0.7,
                            }}
                          />
                          <span className="absolute inset-0 flex items-center px-3 text-xs font-medium text-white">
                            {item.count} ({item.percentage}%)
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {/* Show descartado separately */}
                  {funnel.filter(f => f.status === 'descartado').map(item => {
                    const config = PIPELINE_STATUSES.find(p => p.value === item.status)
                    const maxCount = Math.max(...funnel.map(f => f.count), 1)
                    const barWidth = Math.max(4, (item.count / maxCount) * 100)
                    return (
                      <div key={item.status} className="flex items-center gap-3 pt-2 border-t border-[#222]">
                        <span className="text-xs text-zinc-400 w-24 text-right shrink-0">
                          {config?.label || item.status}
                        </span>
                        <div className="flex-1 h-8 bg-[#1a1a1a] rounded-lg overflow-hidden relative">
                          <div
                            className="h-full rounded-lg transition-all duration-500"
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor: config?.color || '#f87171',
                              opacity: 0.5,
                            }}
                          />
                          <span className="absolute inset-0 flex items-center px-3 text-xs font-medium text-white">
                            {item.count} ({item.percentage}%)
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Channel metrics */}
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Canais</h2>
              {!channels ? (
                <p className="text-sm text-zinc-500 text-center py-8">Sem dados</p>
              ) : (
                <div className="space-y-4">
                  {/* WhatsApp */}
                  <div className="rounded-xl border border-[#222] bg-[#0f0f0f] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageCircle size={16} className="text-green-400" />
                      <span className="text-sm font-medium text-white">WhatsApp</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <ChannelStat label="Enviadas" value={channels.whatsapp.sent} />
                      <ChannelStat label="Entregues" value={channels.whatsapp.delivered} />
                      <ChannelStat label="Lidas" value={channels.whatsapp.read} />
                      <ChannelStat label="Taxa Resposta" value={`${channels.whatsapp.response_rate}%`} />
                    </div>
                  </div>

                  {/* Instagram */}
                  <div className="rounded-xl border border-[#222] bg-[#0f0f0f] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Instagram size={16} className="text-pink-400" />
                      <span className="text-sm font-medium text-white">Instagram</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <ChannelStat label="Enviadas" value={channels.instagram.sent} />
                      <ChannelStat label="Entregues" value={channels.instagram.delivered} />
                      <ChannelStat label="Lidas" value={channels.instagram.read} />
                      <ChannelStat label="Taxa Resposta" value={`${channels.instagram.response_rate}%`} />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="rounded-xl border border-[#222] bg-[#0f0f0f] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Phone size={16} className="text-blue-400" />
                      <span className="text-sm font-medium text-white">Telefone</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <ChannelStat label="Total" value={channels.phone.total} />
                      <ChannelStat label="Atendidas" value={channels.phone.answered} />
                      <ChannelStat label="Taxa Conexao" value={`${channels.phone.connection_rate}%`} />
                      <ChannelStat label="Tempo Medio" value={formatDuration(channels.phone.avg_duration)} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Row 5: Heatmap */}
          <div className="rounded-2xl border border-[#222222] bg-[#111111] p-6">
            <h2 className="text-sm font-semibold text-white mb-1">Heatmap de Conexao</h2>
            <p className="text-xs text-zinc-500 mb-4">Taxa de conexao por dia da semana e hora (Horario de Brasilia)</p>

            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                {/* Day labels header */}
                <div className="grid grid-cols-[48px_repeat(7,1fr)] gap-1 mb-1">
                  <div />
                  {/* Reorder: Mon(1), Tue(2), Wed(3), Thu(4), Fri(5), Sat(6), Sun(0) */}
                  {[1, 2, 3, 4, 5, 6, 0].map(d => (
                    <div key={d} className="text-center text-xs text-zinc-500 font-medium py-1">
                      {DAY_LABELS[d]}
                    </div>
                  ))}
                </div>

                {/* Hour rows (8h to 20h for business hours focus) */}
                {Array.from({ length: 24 }, (_, hour) => (
                  <div key={hour} className="grid grid-cols-[48px_repeat(7,1fr)] gap-1 mb-1">
                    <div className="text-right text-xs text-zinc-500 pr-2 leading-6">
                      {String(hour).padStart(2, '0')}h
                    </div>
                    {[1, 2, 3, 4, 5, 6, 0].map(day => {
                      const cell = getHeatmapCell(day, hour)
                      return (
                        <div
                          key={`${day}-${hour}`}
                          className={`h-6 rounded-sm ${heatmapColor(cell.rate, cell.total)} transition-colors cursor-default group relative`}
                          title={`${DAY_LABELS[day]} ${String(hour).padStart(2, '0')}h - ${cell.total} chamadas, ${cell.answered} atendidas (${cell.rate}%)`}
                        >
                          {cell.total > 0 && (
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] text-white/60 font-medium">
                              {cell.total}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}

                {/* Legend */}
                <div className="flex items-center gap-2 mt-3 justify-end">
                  <span className="text-xs text-zinc-500">Menos</span>
                  <div className="h-3 w-5 rounded-sm bg-[#1a1a1a]" />
                  <div className="h-3 w-5 rounded-sm bg-lime-400/5" />
                  <div className="h-3 w-5 rounded-sm bg-lime-400/15" />
                  <div className="h-3 w-5 rounded-sm bg-lime-400/30" />
                  <div className="h-3 w-5 rounded-sm bg-lime-400/50" />
                  <div className="h-3 w-5 rounded-sm bg-lime-400/80" />
                  <span className="text-xs text-zinc-500">Mais</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 6: SDR Ranking */}
          <div className="rounded-2xl border border-[#222222] bg-[#111111] p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Ranking SDR</h2>
            {metrics.calls_by_sdr.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">Sem dados</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#222]">
                      <th className="text-left text-xs text-zinc-500 font-medium py-3 px-3">#</th>
                      <th className="text-left text-xs text-zinc-500 font-medium py-3 px-3">SDR</th>
                      <th className="text-right text-xs text-zinc-500 font-medium py-3 px-3">Chamadas</th>
                      <th className="text-right text-xs text-zinc-500 font-medium py-3 px-3">Conexoes</th>
                      <th className="text-right text-xs text-zinc-500 font-medium py-3 px-3">Taxa</th>
                      <th className="text-right text-xs text-zinc-500 font-medium py-3 px-3">Tempo Medio</th>
                      <th className="text-right text-xs text-zinc-500 font-medium py-3 px-3">Agendamentos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...metrics.calls_by_sdr]
                      .sort((a, b) => b.answered - a.answered)
                      .map((sdr, idx) => (
                        <tr key={sdr.sdr_id} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors">
                          <td className="py-3 px-3 text-zinc-500">
                            {idx === 0 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-lime-400/20 text-lime-400 text-xs font-bold">1</span>
                            ) : (
                              <span className="text-xs">{idx + 1}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-medium text-white">{sdr.sdr_name}</td>
                          <td className="py-3 px-3 text-right text-zinc-300">{sdr.total}</td>
                          <td className="py-3 px-3 text-right text-zinc-300">{sdr.answered}</td>
                          <td className="py-3 px-3 text-right">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              sdr.connection_rate >= 50
                                ? 'bg-lime-400/10 text-lime-400'
                                : sdr.connection_rate >= 30
                                  ? 'bg-amber-400/10 text-amber-400'
                                  : 'bg-red-400/10 text-red-400'
                            }`}>
                              {sdr.connection_rate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right text-zinc-300">{formatDuration(sdr.avg_duration)}</td>
                          <td className="py-3 px-3 text-right text-zinc-300">{sdr.schedules}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Row 7: No-show */}
          {noshow && (
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-amber-400" />
                <h2 className="text-sm font-semibold text-white">No-Show</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{noshow.total_scheduled}</p>
                  <p className="text-xs text-zinc-500 mt-1">Total Agendados</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-400">{noshow.realized}</p>
                  <p className="text-xs text-zinc-500 mt-1">Realizados</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">{noshow.no_show}</p>
                  <p className="text-xs text-zinc-500 mt-1">No-shows</p>
                </div>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${noshow.no_show_rate > 30 ? 'text-red-400' : noshow.no_show_rate > 15 ? 'text-amber-400' : 'text-lime-400'}`}>
                    {noshow.no_show_rate}%
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Taxa No-show</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  Subcomponents
// ══════════════════════════════════════════════════════════════

function KPICard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  accent?: boolean
}) {
  return (
    <div className={`rounded-2xl border p-5 ${
      accent
        ? 'border-lime-400/20 bg-lime-400/5'
        : 'border-[#222222] bg-[#111111]'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-xs text-zinc-400 font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${accent ? 'text-lime-400' : 'text-white'}`}>
        {value}
      </p>
      <p className="text-xs text-zinc-500 mt-1">{sub}</p>
    </div>
  )
}

function ChannelStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  )
}
