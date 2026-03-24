'use client'

import { useEffect, useState, useCallback } from 'react'
import { ShoppingBag, DollarSign, TrendingUp, RefreshCw, CreditCard, ArrowDownRight, ArrowUpRight, Package, Clock, MapPin, Zap, Target, Percent } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'

const PERIODS = [
  { key: 'today', label: 'Hoje' },
  { key: 'yesterday', label: 'Ontem' },
  { key: '3d', label: '3 dias' },
  { key: '7d', label: '7 dias' },
  { key: '14d', label: '14 dias' },
  { key: '30d', label: '30 dias' },
  { key: 'this_month', label: 'Este mes' },
]

const fmt = {
  money: (v: number) => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  num: (v: number) => v.toLocaleString('pt-BR'),
  pct: (v: number) => v.toFixed(1) + '%',
}

interface Totals {
  sales: number; revenue: number; refunds: number; refund_amount: number
  refund_rate: number; net_revenue: number; ticket_medio: number
  order_bump_count: number; order_bump_rate: number; order_bump_revenue: number
  ad_spend: number; roas_real: number; cpa: number; profit: number
}

interface DailyRow { date: string; count: number; revenue: number; refunds: number; net: number }

export default function InfoprodutosPage() {
  const [period, setPeriod] = useState('7d')
  const [totals, setTotals] = useState<Totals | null>(null)
  const [daily, setDaily] = useState<DailyRow[]>([])
  const [paymentMethods, setPaymentMethods] = useState<Record<string, number>>({})
  const [topSources, setTopSources] = useState<{ source: string; count: number; revenue: number }[]>([])
  const [peakHours, setPeakHours] = useState<{ hour: number; count: number }[]>([])
  const [topStates, setTopStates] = useState<{ state: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/infoprodutos?period=${period}`)
      const data = await res.json()
      if (data.totals) setTotals(data.totals)
      if (data.daily) setDaily(data.daily)
      if (data.payment_methods) setPaymentMethods(data.payment_methods)
      if (data.top_sources) setTopSources(data.top_sources)
      if (data.peak_hours) setPeakHours(data.peak_hours)
      if (data.top_states) setTopStates(data.top_states)
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [period])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { const iv = setInterval(fetchData, 5 * 60 * 1000); return () => clearInterval(iv) }, [fetchData])

  const chartData = daily.map(d => ({
    date: d.date.split('-').slice(1).reverse().join('/'),
    vendas: d.count,
    receita: d.revenue,
    reembolsos: d.refunds,
    net: d.net,
  }))

  const pieData = Object.entries(paymentMethods).map(([name, value]) => ({
    name: name === 'credit_card' ? 'Cartao' : name === 'pix' ? 'PIX' : name === 'bank_slip' ? 'Boleto' : name,
    value,
    color: name === 'pix' ? '#22c55e' : name === 'credit_card' ? '#4f8cff' : name === 'bank_slip' ? '#eab308' : '#8b5cf6',
  }))

  const profitColor = totals && totals.profit >= 0 ? 'text-emerald-400' : 'text-red-400'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-lime-400" />
            Infoprodutos
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Shopee ADS 2.0 · R$97 · Vendas Ticto</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          {lastUpdate && <span>Atualizado: {lastUpdate}</span>}
          <button onClick={fetchData} className="p-1.5 rounded-lg hover:bg-zinc-800 transition">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 flex-wrap">
        {PERIODS.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-4 py-2 text-sm rounded-lg border transition ${
              period === p.key
                ? 'border-lime-400/30 bg-lime-400/10 text-lime-400'
                : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
            }`}>{p.label}</button>
        ))}
      </div>

      {totals && (
        <>
          {/* Hero: Lucro Liquido */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-lime-400/[0.02] to-transparent pointer-events-none" />
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Lucro Liquido</p>
            <p className={`text-5xl font-black ${profitColor}`}>
              {totals.profit >= 0 ? '+' : ''}{fmt.money(totals.profit)}
            </p>
            <p className="text-sm text-zinc-500 mt-3">
              Receita {fmt.money(totals.net_revenue)} - Ads {fmt.money(totals.ad_spend)}
            </p>
            <div className="flex justify-center gap-8 mt-4">
              <div className="text-center">
                <p className="text-xs text-zinc-600">ROAS Real</p>
                <p className={`text-lg font-bold ${totals.roas_real >= 1.8 ? 'text-emerald-400' : totals.roas_real >= 1.4 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {totals.roas_real > 0 ? totals.roas_real.toFixed(2) + 'x' : '—'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-600">CPA Real</p>
                <p className={`text-lg font-bold ${totals.cpa <= 60 ? 'text-emerald-400' : totals.cpa <= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {totals.cpa > 0 ? fmt.money(totals.cpa) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* KPIs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <KpiCard icon={ShoppingBag} label="Vendas" value={fmt.num(totals.sales)} color="text-lime-400" />
            <KpiCard icon={DollarSign} label="Receita Bruta" value={fmt.money(totals.revenue)} color="text-emerald-400" />
            <KpiCard icon={Target} label="Ticket Medio" value={fmt.money(totals.ticket_medio)} color="text-blue-400" />
            <KpiCard icon={Package} label="Order Bump" value={`${totals.order_bump_count} (${fmt.pct(totals.order_bump_rate)})`} sub={`+ ${fmt.money(totals.order_bump_revenue)}`} color="text-purple-400" />
            <KpiCard icon={ArrowDownRight} label="Reembolsos" value={`${totals.refunds} (${fmt.pct(totals.refund_rate)})`} sub={fmt.money(totals.refund_amount)} color="text-red-400" />
            <KpiCard icon={TrendingUp} label="Gasto Ads" value={fmt.money(totals.ad_spend)} color="text-orange-400" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Vendas por dia */}
            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-zinc-400 mb-4">Vendas por Dia</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#666', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '12px', fontSize: 12 }}
                      formatter={(value, name) => [
                        name === 'receita' ? fmt.money(Number(value)) : String(value),
                        name === 'vendas' ? 'Vendas' : name === 'receita' ? 'Receita' : 'Reembolsos'
                      ]}
                    />
                    <Bar dataKey="vendas" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.reembolsos > 0 ? '#eab308' : '#a3e635'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Meios de pagamento */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-zinc-400 mb-4">Pagamento</h3>
              {pieData.length > 0 ? (
                <>
                  <div className="h-[160px] flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" stroke="none">
                          {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '12px', fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-2">
                    {pieData.map(p => (
                      <div key={p.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                          <span className="text-zinc-400">{p.name}</span>
                        </div>
                        <span className="font-bold text-zinc-300">{p.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[160px] flex items-center justify-center text-zinc-600 text-sm">Sem dados</div>
              )}
            </div>
          </div>

          {/* Bottom cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Horários de pico */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-zinc-400 mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Horarios de Pico</h3>
              {peakHours.length > 0 ? (
                <div className="space-y-2">
                  {peakHours.map((h, i) => (
                    <div key={h.hour} className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">{String(h.hour).padStart(2, '0')}:00 - {String(h.hour + 1).padStart(2, '0')}:00</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-lime-400" style={{ width: `${(h.count / peakHours[0].count) * 100}%` }} />
                        </div>
                        <span className="text-xs font-bold text-zinc-300 w-6 text-right">{h.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-zinc-600">Sem dados</p>}
            </div>

            {/* Top Estados */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-zinc-400 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> Top Estados</h3>
              {topStates.length > 0 ? (
                <div className="space-y-2">
                  {topStates.slice(0, 5).map(s => (
                    <div key={s.state} className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">{s.state}</span>
                      <span className="text-xs font-bold text-zinc-300">{s.count} vendas</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-zinc-600">Sem dados</p>}
            </div>

            {/* Fontes de tráfego */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-zinc-400 mb-3 flex items-center gap-2"><Zap className="w-4 h-4" /> Fontes de Trafego</h3>
              {topSources.length > 0 ? (
                <div className="space-y-2">
                  {topSources.slice(0, 5).map(s => (
                    <div key={s.source} className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">{s.source}</span>
                      <div className="text-right">
                        <span className="text-xs font-bold text-zinc-300">{s.count} vendas</span>
                        <span className="text-[10px] text-zinc-600 ml-2">{fmt.money(s.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-zinc-600">Sem dados</p>}
            </div>
          </div>
        </>
      )}

      {!totals && !loading && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-zinc-400 mb-2">Nenhuma venda registrada</h3>
          <p className="text-sm text-zinc-600">Configure o webhook da Ticto para começar a receber vendas automaticamente.</p>
        </div>
      )}

      {loading && !totals && (
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="w-6 h-6 text-lime-400 animate-spin" />
        </div>
      )}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color }: { icon: typeof ShoppingBag; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 group hover:border-zinc-700 transition">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{label}</span>
      </div>
      <p className="text-lg font-bold text-zinc-100">{value}</p>
      {sub && <p className="text-[11px] text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  )
}
