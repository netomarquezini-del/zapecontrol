'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  DollarSign,
  Target,
  Users,
  CalendarCheck,
  UserX,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { format, parse, getDaysInMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import KpiCard from '@/components/dashboard/kpi-card'
import SalesChart from '@/components/dashboard/sales-chart'
import CloserRanking from '@/components/dashboard/closer-ranking'
import OrigemChart from '@/components/dashboard/origem-chart'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

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

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState('2026-03')
  const [movements, setMovements] = useState<Movement[]>([])
  const [closers, setClosers] = useState<Closer[]>([])
  const [metasMensais, setMetasMensais] = useState<MetaMensal[]>([])
  const [metasClosers, setMetasClosers] = useState<MetaCloser[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)

    const monthStart = `${selectedMonth}-01`
    const daysInMonth = getDaysInMonth(parse(monthStart, 'yyyy-MM-dd', new Date()))
    const monthEnd = `${selectedMonth}-${String(daysInMonth).padStart(2, '0')}`

    const [movRes, closersRes, metasRes, metasClosersRes] = await Promise.all([
      supabase
        .from('movements')
        .select('*')
        .gte('data_raw', monthStart)
        .lte('data_raw', monthEnd),
      supabase.from('closers').select('*'),
      supabase.from('metas_mensais').select('*').eq('mes', selectedMonth),
      supabase.from('metas_closers').select('*'),
    ])

    setMovements((movRes.data as Movement[]) || [])
    setClosers((closersRes.data as Closer[]) || [])
    setMetasMensais((metasRes.data as MetaMensal[]) || [])

    // Filter metas_closers to only those belonging to metas for this month
    const metaIds = new Set(((metasRes.data as MetaMensal[]) || []).map((m) => m.id))
    const filteredMetasClosers = ((metasClosersRes.data as MetaCloser[]) || []).filter((mc) =>
      metaIds.has(mc.mes_id)
    )
    setMetasClosers(filteredMetasClosers)

    setLoading(false)
  }, [selectedMonth])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- Computed KPIs ---
  const totalVendas = movements.reduce((sum, m) => {
    if (!m.ganhos) return sum
    return sum + m.ganhos.reduce((s, g) => s + (Number(g.valor) || 0), 0)
  }, 0)

  const sumJsonbQuantidade = (field: 'reunioes' | 'agendamentos' | 'noshows' | 'reagendamentos') =>
    movements.reduce((sum, m) => {
      const arr = m[field]
      if (!arr) return sum
      return sum + arr.reduce((s, item) => s + (Number(item.quantidade) || 0), 0)
    }, 0)

  const totalReunioes = sumJsonbQuantidade('reunioes')
  const totalAgendamentos = sumJsonbQuantidade('agendamentos')
  const totalNoshows = sumJsonbQuantidade('noshows')

  const metaMinima = metasMensais.find((m) => m.nivel === 'minima')
  const metaMensalVendas = metaMinima?.meta_mensal_vendas || 0
  const metaDiariaVendas = metaMinima?.meta_diaria_vendas || 0
  const progressPercent = metaMensalVendas > 0 ? (totalVendas / metaMensalVendas) * 100 : 0

  const numVendas = movements.reduce((sum, m) => sum + (m.ganhos?.length || 0), 0)
  const taxaConversao = totalReunioes > 0 ? (numVendas / totalReunioes) * 100 : 0

  // --- Daily Sales Data ---
  const dailySalesMap: Record<string, number> = {}
  movements.forEach((m) => {
    if (!m.ganhos || !m.data_raw) return
    const day = String(parseInt(m.data_raw.split('-')[2], 10))
    dailySalesMap[day] = (dailySalesMap[day] || 0) + m.ganhos.reduce((s, g) => s + (Number(g.valor) || 0), 0)
  })

  const daysCount = getDaysInMonth(parse(`${selectedMonth}-01`, 'yyyy-MM-dd', new Date()))
  const dailySalesData = Array.from({ length: daysCount }, (_, i) => ({
    day: String(i + 1),
    vendas: dailySalesMap[String(i + 1)] || 0,
  }))

  // --- Closer Ranking ---
  const closerMap = new Map(closers.map((c) => [c.id, c.name]))
  const closerStats: Record<
    number,
    { vendas: number; reunioes: number; numVendas: number }
  > = {}

  movements.forEach((m) => {
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

  const closerRankingData = Object.entries(closerStats)
    .map(([closerId, stats]) => {
      const id = Number(closerId)
      const metaCloser = metasClosers.find((mc) => mc.closer_id === id)
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

  // --- Origem Data ---
  const origemMap: Record<string, number> = {}
  movements.forEach((m) => {
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

  // --- Month Navigation ---
  const changeMonth = (delta: number) => {
    const d = parse(`${selectedMonth}-01`, 'yyyy-MM-dd', new Date())
    d.setMonth(d.getMonth() + delta)
    setSelectedMonth(format(d, 'yyyy-MM'))
  }

  const monthLabel = format(parse(`${selectedMonth}-01`, 'yyyy-MM-dd', new Date()), "MMMM 'de' yyyy", {
    locale: ptBR,
  })

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b backdrop-blur-sm"
        style={{
          background: 'rgba(10, 10, 10, 0.8)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Dashboard
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Visão geral de performance comercial
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1.5 rounded-lg transition-colors cursor-pointer"
              style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-card)')}
            >
              <ChevronLeft size={18} />
            </button>
            <span
              className="text-sm font-medium capitalize min-w-[160px] text-center"
              style={{ color: 'var(--text-primary)' }}
            >
              {monthLabel}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="p-1.5 rounded-lg transition-colors cursor-pointer"
              style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-card)')}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <KpiCard
                icon={DollarSign}
                title="Vendas do Mês"
                value={formatCurrency(totalVendas)}
                subtitle={`${numVendas} venda${numVendas !== 1 ? 's' : ''} realizada${numVendas !== 1 ? 's' : ''}`}
                accentColor="text-emerald-400"
              />
              <KpiCard
                icon={Target}
                title="Meta Mensal"
                value={formatCurrency(metaMensalVendas)}
                progress={progressPercent}
                accentColor="text-amber-400"
              />
              <KpiCard
                icon={Users}
                title="Reuniões"
                value={String(totalReunioes)}
                subtitle="realizadas no mês"
                accentColor="text-blue-400"
              />
              <KpiCard
                icon={CalendarCheck}
                title="Agendamentos"
                value={String(totalAgendamentos)}
                subtitle="no período"
                accentColor="text-violet-400"
              />
              <KpiCard
                icon={UserX}
                title="No-Shows"
                value={String(totalNoshows)}
                subtitle={
                  totalReunioes + totalNoshows > 0
                    ? `${((totalNoshows / (totalReunioes + totalNoshows)) * 100).toFixed(1)}% do total`
                    : '0% do total'
                }
                accentColor="text-red-400"
              />
              <KpiCard
                icon={TrendingUp}
                title="Taxa Conversão"
                value={`${taxaConversao.toFixed(1)}%`}
                subtitle="vendas / reuniões"
                accentColor="text-cyan-400"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SalesChart data={dailySalesData} metaDiaria={metaDiariaVendas} />
              </div>
              <div>
                <OrigemChart data={origemData} />
              </div>
            </div>

            {/* Closer Ranking */}
            <CloserRanking data={closerRankingData} />
          </>
        )}
      </main>
    </div>
  )
}
