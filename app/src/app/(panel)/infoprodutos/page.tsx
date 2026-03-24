'use client'

import { useEffect, useState, useCallback } from 'react'
import { ShoppingBag, RefreshCw, Package, ArrowUpRight, ArrowDownRight, Clock, MapPin, Zap } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import DatePicker from '@/components/date-picker'
import ProductSelector from '@/components/product-selector'

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

function roasColor(r: number) {
  if (r === 0) return 'text-zinc-500'
  if (r < 1.4) return 'text-red-400'
  if (r <= 1.8) return 'text-yellow-400'
  return 'text-emerald-400'
}

interface Totals {
  orders: number; items_sold: number; revenue_principal: number; revenue_bumps: number
  revenue_upsells: number; revenue_downsells: number; revenue: number; refunds: number
  refund_amount: number; refund_rate: number; net_revenue: number; avg_order_value: number
  bump_orders: number; bump_rate: number; bump_revenue: number
  upsell_count: number; upsell_revenue: number; downsell_count: number; downsell_revenue: number
  ad_spend: number; roas_real: number; cpa: number; profit: number
}

interface ProductRow {
  name: string; count: number; revenue: number; bumps: number; bump_revenue: number
  upsells: number; upsell_revenue: number; downsells: number; downsell_revenue: number
  total_revenue: number; bump_rate: number
}

interface DailyRow { date: string; count: number; revenue: number; bumps: number; bump_rev: number; total: number; refunds: number; net: number }

export default function InfoprodutosPage() {
  const today = todayISO()
  const [dates, setDates] = useState({ startDate: today, endDate: today })
  const [totals, setTotals] = useState<Totals | null>(null)
  const [products, setProducts] = useState<ProductRow[]>([])
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
  }))

  const pieData = Object.entries(paymentMethods).map(([name, value]) => ({
    name: name === 'credit_card' ? 'Cartão' : name === 'pix' ? 'PIX' : name === 'bank_slip' ? 'Boleto' : name,
    value,
    color: name === 'pix' ? '#a3e635' : name === 'credit_card' ? '#4f8cff' : name === 'bank_slip' ? '#eab308' : '#8b5cf6',
  }))

  const imposto = totals ? totals.ad_spend * 0.12 : 0
  const margem = totals ? totals.net_revenue - totals.ad_spend - imposto : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-lime-400" />
            Vendas Ticto
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-zinc-600">{lastUpdate}</div>
          <button onClick={fetchData} className="p-1.5 rounded-lg hover:bg-zinc-800 transition text-zinc-600">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <ProductSelector value="shopee-ads" onChange={() => {}} />
          <DatePicker startDate={dates.startDate} endDate={dates.endDate} onChange={(s, e) => setDates({ startDate: s, endDate: e })} />
        </div>
      </div>

      {totals && (
        <>
          {/* 1. Hero: Receita Total + Ticket Medio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-lime-400/[0.02] to-transparent pointer-events-none" />
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-3">Receita Total</p>
              <p className="text-5xl font-black text-lime-400 tabular-nums">{fmt.money(totals.revenue)}</p>
              <p className="text-[11px] text-zinc-600 mt-3">Produto: {fmt.money(totals.revenue_principal)} + Bumps: {fmt.money(totals.bump_revenue)}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-3">Ticket Medio</p>
              <p className="text-5xl font-black text-lime-400 tabular-nums">{fmt.money(totals.avg_order_value)}</p>
              <p className="text-[11px] text-zinc-600 mt-3">Receita total / {fmt.num(totals.orders)} pedidos</p>
            </div>
          </div>

          {/* 2. Gasto Ads | Imposto | Margem Liquida */}
          <div className="grid grid-cols-3 gap-3">
            <Card label="Gasto Ads" value={fmt.money(totals.ad_spend)} color="text-white" />
            <Card label="Imposto (12%)" value={fmt.money(imposto)} color="text-zinc-400" />
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 relative overflow-hidden">
              <div className={`absolute inset-0 ${margem >= 0 ? 'bg-lime-400/[0.03]' : 'bg-red-400/[0.03]'} pointer-events-none`} />
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-3 relative z-10">Margem Liquida</p>
              <p className={`text-2xl font-black tabular-nums relative z-10 ${margem >= 0 ? 'text-lime-400' : 'text-red-400'}`}>{margem >= 0 ? '+' : ''}{fmt.money(margem)}</p>
              <p className="text-[10px] text-zinc-600 mt-1 relative z-10">Receita - Gasto - Imposto</p>
            </div>
          </div>

          {/* 3. Pedidos | ROAS | CPA */}
          <div className="grid grid-cols-3 gap-3">
            <Card label="Pedidos" value={fmt.num(totals.orders)} color="text-lime-400" />
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-3">ROAS</p>
              <p className={`text-2xl font-black tabular-nums ${roasColor(totals.roas_real)}`}>{totals.roas_real > 0 ? totals.roas_real.toFixed(2) + 'x' : '—'}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-3">CPA</p>
              <p className={`text-2xl font-black tabular-nums ${totals.cpa <= 60 ? 'text-emerald-400' : totals.cpa <= 80 ? 'text-yellow-400' : totals.cpa > 0 ? 'text-red-400' : 'text-zinc-500'}`}>{totals.cpa > 0 ? fmt.money(totals.cpa) : '—'}</p>
            </div>
          </div>

          {/* 4. Bumps separados + Upsell + Downsell — com gráfico visual */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-zinc-300">Bumps, Upsells & Downsells</h3>
              <span className="text-xs text-zinc-600">{fmt.num(totals.orders)} pedidos no periodo</span>
            </div>

            {/* Bumps individuais com barra visual */}
            {topBumps.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-4 flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-lime-400" /> Order Bumps
                </p>
                <div className="space-y-3">
                  {topBumps.map(b => {
                    const rate = totals.orders > 0 ? (b.count / totals.orders) * 100 : 0
                    return (
                      <div key={b.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-zinc-200 truncate max-w-[200px]" title={b.name}>{b.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-zinc-400 tabular-nums">{fmt.money(b.revenue)}</span>
                            <span className="text-sm font-black text-lime-400 tabular-nums w-16 text-right">{fmt.num(b.count)}</span>
                            <span className="text-sm font-black text-lime-400 tabular-nums w-16 text-right">{rate.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(rate, 100)}%`, background: 'linear-gradient(90deg, rgba(163,230,53,0.4), rgba(132,204,22,0.6))' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Upsell + Downsell com barra visual */}
            <div className="space-y-3">
              {/* Upsell */}
              {(() => {
                const upsellRate = totals.orders > 0 ? (totals.upsell_count / totals.orders) * 100 : 0
                return (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-lime-400" />
                        <span className="text-xs font-bold text-zinc-200">Upsells</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-400 tabular-nums">{fmt.money(totals.upsell_revenue)}</span>
                        <span className="text-sm font-black text-lime-400 tabular-nums w-16 text-right">{fmt.num(totals.upsell_count)}</span>
                        <span className="text-sm font-black text-lime-400 tabular-nums w-16 text-right">{upsellRate.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(upsellRate, 100)}%`, background: 'linear-gradient(90deg, rgba(163,230,53,0.4), rgba(132,204,22,0.6))' }} />
                    </div>
                  </div>
                )
              })()}

              {/* Downsell */}
              {(() => {
                const downsellRate = totals.orders > 0 ? (totals.downsell_count / totals.orders) * 100 : 0
                return (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <ArrowDownRight className="w-4 h-4 text-zinc-400" />
                        <span className="text-xs font-bold text-zinc-200">Downsells</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-400 tabular-nums">{fmt.money(totals.downsell_revenue)}</span>
                        <span className="text-sm font-black text-zinc-300 tabular-nums w-16 text-right">{fmt.num(totals.downsell_count)}</span>
                        <span className="text-sm font-black text-zinc-300 tabular-nums w-16 text-right">{downsellRate.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700 bg-zinc-600" style={{ width: `${Math.min(downsellRate, 100)}%` }} />
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* 5. Tabela de Produtos */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
            <div className="px-6 py-4 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-300">Produtos</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-[9px] uppercase tracking-wider text-zinc-500 font-semibold px-6 py-2.5">Produto</th>
                  <th className="text-right text-[9px] uppercase tracking-wider text-zinc-500 font-semibold px-3 py-2.5">Vendas</th>
                  <th className="text-right text-[9px] uppercase tracking-wider text-zinc-500 font-semibold px-3 py-2.5">Receita</th>
                  <th className="text-right text-[9px] uppercase tracking-wider text-zinc-500 font-semibold px-3 py-2.5">Bumps</th>
                  <th className="text-right text-[9px] uppercase tracking-wider text-zinc-500 font-semibold px-3 py-2.5">Taxa Bump</th>
                  <th className="text-right text-[9px] uppercase tracking-wider text-zinc-500 font-semibold px-3 py-2.5">Upsells</th>
                  <th className="text-right text-[9px] uppercase tracking-wider text-zinc-500 font-semibold px-3 py-2.5">Downsells</th>
                  <th className="text-right text-[9px] uppercase tracking-wider text-zinc-500 font-semibold px-3 py-2.5">Total</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.name} className="border-t border-zinc-800/50 hover:bg-zinc-800/30 transition">
                    <td className="px-6 py-2.5 text-xs font-semibold text-zinc-200">{p.name}</td>
                    <td className="px-3 py-2.5 text-xs text-right text-zinc-300 tabular-nums">{fmt.num(p.count)}</td>
                    <td className="px-3 py-2.5 text-xs text-right text-zinc-300 tabular-nums">{fmt.money(p.revenue)}</td>
                    <td className="px-3 py-2.5 text-xs text-right text-lime-400 tabular-nums">{p.bumps > 0 ? `${p.bumps} (${fmt.money(p.bump_revenue)})` : '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-right"><span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${p.bump_rate >= 40 ? 'bg-emerald-400/10 text-emerald-400' : p.bump_rate >= 20 ? 'bg-yellow-400/10 text-yellow-400' : p.bump_rate > 0 ? 'bg-zinc-700/50 text-zinc-400' : 'text-zinc-700'}`}>{p.bump_rate > 0 ? fmt.pct(p.bump_rate) : '—'}</span></td>
                    <td className="px-3 py-2.5 text-xs text-right text-lime-400 tabular-nums">{p.upsells > 0 ? `${p.upsells} (${fmt.money(p.upsell_revenue)})` : '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-right text-zinc-400 tabular-nums">{p.downsells > 0 ? `${p.downsells} (${fmt.money(p.downsell_revenue)})` : '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-right font-bold text-lime-400 tabular-nums">{fmt.money(p.total_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 6. Graficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Vendas por dia */}
            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-zinc-300 mb-4">Vendas por Dia</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#666', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '12px', fontSize: 12 }}
                      formatter={(value, name) => [name === 'receita' ? fmt.money(Number(value)) : String(value), name === 'vendas' ? 'Vendas' : 'Receita']} />
                    <Bar dataKey="vendas" fill="#a3e635" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pagamento */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-zinc-300 mb-4">Pagamento</h3>
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

          {/* 7. Bottom cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Horários */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-lime-400" /> Horarios de Pico</h3>
              {peakHours.length > 0 ? (
                <div className="space-y-2">
                  {peakHours.map(h => (
                    <div key={h.hour} className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">{String(h.hour).padStart(2, '0')}:00</span>
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
              <h3 className="text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-lime-400" /> Top Estados</h3>
              {topStates.length > 0 ? (
                <div className="space-y-2">
                  {topStates.slice(0, 5).map(s => (
                    <div key={s.state} className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">{s.state || 'N/A'}</span>
                      <span className="text-xs font-bold text-zinc-300">{s.count}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-zinc-600">Sem dados</p>}
            </div>

            {/* Fontes */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-lime-400" /> Fontes</h3>
              {topSources.length > 0 ? (
                <div className="space-y-2">
                  {topSources.slice(0, 5).map(s => (
                    <div key={s.source} className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">{s.source}</span>
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

function Card({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-3">{label}</p>
      <p className={`text-2xl font-black tabular-nums ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-zinc-600 mt-1">{sub}</p>}
    </div>
  )
}
