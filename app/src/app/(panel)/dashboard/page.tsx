'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import {
  Target,
  DollarSign,
  CalendarCheck,
  Users,
  Trophy,
  Receipt,
  TrendingUp,
  RefreshCw,
  UserX,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  ShoppingBag,
} from 'lucide-react'
import { format, parse, getDaysInMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import DatePicker from '@/components/date-picker'
import KpiCard from '@/components/dashboard/kpi-card'
import SalesChart from '@/components/dashboard/sales-chart'
import CloserRanking from '@/components/dashboard/closer-ranking'
// OrigemChart replaced with inline bar view

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const NIVEIS = ['minima', 'super', 'ultra', 'black'] as const
const NIVEL_LABELS: Record<string, string> = {
  minima: 'Minima',
  super: 'Super',
  ultra: 'Ultra',
  black: 'Black',
}
const NIVEL_COLORS: Record<string, string> = {
  minima: 'text-zinc-400',
  super: 'text-blue-400',
  ultra: 'text-purple-400',
  black: 'text-amber-400',
}

interface GanhoItem {
  valor: number
  sdr_id?: number
  sdr_name?: string
  origem_id?: number
  servico_id?: number
  sub_origem?: string
  origem_name?: string
  servico_name?: string
}

interface JsonbItem {
  sdr_id?: number
  quantidade: number
}

interface Movement {
  id: number
  data: string
  data_raw: string
  closer_id: number
  agendamentos: JsonbItem[] | null
  reunioes: JsonbItem[] | null
  reagendamentos: JsonbItem[] | null
  noshows: JsonbItem[] | null
  ganhos: GanhoItem[] | null
}

interface Closer {
  id: number
  name: string
}

interface MetaMensal {
  id: number
  mes: string
  nivel: string
  meta_mensal_vendas: number
  meta_diaria_vendas: number
}

interface MetaCloser {
  id: number
  mes_id: number
  closer_id: number
  meta_mensal: number
  meta_diaria: number
}

interface Sdr {
  id: number
  name: string
}

interface MetaSdr {
  id: number
  mes_id: number
  sdr_id: number
  meta_mensal: number
  meta_diaria: number
  meta_reunioes_mensal: number
  meta_reunioes_diaria: number
}

function getMonthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return {
    start: `${y}-${String(m + 1).padStart(2, '0')}-01`,
    end: `${y}-${String(m + 1).padStart(2, '0')}-${String(new Date(y, m + 1, 0).getDate()).padStart(2, '0')}`,
  };
}

export default function DashboardPage() {
  const [startDate, setStartDate] = useState(getMonthRange().start)
  const [endDate, setEndDate] = useState(getMonthRange().end)
  const [movements, setMovements] = useState<Movement[]>([])         // filtrado pelo periodo
  const [monthMovements, setMonthMovements] = useState<Movement[]>([]) // mes inteiro (panorama)
  const [closers, setClosers] = useState<Closer[]>([])
  const [metasMensais, setMetasMensais] = useState<MetaMensal[]>([])
  const [metasClosers, setMetasClosers] = useState<MetaCloser[]>([])
  const [sdrs, setSdrs] = useState<Sdr[]>([])
  const [metasSdrs, setMetasSdrs] = useState<MetaSdr[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNivel, setSelectedNivel] = useState<string>('minima')

  // Meta sempre do mes derivado do startDate
  const metaMonth = startDate.substring(0, 7)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = getSupabase()

    // Calcular range do mes inteiro baseado no metaMonth
    const [yy, mm] = metaMonth.split('-').map(Number)
    const monthStart = `${metaMonth}-01`
    const monthEnd = `${metaMonth}-${String(new Date(yy, mm, 0).getDate()).padStart(2, '0')}`

    const [movRes, monthMovRes, closersRes, metasRes, metasClosersRes, sdrsRes, metasSdrsRes] = await Promise.all([
      // Movements do periodo selecionado
      supabase.from('movements').select('*').gte('data_raw', startDate).lte('data_raw', endDate),
      // Movements do mes inteiro (para panorama)
      supabase.from('movements').select('*').gte('data_raw', monthStart).lte('data_raw', monthEnd),
      supabase.from('closers').select('*'),
      supabase.from('metas_mensais').select('*').eq('mes', metaMonth),
      supabase.from('metas_closers').select('*'),
      supabase.from('sdrs').select('*'),
      supabase.from('metas_sdrs').select('*'),
    ])

    setMovements((movRes.data as Movement[]) || [])
    setMonthMovements((monthMovRes.data as Movement[]) || [])
    setClosers((closersRes.data as Closer[]) || [])
    setMetasMensais((metasRes.data as MetaMensal[]) || [])
    setSdrs((sdrsRes.data as Sdr[]) || [])

    const metaIds = new Set(((metasRes.data as MetaMensal[]) || []).map((m) => m.id))
    const filteredMetasClosers = ((metasClosersRes.data as MetaCloser[]) || []).filter((mc) =>
      metaIds.has(mc.mes_id)
    )
    setMetasClosers(filteredMetasClosers)
    const filteredMetasSdrs = ((metasSdrsRes.data as MetaSdr[]) || []).filter((ms) =>
      metaIds.has(ms.mes_id)
    )
    setMetasSdrs(filteredMetasSdrs)

    setLoading(false)
  }, [startDate, endDate, metaMonth])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- PANORAMA KPIs (mes inteiro) ---
  const sumMovField = (movs: Movement[], fn: (m: Movement) => number) => movs.reduce((s, m) => s + fn(m), 0)
  const sumJsonb = (movs: Movement[], field: 'reunioes' | 'agendamentos' | 'noshows' | 'reagendamentos') =>
    movs.reduce((sum, m) => { const arr = m[field]; if (!arr) return sum; return sum + arr.reduce((s, item) => s + (Number(item.quantidade) || 0), 0) }, 0)

  const totalVendasMes = sumMovField(monthMovements, (m) => (m.ganhos ?? []).reduce((s, g) => s + (Number(g.valor) || 0), 0))
  const numVendasMes = sumMovField(monthMovements, (m) => m.ganhos?.length || 0)

  // Meta for each nivel
  const getMetaNivel = (nivel: string) => metasMensais.find((m) => m.nivel === nivel)
  const metaAtual = getMetaNivel(selectedNivel)
  const metaMensalVendas = metaAtual?.meta_mensal_vendas || 0
  const metaDiariaVendas = metaAtual?.meta_diaria_vendas || 0
  const progressPercent = metaMensalVendas > 0 ? (totalVendasMes / metaMensalVendas) * 100 : 0

  const businessDaysElapsed = (() => {
    const [y, mo] = metaMonth.split('-').map(Number)
    const now = new Date()
    const isCurrentMonth = now.getFullYear() === y && (now.getMonth() + 1) === mo
    const lastDay = isCurrentMonth ? now.getDate() : new Date(y, mo, 0).getDate()
    let count = 0
    for (let d = 1; d <= lastDay; d++) { const dow = new Date(y, mo - 1, d).getDay(); if (dow >= 1 && dow <= 5) count++ }
    return count
  })()
  const metaEsperada = metaDiariaVendas * businessDaysElapsed
  const diferencaMeta = totalVendasMes - metaEsperada

  // --- PERIODO KPIs (filtrado pelo periodo selecionado) ---
  const totalVendas = sumMovField(movements, (m) => (m.ganhos ?? []).reduce((s, g) => s + (Number(g.valor) || 0), 0))
  const numVendas = sumMovField(movements, (m) => m.ganhos?.length || 0)
  const totalReunioes = sumJsonb(movements, 'reunioes')
  const totalAgendamentos = sumJsonb(movements, 'agendamentos')
  const totalNoshows = sumJsonb(movements, 'noshows')
  const totalReagendamentos = sumJsonb(movements, 'reagendamentos')

  const ticketMedio = numVendas > 0 ? totalVendas / numVendas : 0
  const taxaConversao = totalReunioes > 0 ? (numVendas / totalReunioes) * 100 : 0
  const taxaReagendamento = totalReunioes > 0 ? (totalReagendamentos / totalReunioes) * 100 : 0
  const taxaNoshow = (totalReunioes + totalNoshows) > 0 ? (totalNoshows / (totalReunioes + totalNoshows)) * 100 : 0

  // --- Vendas por Servico ---
  const servicoMap: Record<string, { valor: number; qtd: number }> = {}
  movements.forEach((m) => {
    if (!m.ganhos) return
    m.ganhos.forEach((g) => {
      const label = g.servico_name || 'Nao informado'
      if (!servicoMap[label]) servicoMap[label] = { valor: 0, qtd: 0 }
      servicoMap[label].valor += Number(g.valor) || 0
      servicoMap[label].qtd += 1
    })
  })
  const servicoData = Object.entries(servicoMap)
    .map(([name, d]) => ({ name, valor: d.valor, qtd: d.qtd }))
    .sort((a, b) => b.valor - a.valor)

  // --- Daily Sales Data (mes inteiro) ---
  const dailySalesMap: Record<string, number> = {}
  monthMovements.forEach((m) => {
    if (!m.ganhos || !m.data_raw) return
    const day = String(parseInt(m.data_raw.split('-')[2], 10))
    dailySalesMap[day] = (dailySalesMap[day] || 0) + m.ganhos.reduce((s, g) => s + (Number(g.valor) || 0), 0)
  })

  const daysCount = getDaysInMonth(parse(`${metaMonth}-01`, 'yyyy-MM-dd', new Date()))
  const dailySalesData = Array.from({ length: daysCount }, (_, i) => ({
    day: String(i + 1),
    vendas: dailySalesMap[String(i + 1)] || 0,
  }))

  // --- Closer Ranking (mes inteiro) ---
  const closerMap = new Map(closers.map((c) => [c.id, c.name]))
  const closerStats: Record<number, { vendas: number; reunioes: number; numVendas: number }> = {}

  monthMovements.forEach((m) => {
    if (!closerStats[m.closer_id]) {
      closerStats[m.closer_id] = { vendas: 0, reunioes: 0, numVendas: 0 }
    }
    const stats = closerStats[m.closer_id]
    if (m.ganhos) {
      stats.vendas += m.ganhos.reduce((s, g) => s + (Number(g.valor) || 0), 0)
      stats.numVendas += m.ganhos.length
    }
    if (m.reunioes) {
      stats.reunioes += m.reunioes.reduce((s, r) => s + (Number(r.quantidade) || 0), 0)
    }
  })

  // Filter closer metas by selected nivel
  const selectedMetaMensalId = metasMensais.find((m) => m.nivel === selectedNivel)?.id
  const closerMetasForNivel = metasClosers.filter((mc) => mc.mes_id === selectedMetaMensalId)
  const sdrMetasForNivel = metasSdrs.filter((ms) => ms.mes_id === selectedMetaMensalId)

  const closerRankingData = Object.entries(closerStats)
    .map(([closerId, stats]) => {
      const id = Number(closerId)
      const metaCloser = closerMetasForNivel.find((mc) => mc.closer_id === id)
      const meta = metaCloser?.meta_mensal || 0
      return {
        position: 0,
        name: closerMap.get(id) || `Closer ${id}`,
        vendas: stats.vendas,
        meta,
        percentAtingido: meta > 0 ? (stats.vendas / meta) * 100 : 0,
        reunioes: stats.reunioes,
        conversao: stats.reunioes > 0 ? (stats.numVendas / stats.reunioes) * 100 : 0,
      }
    })
    .sort((a, b) => b.vendas - a.vendas)
    .map((item, index) => ({ ...item, position: index + 1 }))

  // --- SDR Ranking ---
  const sdrNameMap = new Map(sdrs.map((s) => [s.id, s.name]))
  const sdrStats: Record<number, { agend: number; reun: number; vendas: number; numVendas: number }> = {}
  monthMovements.forEach((m) => {
    const init = () => ({ agend: 0, reun: 0, vendas: 0, numVendas: 0 });
    (m.agendamentos ?? []).forEach((a) => { if (a.sdr_id == null) return; if (!sdrStats[a.sdr_id]) sdrStats[a.sdr_id] = init(); sdrStats[a.sdr_id].agend += a.quantidade; });
    (m.reunioes ?? []).forEach((r) => { if (r.sdr_id == null) return; if (!sdrStats[r.sdr_id]) sdrStats[r.sdr_id] = init(); sdrStats[r.sdr_id].reun += r.quantidade; });
    (m.ganhos ?? []).forEach((g) => { if (g.sdr_id == null) return; if (!sdrStats[g.sdr_id]) sdrStats[g.sdr_id] = init(); sdrStats[g.sdr_id].vendas += (Number(g.valor) || 0); sdrStats[g.sdr_id].numVendas += 1; });
  })
  const sdrRankingData = Object.entries(sdrStats)
    .map(([sdrId, stats]) => {
      const id = Number(sdrId)
      const metaSdr = sdrMetasForNivel.find((ms) => ms.sdr_id === id)
      const meta = metaSdr?.meta_mensal || 0
      const metaReun = metaSdr?.meta_reunioes_mensal || 0
      return {
        position: 0,
        name: sdrNameMap.get(id) || `SDR ${id}`,
        agend: stats.agend,
        reun: stats.reun,
        vendas: stats.vendas,
        numVendas: stats.numVendas,
        meta,
        metaReun,
        percentAtingido: meta > 0 ? (stats.agend / meta) * 100 : 0,
        percentReunAtingido: metaReun > 0 ? (stats.reun / metaReun) * 100 : 0,
      }
    })
    .sort((a, b) => b.vendas - a.vendas)
    .map((item, index) => ({ ...item, position: index + 1 }))

  // --- Origem Data ---
  const origemMap: Record<string, number> = {}
  monthMovements.forEach((m) => {
    if (!m.ganhos) return
    m.ganhos.forEach((g) => {
      const label = g.sub_origem
        ? `${g.origem_name || 'Desconhecida'} - ${g.sub_origem}`
        : g.origem_name || 'Desconhecida'
      origemMap[label] = (origemMap[label] || 0) + (Number(g.valor) || 0)
    })
  })

  const origemData = Object.entries(origemMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const monthLabel = format(parse(`${startDate.substring(0, 7)}-01`, 'yyyy-MM-dd', new Date()), "MMMM 'de' yyyy", {
    locale: ptBR,
  })

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b backdrop-blur-xl"
        style={{ background: 'rgba(0, 0, 0, 0.8)', borderColor: 'var(--border-color)' }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Dashboard
            </h1>
            <p className="text-[11px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>
              Performance comercial
            </p>
          </div>

          <DatePicker startDate={startDate} endDate={endDate} onChange={(s, e) => { setStartDate(s); setEndDate(e); }} />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-8 flex flex-col gap-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Carregando dados</span>
          </div>
        ) : (
          <>
            {/* ROW 0: Meta levels side by side */}
            <div>
              <p className="text-label mb-3">Metas do Mes</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['minima', 'super', 'ultra', 'black'] as const).map((nivel) => {
                  const meta = getMetaNivel(nivel)
                  const isSelected = selectedNivel === nivel
                  return (
                    <button
                      key={nivel}
                      onClick={() => setSelectedNivel(nivel)}
                      className={`card p-4 text-left cursor-pointer transition-all duration-200 ${
                        isSelected ? 'border-lime-400/30 shadow-[0_0_20px_rgba(163,230,53,0.06)]' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">{NIVEL_LABELS[nivel]}</span>
                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-lime-400 shadow-[0_0_6px_rgba(163,230,53,0.5)]" />}
                      </div>
                      <p className={`text-lg font-extrabold ${isSelected ? 'text-lime-400' : 'text-zinc-300'}`}>
                        {meta ? formatCurrency(meta.meta_mensal_vendas) : '—'}
                      </p>
                      <p className="text-[10px] font-semibold text-zinc-600 mt-1">
                        Diaria: {meta ? formatCurrency(meta.meta_diaria_vendas) : '—'}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ROW 1: Meta Mensal, Meta Esperada, Vendas, Diferença */}
            <div>
              <p className="text-label mb-3">Panorama de Vendas</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className={`p-5 flex flex-col gap-4 transition-all duration-500 rounded-2xl border ${
                  progressPercent >= 100
                    ? 'bg-lime-400 border-lime-400 shadow-[0_0_40px_rgba(163,230,53,0.3)]'
                    : 'card'
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors duration-500 ${
                    progressPercent >= 100
                      ? 'bg-black/20 border-black/20 text-black'
                      : 'bg-white/[0.04] border-white/[0.06] text-zinc-300'
                  }`}>
                    <Target size={18} strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.05em] transition-colors duration-500 ${
                      progressPercent >= 100 ? 'text-black/60' : 'text-zinc-600'
                    }`}>Meta Mensal</span>
                    <span className={`text-2xl font-extrabold tracking-tight leading-none transition-colors duration-500 ${
                      progressPercent >= 100 ? 'text-black' : 'text-white'
                    }`}>
                      {formatCurrency(metaMensalVendas)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className={`w-full h-1.5 rounded-full ${progressPercent >= 100 ? 'bg-black/15' : 'bg-[#1a1a1a]'}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          progressPercent >= 100 ? 'bg-black/40' : progressPercent >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                      />
                    </div>
                    <span className={`text-[11px] font-extrabold transition-colors duration-500 ${
                      progressPercent >= 100 ? 'text-black/70' : 'text-zinc-600'
                    }`}>
                      {progressPercent >= 100 ? 'META ATINGIDA!' : `${progressPercent.toFixed(1)}% atingido`}
                    </span>
                  </div>
                </div>
                <KpiCard icon={CalendarCheck} title="Meta Esperada Hoje" value={formatCurrency(metaEsperada)} subtitle={`${businessDaysElapsed} dias uteis`} accentColor="text-zinc-300" />
                <KpiCard icon={DollarSign} title="Vendas do Mes" value={formatCurrency(totalVendasMes)} subtitle={`${numVendasMes} venda${numVendasMes !== 1 ? 's' : ''}`} accentColor="text-lime-400" />
                <div className="card p-5 flex flex-col gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/[0.06] ${diferencaMeta >= 0 ? 'text-lime-400' : 'text-red-400'}`}>
                    <TrendingUp size={18} strokeWidth={1.5} className={diferencaMeta < 0 ? 'rotate-180' : ''} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-label">
                      {diferencaMeta >= 0 ? 'Acima da Meta' : 'Abaixo da Meta'}
                    </span>
                    <span className={`text-2xl font-extrabold tracking-tight leading-none ${diferencaMeta >= 0 ? 'text-lime-400' : 'text-red-400'}`}>
                      {diferencaMeta >= 0 ? '+' : ''}{formatCurrency(diferencaMeta)}
                    </span>
                    <span className="text-[11px] font-normal text-zinc-600">
                      vs meta esperada ate hoje
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2a: Vendas Periodo + Ganhos, Ticket, Conversao */}
            <div>
              <p className="text-label mb-3">Resultados do Periodo</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="card p-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-lime-400/10 border border-lime-400/20 text-lime-400 mb-4">
                    <DollarSign size={18} strokeWidth={1.5} />
                  </div>
                  <span className="text-label">Vendas Periodo</span>
                  <p className="text-2xl font-extrabold text-lime-400 tracking-tight leading-none mt-1.5">{formatCurrency(totalVendas)}</p>
                  <p className="text-[11px] font-normal text-zinc-600 mt-1">{numVendas} venda{numVendas !== 1 ? 's' : ''}</p>
                </div>
                <KpiCard icon={Trophy} title="Ganhos" value={String(numVendas)} subtitle="fechamentos" accentColor="text-lime-400" />
                <KpiCard icon={Receipt} title="Ticket Medio" value={formatCurrency(ticketMedio)} accentColor="text-white" />
                <KpiCard icon={TrendingUp} title="Taxa Conversao" value={`${taxaConversao.toFixed(1)}%`} subtitle="vendas / reunioes" accentColor="text-white" />
              </div>
            </div>

            {/* ROW 2b: Agend, Reuniao, Reagend, Noshow com taxas */}
            <div>
              <p className="text-label mb-3">Operacional</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="card p-4">
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-1">Agendamentos</p>
                  <p className="text-xl font-extrabold text-white">{totalAgendamentos}</p>
                </div>
                <div className="card p-4">
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-1">Reunioes</p>
                  <p className="text-xl font-extrabold text-white">{totalReunioes}</p>
                  <p className="text-[10px] font-semibold text-zinc-600 mt-1">Taxa: <span className="text-zinc-300">{totalAgendamentos > 0 ? ((totalReunioes / totalAgendamentos) * 100).toFixed(1) : '0.0'}%</span></p>
                </div>
                <div className="card p-4">
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-1">Reagendamentos</p>
                  <p className="text-xl font-extrabold text-white">{totalReagendamentos}</p>
                  <p className="text-[10px] font-semibold text-zinc-600 mt-1">Taxa: <span className="text-zinc-300">{totalAgendamentos > 0 ? ((totalReagendamentos / totalAgendamentos) * 100).toFixed(1) : '0.0'}%</span></p>
                </div>
                <div className="card p-4">
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-1">No-Show</p>
                  <p className="text-xl font-extrabold text-white">{totalNoshows}</p>
                  <p className="text-[10px] font-semibold text-zinc-600 mt-1">Taxa: <span className="text-zinc-300">{totalAgendamentos > 0 ? ((totalNoshows / totalAgendamentos) * 100).toFixed(1) : '0.0'}%</span></p>
                </div>
              </div>
            </div>

            {/* Funnel Chart */}
            {totalAgendamentos > 0 && (
              <div className="card p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-5">Funil Comercial</p>
                <div className="space-y-2">
                  {(() => {
                    const steps = [
                      { label: 'Agendamentos', value: totalAgendamentos },
                      { label: 'Reunioes', value: totalReunioes },
                      { label: 'Ganhos', value: numVendas },
                    ]
                    const max = steps[0].value || 1
                    return steps.map((step, i) => {
                      const pct = max > 0 ? (step.value / max) * 100 : 0
                      const prevValue = i > 0 ? steps[i - 1].value : null
                      const convRate = prevValue && prevValue > 0 ? ((step.value / prevValue) * 100).toFixed(1) : null
                      return (
                        <div key={step.label}>
                          {convRate && (
                            <div className="flex items-center gap-2 mb-1 ml-1">
                              <div className="w-4 h-px bg-zinc-700" />
                              <span className="text-[10px] font-bold text-lime-400">{convRate}%</span>
                            </div>
                          )}
                          <div className="flex items-center gap-4">
                            <span className="text-[12px] font-bold text-zinc-400 min-w-[110px]">{step.label}</span>
                            <div className="flex-1 relative">
                              <div className="h-10 rounded-lg bg-[#1a1a1a] overflow-hidden">
                                <div
                                  className="h-full rounded-lg bg-lime-400/20 transition-all duration-700 flex items-center justify-end pr-3"
                                  style={{ width: `${Math.max(pct, 3)}%` }}
                                >
                                  <span className="text-[13px] font-extrabold text-lime-400">{step.value}</span>
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] font-bold text-zinc-600 min-w-[40px] text-right">{pct.toFixed(0)}%</span>
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            )}

            {/* Vendas Diarias — full width */}
            <SalesChart data={dailySalesData} metaDiaria={metaDiariaVendas} />

            {/* Vendas por Origem + Servico side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Origem Table */}
              {origemData.length > 0 && (
                <div className="card p-6">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-lime-400/8 border border-lime-400/15">
                      <ShoppingBag size={15} className="text-lime-400" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Vendas por Origem</p>
                  </div>
                  <div className="space-y-2.5">
                    {origemData.map((o) => {
                      const pct = totalVendas > 0 ? (o.value / totalVendas) * 100 : 0
                      return (
                        <div key={o.name} className="flex items-center gap-3">
                          <span className="text-[12px] font-bold text-white min-w-[120px] truncate">{o.name}</span>
                          <div className="flex-1 h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
                            <div className="h-full rounded-full bg-lime-400/50 transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[12px] font-extrabold text-lime-400 min-w-[90px] text-right">{formatCurrency(o.value)}</span>
                          <span className="text-[10px] font-bold text-zinc-600 min-w-[35px] text-right">{pct.toFixed(0)}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Servico Table */}
              {servicoData.length > 0 && (
                <div className="card p-6">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-lime-400/8 border border-lime-400/15">
                      <ShoppingBag size={15} className="text-lime-400" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Vendas por Servico</p>
                  </div>
                  <div className="space-y-2.5">
                    {servicoData.map((s) => {
                      const pct = totalVendas > 0 ? (s.valor / totalVendas) * 100 : 0
                      return (
                        <div key={s.name} className="flex items-center gap-3">
                          <span className="text-[12px] font-bold text-white min-w-[120px] truncate">{s.name}</span>
                          <div className="flex-1 h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
                            <div className="h-full rounded-full bg-lime-400/50 transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[12px] font-extrabold text-lime-400 min-w-[90px] text-right">{formatCurrency(s.valor)}</span>
                          <span className="text-[10px] font-bold text-zinc-600 min-w-[50px] text-right">{s.qtd} venda{s.qtd !== 1 ? 's' : ''}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Closer Ranking */}
            <CloserRanking data={closerRankingData} />

            {/* SDR Ranking */}
            {sdrRankingData.length > 0 && (
              <div className="card p-6">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-400/8 border border-amber-400/15">
                    <Trophy size={15} className="text-amber-400" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Ranking de SDRs
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <th className="text-left py-3 px-3 text-label">#</th>
                        <th className="text-left py-3 px-3 text-label">SDR</th>
                        <th className="text-right py-3 px-3 text-label">Agend.</th>
                        <th className="text-right py-3 px-3 text-label">Meta Agend</th>
                        <th className="text-right py-3 px-3 text-label">% Agend</th>
                        <th className="text-right py-3 px-3 text-label">Reunioes</th>
                        <th className="text-right py-3 px-3 text-label">Meta Reun</th>
                        <th className="text-right py-3 px-3 text-label">% Reun</th>
                        <th className="text-right py-3 px-3 text-label">Vendas R$</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sdrRankingData.map((sdr) => {
                        const statusColor = sdr.percentAtingido >= 100 ? '#A3E635' : sdr.percentAtingido >= 70 ? '#f59e0b' : '#ef4444'
                        const statusBg = sdr.percentAtingido >= 100 ? 'rgba(163,230,53,0.08)' : sdr.percentAtingido >= 70 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)'
                        const reunStatusColor = sdr.percentReunAtingido >= 100 ? '#A3E635' : sdr.percentReunAtingido >= 70 ? '#f59e0b' : '#ef4444'
                        const reunStatusBg = sdr.percentReunAtingido >= 100 ? 'rgba(163,230,53,0.08)' : sdr.percentReunAtingido >= 70 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)'
                        return (
                          <tr key={sdr.position} style={{ borderBottom: '1px solid var(--border-color)' }} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-3">
                              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold" style={{ background: sdr.position === 1 ? 'rgba(163,230,53,0.12)' : 'var(--border-color)', color: sdr.position === 1 ? '#A3E635' : 'var(--text-muted)' }}>
                                {sdr.position}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 font-bold text-white">{sdr.name}</td>
                            <td className="py-3.5 px-3 text-right font-extrabold text-white">{sdr.agend}</td>
                            <td className="py-3.5 px-3 text-right font-semibold text-zinc-500">{sdr.meta || '—'}</td>
                            <td className="py-3.5 px-3 text-right">
                              {sdr.meta > 0 ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold" style={{ background: statusBg, color: statusColor }}>
                                  {sdr.percentAtingido.toFixed(1)}%
                                </span>
                              ) : <span className="text-zinc-600">—</span>}
                            </td>
                            <td className="py-3.5 px-3 text-right font-semibold text-zinc-300">{sdr.reun}</td>
                            <td className="py-3.5 px-3 text-right font-semibold text-zinc-500">{sdr.metaReun || '—'}</td>
                            <td className="py-3.5 px-3 text-right">
                              {sdr.metaReun > 0 ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold" style={{ background: reunStatusBg, color: reunStatusColor }}>
                                  {sdr.percentReunAtingido.toFixed(1)}%
                                </span>
                              ) : <span className="text-zinc-600">—</span>}
                            </td>
                            <td className="py-3.5 px-3 text-right font-extrabold text-lime-400">{formatCurrency(sdr.vendas)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
