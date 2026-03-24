'use client'

import { useEffect, useState, useCallback } from 'react'
import { ShoppingBag, DollarSign, TrendingUp, RefreshCw, ArrowDownRight, ArrowUpRight, Package, Clock, MapPin, Zap, Target, Layers, CreditCard } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import DatePicker from '@/components/date-picker'

function todayISO() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const fmt = {
  money: (v: number) => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  num: (v: number) => v.toLocaleString('pt-BR'),
  pct: (v: number) => v.toFixed(1) + '%',
}

interface Totals {
  orders: number; items_sold: number; revenue_principal: number; revenue_bumps: number
  revenue_upsells: number; revenue_downsells: number; revenue: number; refunds: number
  refund_amount: number; refund_rate: number; net_revenue: number; avg_order_value: number
  bump_orders: number; bump_rate: number; bump_revenue: number
  upsell_count: number; upsell_revenue: number; downsell_count: number; downsell_revenue: number
  ad_spend: number; roas_real: number; cpa: number; profit: number
}

interface Product {
  name: string; count: number; revenue: number; bumps: number; bump_revenue: number
  upsells: number; upsell_revenue: number; downsells: number; downsell_revenue: number
  total_revenue: number; bump_rate: number
}

interface DailyRow { date: string; count: number; revenue: number; bumps: number; bump_rev: number; total: number; refunds: number; net: number }

export default function InfoprodutosPage() {
  const today = todayISO()
  const [dates, setDates] = useState({ startDate: today, endDate: today })
  const [totals, setTotals] = useState<Totals | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [topBumps, setTopBumps] = useState<{ name: string; count: number; revenue: number }[]>([])
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
      const res = await fetch(`/api/infoprodutos?startDate=${dates.startDate}&endDate=${dates.endDate}`)
      const data = await res.json()
      if (data.totals) setTotals(data.totals)
      if (data.products) setProducts(data.products)
      if (data.top_bumps) setTopBumps(data.top_bumps)
      if (data.daily) setDaily(data.daily)
      if (data.payment_methods) setPaymentMethods(data.payment_methods)
      if (data.top_sources) setTopSources(data.top_sources)
      if (data.peak_hours) setPeakHours(data.peak_hours)
      if (data.top_states) setTopStates(data.top_states)
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [dates])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { const iv = setInterval(fetchData, 5 * 60 * 1000); return () => clearInterval(iv) }, [fetchData])

  const chartData = daily.map(d => ({
    date: d.date.split('-').slice(1).reverse().join('/'),
    vendas: d.count,
    receita: d.revenue,
    bumps: d.bump_rev,
    total: d.total,
  }))

  const pieData = Object.entries(paymentMethods).map(([name, value]) => ({
    name: name === 'credit_card' ? 'Cartão' : name === 'pix' ? 'PIX' : name === 'bank_slip' ? 'Boleto' : name,
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
          <p className="text-sm text-zinc-500 mt-1">Vendas Ticto · Todos os produtos</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-zinc-600">{lastUpdate && `${lastUpdate}`}</div>
          <button onClick={fetchData} className="p-1.5 rounded-lg hover:bg-zinc-800 transition text-zinc-600">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <DatePicker startDate={dates.startDate} endDate={dates.endDate} onChange={(s, e) => setDates({ startDate: s, endDate: e })} />
        </div>
      </div>

      {totals && (
        <>
          {/* Hero: Lucro */}
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
                <p className={`text-lg font-bold ${totals.roas_real >= 1.8 ? 'text-emerald-400' : totals.roas_real >= 1.4 ? 'text-yellow-400' : totals.roas_real > 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                  {totals.roas_real > 0 ? totals.roas_real.toFixed(2) + 'x' : '—'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-600">CPA</p>
                <p className={`text-lg font-bold ${totals.cpa <= 60 ? 'text-emerald-400' : totals.cpa <= 80 ? 'text-yellow-400' : totals.cpa > 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                  {totals.cpa > 0 ? fmt.money(totals.cpa) : '—'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-600">AOV</p>
                <p className="text-lg font-bold text-blue-400">{fmt.money(totals.avg_order_value)}</p>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <KpiCard icon={ShoppingBag} label="Pedidos" value={fmt.num(totals.orders)} color="text-lime-400" />
            <KpiCard icon={DollarSign} label="Receita Total" value={fmt.money(totals.revenue)} color="text-emerald-400" />
            <KpiCard icon={Package} label="Bumps" value={`${fmt.num(totals.bump_orders)} (${fmt.pct(totals.bump_rate)})`} sub={`+ ${fmt.money(totals.bump_revenue)}`} color="text-purple-400" />
            <KpiCard icon={ArrowUpRight} label="Upsells" value={fmt.num(totals.upsell_count)} sub={fmt.money(totals.upsell_revenue)} color="text-blue-400" />
            <KpiCard icon={ArrowDownRight} label="Downsells" value={fmt.num(totals.downsell_count)} sub={fmt.money(totals.downsell_revenue)} color="text-orange-400" />
            <KpiCard icon={Target} label="Reembolsos" value={`${totals.refunds} (${fmt.pct(totals.refund_rate)})`} sub={fmt.money(totals.refund_amount)} color="text-red-400" />
            <KpiCard icon={Layers} label="Items Vendidos" value={fmt.num(totals.items_sold)} color="text-zinc-400" />
            <KpiCard icon={TrendingUp} label="Gasto Ads" value={fmt.money(totals.ad_spend)} color="text-orange-400" />
          </div>

          {/* Produtos */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
            <div className="px-6 py-4 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-300">Produtos</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-6 py-3">Produto</th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-4 py-3">Vendas</th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-4 py-3">Receita</th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-4 py-3">Bumps</th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-4 py-3">Taxa Bump</th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-4 py-3">Upsells</th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-4 py-3">Downsells</th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.name} className="border-t border-zinc-800/50 hover:bg-zinc-800/30 transition">
                    <td className="px-6 py-3 text-sm font-semibold text-zinc-200">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-right text-zinc-300">{fmt.num(p.count)}</td>
                    <td className="px-4 py-3 text-sm text-right text-zinc-300">{fmt.money(p.revenue)}</td>
                    <td className="px-4 py-3 text-sm text-right text-purple-400">{p.bumps > 0 ? `${p.bumps} (${fmt.money(p.bump_revenue)})` : '—'}</td>
                    <td className="px-4 py-3 text-sm text-right"><span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${p.bump_rate >= 40 ? 'bg-emerald-400/10 text-emerald-400' : p.bump_rate >= 20 ? 'bg-yellow-400/10 text-yellow-400' : p.bump_rate > 0 ? 'bg-zinc-700/50 text-zinc-400' : 'text-zinc-700'}`}>{p.bump_rate > 0 ? fmt.pct(p.bump_rate) : '—'}</span></td>
                    <td className="px-4 py-3 text-sm text-right text-blue-400">{p.upsells > 0 ? `${p.upsells} (${fmt.money(p.upsell_revenue)})` : '—'}</td>
                    <td className="px-4 py-3 text-sm text-right text-orange-400">{p.downsells > 0 ? `${p.downsells} (${fmt.money(p.downsell_revenue)})` : '—'}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-lime-400">{fmt.money(p.total_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '12px', fontSize: 12 }}
                      formatter={(value, name) => [name === 'bumps' ? fmt.money(Number(value)) : name === 'receita' ? fmt.money(Number(value)) : String(value), name === 'vendas' ? 'Vendas' : name === 'receita' ? 'Produto' : 'Bumps']} />
                    <Bar dataKey="vendas" fill="#a3e635" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pagamento */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-zinc-400 mb-4">Pagamento</h3>
              {pieData.length > 0 ? (
                <>
                  <div className="h-[140px] flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" stroke="none">
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie></PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-2">
                    {pieData.map(p => (
                      <div key={p.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} /><span className="text-zinc-400">{p.name}</span></div>
                        <span className="font-bold text-zinc-300">{p.value} ({(p.value / Object.values(paymentMethods).reduce((a, b) => a + b, 0) * 100).toFixed(0)}%)</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="h-[140px] flex items-center justify-center text-zinc-600 text-sm">Sem dados</div>}
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Top Bumps */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-zinc-400 mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-purple-400" /> Top Bumps</h3>
              {topBumps.length > 0 ? (
                <div className="space-y-3">
                  {topBumps.map(b => (
                    <div key={b.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400 truncate max-w-[140px]" title={b.name}>{b.name}</span>
                        <span className="font-bold text-purple-400">{b.count}</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-purple-500/60" style={{ width: `${(b.count / topBumps[0].count) * 100}%` }} />
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{fmt.money(b.revenue)}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-zinc-600">Sem dados</p>}
            </div>

            {/* Horários */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-zinc-400 mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Horarios de Pico</h3>
              {peakHours.length > 0 ? (
                <div className="space-y-2">
                  {peakHours.map(h => (
                    <div key={h.hour} className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">{String(h.hour).padStart(2, '0')}:00</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full rounded-full bg-lime-400" style={{ width: `${(h.count / peakHours[0].count) * 100}%` }} /></div>
                        <span className="text-xs font-bold text-zinc-300 w-8 text-right">{h.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-zinc-600">Sem dados</p>}
            </div>

            {/* Estados */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-zinc-400 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> Top Estados</h3>
              {topStates.length > 0 ? (
                <div className="space-y-2">
                  {topStates.slice(0, 5).map(s => (
                    <div key={s.state} className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">{s.state || 'N/A'}</span>
                      <span className="text-xs font-bold text-zinc-300">{s.count}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-zinc-600">Sem dados</p>}
            </div>

            {/* Fontes */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-zinc-400 mb-3 flex items-center gap-2"><Zap className="w-4 h-4" /> Fontes</h3>
              {topSources.length > 0 ? (
                <div className="space-y-2">
                  {topSources.slice(0, 5).map(s => (
                    <div key={s.source} className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">{s.source}</span>
                      <div className="text-right">
                        <span className="text-xs font-bold text-zinc-300">{s.count}</span>
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
          <h3 className="text-lg font-bold text-zinc-400 mb-2">Nenhuma venda no periodo</h3>
          <p className="text-sm text-zinc-600">Selecione outro periodo ou aguarde novas vendas.</p>
        </div>
      )}

      {loading && !totals && (
        <div className="flex items-center justify-center h-40"><RefreshCw className="w-6 h-6 text-lime-400 animate-spin" /></div>
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
