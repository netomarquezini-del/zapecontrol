'use client'

import { useEffect, useState, useCallback } from 'react'
import { TrendingUp, DollarSign, ShoppingCart, Target, Eye, MousePointerClick, RefreshCw, BarChart3, Layers, CreditCard, FileText } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import DatePicker from '@/components/date-picker'

function defaultDates() {
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - 6)
  const pad = (n: number) => String(n).padStart(2, '0')
  const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return { startDate: toISO(start), endDate: toISO(now) }
}

const fmt = {
  money: (v: number) => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  num: (v: number) => v.toLocaleString('pt-BR'),
  pct: (v: number) => v.toFixed(2) + '%',
  roas: (v: number) => v.toFixed(2) + 'x',
}

function roasColor(roas: number | null): string {
  if (roas === null || roas === 0) return 'text-zinc-500'
  if (roas < 1.0) return 'text-red-500'
  if (roas < 1.4) return 'text-red-400'
  if (roas <= 1.8) return 'text-yellow-400'
  return 'text-emerald-400'
}

function roasBarColor(roas: number | null): string {
  if (roas === null || roas === 0) return '#333'
  if (roas < 1.4) return '#ef4444'
  if (roas <= 1.8) return '#eab308'
  return '#22c55e'
}

function roasPillClass(roas: number | null): string {
  if (roas === null || roas === 0) return 'text-zinc-500'
  if (roas < 1.4) return 'text-red-400 bg-red-400/10 border border-red-400/20'
  if (roas <= 1.8) return 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20'
  return 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20'
}

interface Totals {
  spend: number; impressions: number; clicks: number; reach: number
  purchases: number; revenue: number; add_to_cart: number
  initiate_checkout: number; landing_page_views: number; add_payment_info: number
  ctr: number; cpc: number; cpm: number; cost_per_purchase: number
  cost_per_landing_page_view: number; cost_per_add_payment_info: number
  roas: number; frequency: number; imposto: number; margem: number
}

interface DailyRow {
  date: string; spend: number; purchases: number; revenue: number; roas: number
  impressions: number; clicks: number
}

interface EntityRow {
  campaign_id?: string; campaign_name?: string; ad_id?: string; ad_name?: string
  status?: string; spend: number; impressions: number; clicks: number
  purchases: number; revenue: number; ctr: number; cost_per_purchase: number; roas: number
}

export default function MetaAdsPage() {
  const [dates, setDates] = useState(defaultDates)
  const [tab, setTab] = useState<'campaigns' | 'ads'>('campaigns')
  const [totals, setTotals] = useState<Totals | null>(null)
  const [daily, setDaily] = useState<DailyRow[]>([])
  const [campaigns, setCampaigns] = useState<EntityRow[]>([])
  const [ads, setAds] = useState<EntityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const qs = `startDate=${dates.startDate}&endDate=${dates.endDate}`
    try {
      const [accountRes, campRes, adsRes] = await Promise.all([
        fetch(`/api/meta-ads?${qs}&level=account`),
        fetch(`/api/meta-ads?${qs}&level=campaigns`),
        fetch(`/api/meta-ads?${qs}&level=ads`),
      ])
      const accountData = await accountRes.json()
      const campData = await campRes.json()
      const adsData = await adsRes.json()

      if (accountData.totals) setTotals(accountData.totals)
      if (accountData.daily) setDaily(accountData.daily)
      if (campData.data) setCampaigns(campData.data)
      if (adsData.data) setAds(adsData.data)
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'))
    } catch (e) {
      console.error('Fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [dates])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { const iv = setInterval(fetchData, 5 * 60 * 1000); return () => clearInterval(iv) }, [fetchData])

  const chartData = daily.map(d => ({
    date: d.date.split('-').slice(1).reverse().join('/'),
    spend: Number(d.spend),
    roas: Number(d.roas),
    purchases: Number(d.purchases),
    color: roasBarColor(Number(d.roas)),
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Meta Ads</h1>
          <p className="text-sm text-zinc-500 mt-1">Shopee ADS 2.0 | R$97</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-zinc-600">{lastUpdate && lastUpdate}</div>
          <button onClick={fetchData} className="p-1.5 rounded-lg hover:bg-zinc-800 transition text-zinc-600">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <DatePicker startDate={dates.startDate} endDate={dates.endDate} onChange={(s, e) => setDates({ startDate: s, endDate: e })} />
        </div>
      </div>

      {/* ROAS Hero */}
      {totals && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">ROAS Geral</p>
          <p className={`text-6xl font-black ${roasColor(totals.roas)}`}>
            {totals.roas > 0 ? fmt.roas(totals.roas) : '—'}
          </p>
          <p className="text-sm text-zinc-500 mt-2">
            Receita {fmt.money(totals.revenue)} / Gasto {fmt.money(totals.spend)}
          </p>
          <div className="max-w-md mx-auto mt-4">
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min((totals.roas / 3) * 100, 100)}%`, background: roasBarColor(totals.roas) }} />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-zinc-600">
              <span>0</span><span>1.0</span>
              <span className="text-red-400">1.4</span>
              <span className="text-yellow-400">1.8</span>
              <span className="text-emerald-400">2.0+</span>
              <span>3.0</span>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards - Funil */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <KpiCard icon={Eye} label="CPM" value={fmt.money(totals.cpm)} color="text-zinc-100" />
          <KpiCard icon={MousePointerClick} label="Vis. Pag. Destino" value={fmt.num(totals.landing_page_views)}
            sub={`Custo: ${totals.cost_per_landing_page_view > 0 ? fmt.money(totals.cost_per_landing_page_view) : '—'}`} color="text-blue-400" />
          <KpiCard icon={CreditCard} label="Info Pagamento" value={fmt.num(totals.add_payment_info)}
            sub={`Custo: ${totals.cost_per_add_payment_info > 0 ? fmt.money(totals.cost_per_add_payment_info) : '—'}`} color="text-purple-400" />
          <KpiCard icon={ShoppingCart} label="Compras" value={fmt.num(totals.purchases)}
            sub={`Custo: ${totals.cost_per_purchase > 0 ? fmt.money(totals.cost_per_purchase) : '—'}`}
            color={totals.cost_per_purchase <= 60 ? 'text-emerald-400' : totals.cost_per_purchase <= 80 ? 'text-yellow-400' : 'text-red-400'} />
          <KpiCard icon={BarChart3} label="CTR" value={fmt.pct(totals.ctr)} sub={`CPC: ${fmt.money(totals.cpc)}`} />
          <KpiCard icon={Layers} label="Frequencia" value={totals.frequency.toFixed(2)}
            color={totals.frequency > 3 ? 'text-red-400' : totals.frequency > 2 ? 'text-yellow-400' : 'text-zinc-100'}
            sub={totals.frequency > 3 ? 'Saturacao!' : totals.frequency > 2 ? 'Atencao' : 'Saudavel'} />
          <KpiCard icon={Target} label="Funil" value={`${fmt.num(totals.landing_page_views)} → ${fmt.num(totals.add_payment_info)} → ${fmt.num(totals.purchases)}`}
            sub={totals.landing_page_views > 0 ? `CVR: ${(totals.purchases / totals.landing_page_views * 100).toFixed(1)}%` : undefined} />
        </div>
      )}

      {/* Financeiro */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">Receita</p>
            <p className="text-2xl font-black text-emerald-400">{totals.revenue > 0 ? fmt.money(totals.revenue) : '—'}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">Gasto</p>
            <p className="text-2xl font-black text-blue-400">{fmt.money(totals.spend)}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">Imposto (12%)</p>
            <p className="text-2xl font-black text-orange-400">{fmt.money(totals.imposto)}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 relative overflow-hidden">
            <div className={`absolute inset-0 ${totals.margem >= 0 ? 'bg-emerald-400/[0.03]' : 'bg-red-400/[0.03]'} pointer-events-none`} />
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">Margem</p>
            <p className={`text-2xl font-black ${totals.margem >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totals.margem >= 0 ? '+' : ''}{fmt.money(totals.margem)}
            </p>
            <p className="text-[10px] text-zinc-600 mt-1">Receita - Gasto - Imposto</p>
          </div>
        </div>
      )}

      {/* Daily Chart */}
      {chartData.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-sm font-semibold text-zinc-400 mb-4">Gasto Diario (cor = ROAS)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11 }} />
              <YAxis tick={{ fill: '#666', fontSize: 11 }} tickFormatter={(v: number) => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '12px', fontSize: '12px' }}
                labelStyle={{ color: '#999' }}
                formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
              />
              <Bar dataKey="spend" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('campaigns')}
          className={`px-4 py-2 text-sm rounded-lg transition ${tab === 'campaigns' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>
          Campanhas
        </button>
        <button onClick={() => setTab('ads')}
          className={`px-4 py-2 text-sm rounded-lg transition ${tab === 'ads' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>
          Anuncios
        </button>
      </div>

      {/* Campaigns Table */}
      {tab === 'campaigns' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Campanha</th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Gasto</th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Vendas</th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">CPA</th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">ROAS</th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">CTR</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, i) => (
                <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition">
                  <td className="px-4 py-3 text-sm text-zinc-300 max-w-[300px] truncate">{c.campaign_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-zinc-300 text-right tabular-nums">{fmt.money(c.spend)}</td>
                  <td className="px-4 py-3 text-sm text-zinc-300 text-right tabular-nums">{c.purchases > 0 ? fmt.num(c.purchases) : '—'}</td>
                  <td className={`px-4 py-3 text-sm text-right tabular-nums ${c.cost_per_purchase > 80 ? 'text-red-400' : c.cost_per_purchase > 60 ? 'text-yellow-400' : c.cost_per_purchase > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {c.cost_per_purchase > 0 ? fmt.money(c.cost_per_purchase) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold tabular-nums ${roasPillClass(c.roas)}`}>
                      {c.roas > 0 ? fmt.roas(c.roas) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400 text-right tabular-nums">{c.ctr > 0 ? fmt.pct(c.ctr) : '—'}</td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-600 text-sm">Sem dados para o periodo</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Ads Table */}
      {tab === 'ads' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Anuncio</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Campanha</th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Gasto</th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Vendas</th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">CPA</th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((a, i) => (
                <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition">
                  <td className="px-4 py-3 text-sm text-zinc-300 max-w-[200px] truncate">{a.ad_name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500 max-w-[200px] truncate">{a.campaign_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-zinc-300 text-right tabular-nums">{fmt.money(a.spend)}</td>
                  <td className="px-4 py-3 text-sm text-zinc-300 text-right tabular-nums">{a.purchases > 0 ? fmt.num(a.purchases) : '—'}</td>
                  <td className={`px-4 py-3 text-sm text-right tabular-nums ${a.cost_per_purchase > 80 ? 'text-red-400' : a.cost_per_purchase > 60 ? 'text-yellow-400' : a.cost_per_purchase > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {a.cost_per_purchase > 0 ? fmt.money(a.cost_per_purchase) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold tabular-nums ${roasPillClass(a.roas)}`}>
                      {a.roas > 0 ? fmt.roas(a.roas) : '—'}
                    </span>
                  </td>
                </tr>
              ))}
              {ads.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-600 text-sm">Sem dados para o periodo</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {loading && !totals && (
        <div className="flex items-center justify-center py-20 text-zinc-500">
          <RefreshCw className="w-5 h-5 animate-spin mr-3" />
          Carregando dados...
        </div>
      )}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color, sub }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string; color?: string; sub?: string
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{label}</span>
      </div>
      <p className={`text-lg font-bold ${color || 'text-zinc-100'}`}>{value}</p>
      {sub && <p className="text-[11px] text-zinc-600 mt-1">{sub}</p>}
    </div>
  )
}
