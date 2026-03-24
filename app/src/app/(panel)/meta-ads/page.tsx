'use client'

import { useEffect, useState, useCallback } from 'react'
import { TrendingUp, DollarSign, ShoppingCart, Target, Eye, MousePointerClick, RefreshCw, BarChart3, Layers, CreditCard, ChevronRight, X } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import DatePicker from '@/components/date-picker'

function todayISO() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const fmt = {
  money: (v: number) => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  num: (v: number) => v.toLocaleString('pt-BR'),
  pct: (v: number) => v.toFixed(2) + '%',
  roas: (v: number) => v.toFixed(2) + 'x',
}

function roasColor(roas: number | null): string {
  if (roas === null || roas === 0) return 'text-zinc-500'
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

interface DailyRow { date: string; spend: number; purchases: number; revenue: number; roas: number }

interface EntityRow {
  campaign_id?: string; campaign_name?: string
  adset_id?: string; adset_name?: string
  ad_id?: string; ad_name?: string
  spend: number; impressions: number; clicks: number; purchases: number; revenue: number
  cpm: number; ctr: number; cost_per_purchase: number; cost_per_landing_page_view: number
  cost_per_add_payment_info: number; roas: number; landing_page_views: number; add_payment_info: number
}

type Tab = 'campaigns' | 'adsets' | 'ads'

export default function MetaAdsPage() {
  const today = todayISO()
  const [dates, setDates] = useState({ startDate: today, endDate: today })
  const [tab, setTab] = useState<Tab>('campaigns')
  const [totals, setTotals] = useState<Totals | null>(null)
  const [daily, setDaily] = useState<DailyRow[]>([])
  const [rows, setRows] = useState<EntityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')

  // Drill-down filters
  const [filterCampaign, setFilterCampaign] = useState<{ id: string; name: string } | null>(null)
  const [filterAdset, setFilterAdset] = useState<{ id: string; name: string } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const qs = `startDate=${dates.startDate}&endDate=${dates.endDate}`
    try {
      // Account totals
      const accountRes = await fetch(`/api/meta-ads?${qs}&level=account`)
      const accountData = await accountRes.json()
      if (accountData.totals) setTotals(accountData.totals)
      if (accountData.daily) setDaily(accountData.daily)

      // Tab data with filters
      let tabQs = `${qs}&level=${tab}`
      if (filterCampaign && (tab === 'adsets' || tab === 'ads')) tabQs += `&campaign_id=${filterCampaign.id}`
      if (filterAdset && tab === 'ads') tabQs += `&adset_id=${filterAdset.id}`
      const tabRes = await fetch(`/api/meta-ads?${tabQs}`)
      const tabData = await tabRes.json()
      if (tabData.data) setRows(tabData.data)

      setLastUpdate(new Date().toLocaleTimeString('pt-BR'))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [dates, tab, filterCampaign, filterAdset])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { const iv = setInterval(fetchData, 5 * 60 * 1000); return () => clearInterval(iv) }, [fetchData])

  const handleTabChange = (t: Tab) => {
    setTab(t)
    if (t === 'campaigns') { setFilterCampaign(null); setFilterAdset(null) }
    if (t === 'adsets') { setFilterAdset(null) }
  }

  const handleDrillDown = (row: EntityRow) => {
    if (tab === 'campaigns' && row.campaign_id) {
      setFilterCampaign({ id: row.campaign_id, name: row.campaign_name || '' })
      setTab('adsets')
    } else if (tab === 'adsets' && row.adset_id) {
      setFilterAdset({ id: row.adset_id, name: row.adset_name || '' })
      setTab('ads')
    }
  }

  const chartData = daily.map(d => ({
    date: d.date.split('-').slice(1).reverse().join('/'),
    spend: Number(d.spend),
    color: roasBarColor(Number(d.roas)),
  }))

  const nameField = tab === 'campaigns' ? 'campaign_name' : tab === 'adsets' ? 'adset_name' : 'ad_name'
  const canDrill = tab !== 'ads'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Meta Ads</h1>
          <p className="text-sm text-zinc-500 mt-1">Shopee ADS 2.0 | R$97</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-zinc-600">{lastUpdate}</div>
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
          <p className={`text-6xl font-black ${roasColor(totals.roas)}`}>{totals.roas > 0 ? fmt.roas(totals.roas) : '—'}</p>
          <p className="text-sm text-zinc-500 mt-2">Receita {fmt.money(totals.revenue)} / Gasto {fmt.money(totals.spend)}</p>
          <div className="max-w-md mx-auto mt-4">
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((totals.roas / 3) * 100, 100)}%`, background: roasBarColor(totals.roas) }} />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-zinc-600">
              <span>0</span><span>1.0</span><span className="text-red-400">1.4</span><span className="text-yellow-400">1.8</span><span className="text-emerald-400">2.0+</span><span>3.0</span>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <KpiCard icon={Eye} label="CPM" value={fmt.money(totals.cpm)} />
          <KpiCard icon={MousePointerClick} label="Vis. Pag. Destino" value={fmt.num(totals.landing_page_views)} sub={`Custo: ${totals.cost_per_landing_page_view > 0 ? fmt.money(totals.cost_per_landing_page_view) : '—'}`} color="text-blue-400" />
          <KpiCard icon={CreditCard} label="Info Pagamento" value={fmt.num(totals.add_payment_info)} sub={`Custo: ${totals.cost_per_add_payment_info > 0 ? fmt.money(totals.cost_per_add_payment_info) : '—'}`} color="text-purple-400" />
          <KpiCard icon={ShoppingCart} label="Compras" value={fmt.num(totals.purchases)} sub={`CPA: ${totals.cost_per_purchase > 0 ? fmt.money(totals.cost_per_purchase) : '—'}`} color={totals.cost_per_purchase <= 60 ? 'text-emerald-400' : totals.cost_per_purchase <= 80 ? 'text-yellow-400' : 'text-red-400'} />
          <KpiCard icon={BarChart3} label="CTR (Link Click)" value={totals.impressions > 0 ? fmt.pct(totals.clicks / totals.impressions * 100) : '—'} sub={`CPC: ${fmt.money(totals.cpc)}`} />
          <KpiCard icon={Layers} label="Frequencia" value={totals.frequency.toFixed(2)} color={totals.frequency > 3 ? 'text-red-400' : totals.frequency > 2 ? 'text-yellow-400' : 'text-zinc-100'} sub={totals.frequency > 3 ? 'Saturacao!' : totals.frequency > 2 ? 'Atencao' : 'Saudavel'} />
          <KpiCard icon={Target} label="Taxa Conv. LP" value={totals.landing_page_views > 0 ? fmt.pct(totals.purchases / totals.landing_page_views * 100) : '—'} sub={`${fmt.num(totals.purchases)} / ${fmt.num(totals.landing_page_views)}`} color={totals.landing_page_views > 0 && (totals.purchases / totals.landing_page_views * 100) >= 1 ? 'text-emerald-400' : 'text-yellow-400'} />
        </div>
      )}

      {/* Financeiro */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FinCard label="Receita" value={fmt.money(totals.revenue)} color="text-emerald-400" />
          <FinCard label="Gasto" value={fmt.money(totals.spend)} color="text-blue-400" />
          <FinCard label="Imposto (12%)" value={fmt.money(totals.imposto)} color="text-orange-400" />
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 relative overflow-hidden">
            <div className={`absolute inset-0 ${totals.margem >= 0 ? 'bg-emerald-400/[0.03]' : 'bg-red-400/[0.03]'} pointer-events-none`} />
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">Margem</p>
            <p className={`text-2xl font-black ${totals.margem >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{totals.margem >= 0 ? '+' : ''}{fmt.money(totals.margem)}</p>
            <p className="text-[10px] text-zinc-600 mt-1">Receita - Gasto - Imposto</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-sm font-semibold text-zinc-400 mb-4">Gasto Diario (cor = ROAS)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11 }} />
              <YAxis tick={{ fill: '#666', fontSize: 11 }} tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '12px', fontSize: '12px' }} formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
              <Bar dataKey="spend" radius={[4, 4, 0, 0]}>{chartData.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['campaigns', 'adsets', 'ads'] as Tab[]).map(t => (
          <button key={t} onClick={() => handleTabChange(t)}
            className={`px-4 py-2 text-sm rounded-lg transition ${tab === t ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>
            {t === 'campaigns' ? 'Campanhas' : t === 'adsets' ? 'Conjuntos' : 'Anuncios'}
          </button>
        ))}

        {/* Breadcrumb filters */}
        {filterCampaign && (
          <div className="flex items-center gap-1 ml-2">
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded-lg flex items-center gap-1.5 max-w-[200px] truncate">
              {filterCampaign.name}
              <button onClick={() => { setFilterCampaign(null); setFilterAdset(null); setTab('campaigns') }} className="text-zinc-500 hover:text-red-400"><X className="w-3 h-3" /></button>
            </span>
          </div>
        )}
        {filterAdset && (
          <div className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded-lg flex items-center gap-1.5 max-w-[200px] truncate">
              {filterAdset.name}
              <button onClick={() => { setFilterAdset(null); setTab('adsets') }} className="text-zinc-500 hover:text-red-400"><X className="w-3 h-3" /></button>
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <TH align="left">{tab === 'campaigns' ? 'Campanha' : tab === 'adsets' ? 'Conjunto' : 'Anuncio'}</TH>
              <TH>Gasto</TH>
              <TH>CPM</TH>
              <TH>C/ Vis. LP</TH>
              <TH>C/ Info Pag.</TH>
              <TH>CPA</TH>
              <TH>Compras</TH>
              <TH>Vendido</TH>
              <TH>ROAS</TH>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const name = (r[nameField as keyof EntityRow] as string) || '—'
              return (
                <tr key={i} className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition ${canDrill ? 'cursor-pointer' : ''}`} onClick={() => canDrill && handleDrillDown(r)}>
                  <td className="px-4 py-3 text-sm text-zinc-300 max-w-[280px] truncate flex items-center gap-2">
                    {name}
                    {canDrill && <ChevronRight className="w-3 h-3 text-zinc-700 flex-shrink-0" />}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-300 text-right tabular-nums">{fmt.money(r.spend)}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400 text-right tabular-nums">{r.cpm > 0 ? fmt.money(r.cpm) : '—'}</td>
                  <td className="px-4 py-3 text-sm text-blue-400 text-right tabular-nums">{r.cost_per_landing_page_view > 0 ? fmt.money(r.cost_per_landing_page_view) : '—'}</td>
                  <td className="px-4 py-3 text-sm text-purple-400 text-right tabular-nums">{r.cost_per_add_payment_info > 0 ? fmt.money(r.cost_per_add_payment_info) : '—'}</td>
                  <td className={`px-4 py-3 text-sm text-right tabular-nums ${r.cost_per_purchase > 80 ? 'text-red-400' : r.cost_per_purchase > 60 ? 'text-yellow-400' : r.cost_per_purchase > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {r.cost_per_purchase > 0 ? fmt.money(r.cost_per_purchase) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-300 text-right tabular-nums">{r.purchases > 0 ? fmt.num(r.purchases) : '—'}</td>
                  <td className="px-4 py-3 text-sm text-emerald-400 text-right tabular-nums">{r.revenue > 0 ? fmt.money(r.revenue) : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold tabular-nums ${roasPillClass(r.roas)}`}>{r.roas > 0 ? fmt.roas(r.roas) : '—'}</span>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-zinc-600 text-sm">{loading ? 'Carregando...' : 'Sem dados para o periodo'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {loading && !totals && (
        <div className="flex items-center justify-center py-20 text-zinc-500">
          <RefreshCw className="w-5 h-5 animate-spin mr-3" />Carregando dados...
        </div>
      )}
    </div>
  )
}

function TH({ children, align }: { children: React.ReactNode; align?: string }) {
  return <th className={`${align === 'left' ? 'text-left' : 'text-right'} px-4 py-3 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold whitespace-nowrap`}>{children}</th>
}

function KpiCard({ icon: Icon, label, value, color, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color?: string; sub?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2"><Icon className="w-3.5 h-3.5 text-zinc-600" /><span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{label}</span></div>
      <p className={`text-lg font-bold ${color || 'text-zinc-100'}`}>{value}</p>
      {sub && <p className="text-[11px] text-zinc-600 mt-1">{sub}</p>}
    </div>
  )
}

function FinCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  )
}
