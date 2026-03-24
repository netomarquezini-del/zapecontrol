'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { TrendingUp, DollarSign, ShoppingCart, Target, Eye, MousePointerClick, RefreshCw, BarChart3, Layers, CreditCard, ChevronRight, ChevronUp, ChevronDown, X, Check } from 'lucide-react'
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

function roasColor(r: number | null) { if (!r) return 'text-zinc-500'; if (r < 1.4) return 'text-red-400'; if (r <= 1.8) return 'text-yellow-400'; return 'text-emerald-400' }
function roasBarColor(r: number | null) { if (!r) return '#333'; if (r < 1.4) return '#ef4444'; if (r <= 1.8) return '#eab308'; return '#22c55e' }
function roasPill(r: number | null) { if (!r) return 'text-zinc-500'; if (r < 1.4) return 'text-red-400 bg-red-400/10 border border-red-400/20'; if (r <= 1.8) return 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20'; return 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' }

interface Totals {
  spend: number; impressions: number; clicks: number; reach: number; link_clicks: number
  purchases: number; revenue: number; landing_page_views: number; add_payment_info: number
  ctr: number; cpc: number; cpm: number; cost_per_purchase: number
  cost_per_landing_page_view: number; cost_per_add_payment_info: number
  roas: number; frequency: number; imposto: number; margem: number
}
interface DailyRow { date: string; spend: number; roas: number }
interface EntityRow {
  campaign_id?: string; campaign_name?: string; adset_id?: string; adset_name?: string
  ad_id?: string; ad_name?: string; spend: number; impressions: number; purchases: number
  revenue: number; cpm: number; cost_per_purchase: number; cost_per_landing_page_view: number
  cost_per_add_payment_info: number; roas: number; link_clicks: number; landing_page_views: number
  [key: string]: unknown
}

type Tab = 'campaigns' | 'adsets' | 'ads'
type SortKey = 'spend' | 'cpm' | 'cost_per_landing_page_view' | 'cost_per_add_payment_info' | 'cost_per_purchase' | 'purchases' | 'revenue' | 'roas'
type SortDir = 'asc' | 'desc'

export default function MetaAdsPage() {
  const today = todayISO()
  const [dates, setDates] = useState({ startDate: today, endDate: today })
  const [tab, setTab] = useState<Tab>('campaigns')
  const [totals, setTotals] = useState<Totals | null>(null)
  const [daily, setDaily] = useState<DailyRow[]>([])
  const [campaigns, setCampaigns] = useState<EntityRow[]>([])
  const [adsets, setAdsets] = useState<EntityRow[]>([])
  const [ads, setAds] = useState<EntityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')

  // Multi-select campaigns & adsets
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set())
  const [selectedAdsets, setSelectedAdsets] = useState<Set<string>>(new Set())

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>('spend')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const qs = `startDate=${dates.startDate}&endDate=${dates.endDate}`

  const fetchBase = useCallback(async () => {
    setLoading(true)
    try {
      const [accRes, campRes] = await Promise.all([
        fetch(`/api/meta-ads?${qs}&level=account`),
        fetch(`/api/meta-ads?${qs}&level=campaigns`),
      ])
      const accData = await accRes.json()
      const campData = await campRes.json()
      if (accData.totals) setTotals(accData.totals)
      if (accData.daily) setDaily(accData.daily)
      if (campData.data) setCampaigns(campData.data)
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [qs])

  // Fetch adsets + ads when campaigns selected
  useEffect(() => {
    if (selectedCampaigns.size === 0) { setAdsets([]); setAds([]); setSelectedAdsets(new Set()); return }
    const ids = Array.from(selectedCampaigns)
    // Fetch for each campaign and merge
    Promise.all(ids.map(id =>
      Promise.all([
        fetch(`/api/meta-ads?${qs}&level=adsets&campaign_id=${id}`).then(r => r.json()),
        fetch(`/api/meta-ads?${qs}&level=ads&campaign_id=${id}`).then(r => r.json()),
      ])
    )).then(results => {
      const allAdsets: EntityRow[] = []
      const allAds: EntityRow[] = []
      results.forEach(([adsetData, adsData]) => {
        if (adsetData.data) allAdsets.push(...adsetData.data)
        if (adsData.data) allAds.push(...adsData.data)
      })
      setAdsets(allAdsets)
      setAds(allAds)
    })
  }, [selectedCampaigns, qs])

  // Filter ads when adsets selected
  const filteredAds = useMemo(() => {
    if (selectedAdsets.size === 0) return ads
    return ads.filter(a => a.adset_id && selectedAdsets.has(a.adset_id))
  }, [ads, selectedAdsets])

  useEffect(() => { fetchBase() }, [fetchBase])
  useEffect(() => { const iv = setInterval(fetchBase, 5 * 60 * 1000); return () => clearInterval(iv) }, [fetchBase])
  useEffect(() => { setSelectedCampaigns(new Set()); setSelectedAdsets(new Set()) }, [dates])

  const handleTabChange = (t: Tab) => {
    setTab(t)
    if (t === 'campaigns') { setSelectedCampaigns(new Set()); setSelectedAdsets(new Set()) }
    if (t === 'adsets') { setSelectedAdsets(new Set()) }
  }

  const toggleCampaign = (id: string) => {
    setSelectedCampaigns(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
    setSelectedAdsets(new Set())
  }

  const toggleAllCampaigns = () => {
    if (selectedCampaigns.size === campaigns.length) {
      setSelectedCampaigns(new Set())
    } else {
      setSelectedCampaigns(new Set(campaigns.map(c => c.campaign_id!).filter(Boolean)))
    }
    setSelectedAdsets(new Set())
  }

  const toggleAdset = (id: string) => {
    setSelectedAdsets(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleAllAdsets = () => {
    if (selectedAdsets.size === adsets.length) {
      setSelectedAdsets(new Set())
    } else {
      setSelectedAdsets(new Set(adsets.map(a => a.adset_id!).filter(Boolean)))
    }
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const chartData = daily.map(d => ({ date: d.date.split('-').slice(1).reverse().join('/'), spend: Number(d.spend), color: roasBarColor(Number(d.roas)) }))

  // Active rows + sort
  const rawRows = tab === 'campaigns' ? campaigns : tab === 'adsets' ? adsets : filteredAds
  const activeRows = useMemo(() => {
    const sorted = [...rawRows].sort((a, b) => {
      const va = Number(a[sortKey] || 0)
      const vb = Number(b[sortKey] || 0)
      return sortDir === 'desc' ? vb - va : va - vb
    })
    return sorted
  }, [rawRows, sortKey, sortDir])

  const nameField = tab === 'campaigns' ? 'campaign_name' : tab === 'adsets' ? 'adset_name' : 'ad_name'
  const idField = tab === 'campaigns' ? 'campaign_id' : tab === 'adsets' ? 'adset_id' : 'ad_id'
  const selectedSet = tab === 'campaigns' ? selectedCampaigns : tab === 'adsets' ? selectedAdsets : null
  const onToggle = tab === 'campaigns' ? toggleCampaign : tab === 'adsets' ? toggleAdset : undefined
  const onToggleAll = tab === 'campaigns' ? toggleAllCampaigns : tab === 'adsets' ? toggleAllAdsets : undefined
  const allSelected = tab === 'campaigns' ? selectedCampaigns.size === campaigns.length && campaigns.length > 0 : tab === 'adsets' ? selectedAdsets.size === adsets.length && adsets.length > 0 : false

  const selectedCampNames = campaigns.filter(c => c.campaign_id && selectedCampaigns.has(c.campaign_id)).map(c => c.campaign_name).join(', ')
  const selectedAdsetNames = adsets.filter(a => a.adset_id && selectedAdsets.has(a.adset_id)).map(a => a.adset_name).join(', ')

  function SortTH({ label, field }: { label: string; field: SortKey }) {
    const active = sortKey === field
    return (
      <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold whitespace-nowrap cursor-pointer hover:text-zinc-300 select-none" onClick={() => handleSort(field)}>
        <span className="inline-flex items-center gap-1">
          {label}
          {active ? (sortDir === 'desc' ? <ChevronDown className="w-3 h-3 text-lime-400" /> : <ChevronUp className="w-3 h-3 text-lime-400" />) : <ChevronDown className="w-3 h-3 text-zinc-700" />}
        </span>
      </th>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-zinc-100">Meta Ads</h1><p className="text-sm text-zinc-500 mt-1">Shopee ADS 2.0 | R$97</p></div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-zinc-600">{lastUpdate}</div>
          <button onClick={fetchBase} className="p-1.5 rounded-lg hover:bg-zinc-800 transition text-zinc-600"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
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
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((totals.roas / 3) * 100, 100)}%`, background: roasBarColor(totals.roas) }} /></div>
            <div className="flex justify-between mt-1.5 text-[10px] text-zinc-600"><span>0</span><span>1.0</span><span className="text-red-400">1.4</span><span className="text-yellow-400">1.8</span><span className="text-emerald-400">2.0+</span><span>3.0</span></div>
          </div>
        </div>
      )}

      {/* Metricas gerais */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard icon={Eye} label="CPM" value={fmt.money(totals.cpm)} />
          <KpiCard icon={Layers} label="Frequencia" value={totals.frequency.toFixed(2)} color={totals.frequency > 3 ? 'text-red-400' : totals.frequency > 2 ? 'text-yellow-400' : 'text-zinc-100'} sub={totals.frequency > 3 ? 'Saturacao!' : totals.frequency > 2 ? 'Atencao' : 'Saudavel'} />
          <KpiCard icon={BarChart3} label="CTR (Link Click)" value={totals.link_clicks > 0 && totals.impressions > 0 ? fmt.pct(totals.link_clicks / totals.impressions * 100) : '—'} sub={`${fmt.num(totals.link_clicks)} clicks | CPC: ${totals.link_clicks > 0 ? fmt.money(totals.spend / totals.link_clicks) : '—'}`} />
          <KpiCard icon={Target} label="Taxa Conv. LP" value={totals.landing_page_views > 0 ? fmt.pct(totals.purchases / totals.landing_page_views * 100) : '—'} sub={`${fmt.num(totals.purchases)} compras / ${fmt.num(totals.landing_page_views)} visitantes`} color={totals.landing_page_views > 0 && (totals.purchases / totals.landing_page_views * 100) >= 1 ? 'text-emerald-400' : 'text-yellow-400'} />
        </div>
      )}

      {/* Funil de Conversao */}
      {totals && <ConversionFunnel totals={totals} />}

      {/* Financeiro */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FinCard label="Receita" value={fmt.money(totals.revenue)} color="text-emerald-400" />
          <FinCard label="Gasto" value={fmt.money(totals.spend)} color="text-blue-400" />
          <FinCard label="Imposto (12%)" value={fmt.money(totals.imposto)} color="text-orange-400" />
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 relative overflow-hidden">
            <div className={`absolute inset-0 ${totals.margem >= 0 ? 'bg-emerald-400/[0.03]' : 'bg-red-400/[0.03]'} pointer-events-none`} />
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-3 relative z-10">Margem</p>
            <p className={`text-2xl font-black tabular-nums relative z-10 ${totals.margem >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{totals.margem >= 0 ? '+' : ''}{fmt.money(totals.margem)}</p>
            <p className="text-[10px] text-zinc-600 mt-1 relative z-10">Receita - Gasto - Imposto</p>
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

      {/* Tabs + Breadcrumb */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['campaigns', 'adsets', 'ads'] as Tab[]).map(t => (
          <button key={t} onClick={() => handleTabChange(t)}
            className={`px-4 py-2 text-sm rounded-lg transition ${tab === t ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>
            {t === 'campaigns' ? 'Campanhas' : t === 'adsets' ? 'Conjuntos' : 'Anuncios'}
            <span className="ml-1.5 text-[10px] text-zinc-600">
              {t === 'campaigns' ? campaigns.length : t === 'adsets' ? adsets.length : filteredAds.length}
            </span>
          </button>
        ))}

        {selectedCampaigns.size > 0 && (
          <div className="flex items-center gap-1 ml-2">
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            <span className="text-xs bg-lime-400/8 text-lime-400 border border-lime-400/15 px-2 py-1 rounded-lg flex items-center gap-1.5 max-w-[250px] truncate">
              {selectedCampaigns.size === 1 ? selectedCampNames : `${selectedCampaigns.size} campanhas`}
              <button onClick={() => { setSelectedCampaigns(new Set()); setSelectedAdsets(new Set()); setTab('campaigns') }} className="text-lime-400/50 hover:text-red-400"><X className="w-3 h-3" /></button>
            </span>
          </div>
        )}
        {selectedAdsets.size > 0 && (
          <div className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            <span className="text-xs bg-lime-400/8 text-lime-400 border border-lime-400/15 px-2 py-1 rounded-lg flex items-center gap-1.5 max-w-[250px] truncate">
              {selectedAdsets.size === 1 ? selectedAdsetNames : `${selectedAdsets.size} conjuntos`}
              <button onClick={() => { setSelectedAdsets(new Set()); setTab('adsets') }} className="text-lime-400/50 hover:text-red-400"><X className="w-3 h-3" /></button>
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              {onToggle && (
                <th className="px-2 py-3 text-center w-[40px]">
                  <button onClick={onToggleAll} className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${allSelected ? 'bg-lime-400/20 border-lime-400/40 text-lime-400' : 'border-zinc-700 hover:border-zinc-500 text-transparent hover:text-zinc-600'}`}>
                    <Check className="w-3 h-3" />
                  </button>
                </th>
              )}
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{tab === 'campaigns' ? 'Campanha' : tab === 'adsets' ? 'Conjunto' : 'Anuncio'}</th>
              <SortTH label="Gasto" field="spend" />
              <SortTH label="CPM" field="cpm" />
              <SortTH label="C/ Vis. LP" field="cost_per_landing_page_view" />
              <SortTH label="C/ Info Pag." field="cost_per_add_payment_info" />
              <SortTH label="CPA" field="cost_per_purchase" />
              <SortTH label="Compras" field="purchases" />
              <SortTH label="Vendido" field="revenue" />
              <SortTH label="ROAS" field="roas" />
            </tr>
          </thead>
          <tbody>
            {activeRows.map((r, i) => {
              const name = String(r[nameField] || '—')
              const id = String(r[idField] || '')
              const isSelected = selectedSet?.has(id) || false
              return (
                <tr key={i} className={`border-b border-zinc-800/50 transition ${isSelected ? 'bg-lime-400/[0.04]' : 'hover:bg-zinc-800/30'}`}>
                  {onToggle && (
                    <td className="px-2 py-3 text-center">
                      <button onClick={() => onToggle(id)} className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${isSelected ? 'bg-lime-400/20 border-lime-400/40 text-lime-400' : 'border-zinc-700 hover:border-zinc-500 text-transparent hover:text-zinc-600'}`}>
                        <Check className="w-3 h-3" />
                      </button>
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm text-zinc-300 max-w-[280px] truncate">{name}</td>
                  <td className="px-4 py-3 text-sm text-zinc-300 text-right tabular-nums">{fmt.money(r.spend)}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400 text-right tabular-nums">{r.cpm > 0 ? fmt.money(r.cpm) : '—'}</td>
                  <td className="px-4 py-3 text-sm text-blue-400 text-right tabular-nums">{r.cost_per_landing_page_view > 0 ? fmt.money(r.cost_per_landing_page_view) : '—'}</td>
                  <td className="px-4 py-3 text-sm text-purple-400 text-right tabular-nums">{r.cost_per_add_payment_info > 0 ? fmt.money(r.cost_per_add_payment_info) : '—'}</td>
                  <td className={`px-4 py-3 text-sm text-right tabular-nums ${r.cost_per_purchase > 80 ? 'text-red-400' : r.cost_per_purchase > 60 ? 'text-yellow-400' : r.cost_per_purchase > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>{r.cost_per_purchase > 0 ? fmt.money(r.cost_per_purchase) : '—'}</td>
                  <td className="px-4 py-3 text-sm text-zinc-300 text-right tabular-nums">{r.purchases > 0 ? fmt.num(r.purchases) : '—'}</td>
                  <td className="px-4 py-3 text-sm text-emerald-400 text-right tabular-nums">{r.revenue > 0 ? fmt.money(r.revenue) : '—'}</td>
                  <td className="px-4 py-3 text-right"><span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold tabular-nums ${roasPill(r.roas)}`}>{r.roas > 0 ? fmt.roas(r.roas) : '—'}</span></td>
                </tr>
              )
            })}
            {activeRows.length === 0 && (
              <tr><td colSpan={onToggle ? 10 : 9} className="px-4 py-8 text-center text-zinc-600 text-sm">
                {loading ? 'Carregando...' : (tab === 'adsets' && selectedCampaigns.size === 0) ? 'Selecione uma ou mais campanhas' : (tab === 'ads' && selectedCampaigns.size === 0) ? 'Selecione uma campanha primeiro' : 'Sem dados para o periodo'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {loading && !totals && (
        <div className="flex items-center justify-center py-20 text-zinc-500"><RefreshCw className="w-5 h-5 animate-spin mr-3" />Carregando...</div>
      )}
    </div>
  )
}

function ConversionFunnel({ totals }: { totals: Totals }) {
  const impressions = totals.impressions
  const linkClicks = totals.link_clicks
  const lpViews = totals.landing_page_views
  const paymentInfo = totals.add_payment_info
  const purchases = totals.purchases

  const steps = [
    {
      label: 'Impressoes',
      value: impressions,
      cost: null,
      color: 'from-zinc-500/20 to-zinc-500/5',
      barColor: 'bg-zinc-500',
      textColor: 'text-zinc-300',
    },
    {
      label: 'Cliques no Link',
      value: linkClicks,
      cost: linkClicks > 0 ? totals.spend / linkClicks : 0,
      color: 'from-blue-500/20 to-blue-500/5',
      barColor: 'bg-blue-500',
      textColor: 'text-blue-400',
    },
    {
      label: 'Vis. Pag. Destino',
      value: lpViews,
      cost: totals.cost_per_landing_page_view,
      color: 'from-cyan-500/20 to-cyan-500/5',
      barColor: 'bg-cyan-500',
      textColor: 'text-cyan-400',
    },
    {
      label: 'Info Pagamento',
      value: paymentInfo,
      cost: totals.cost_per_add_payment_info,
      color: 'from-purple-500/20 to-purple-500/5',
      barColor: 'bg-purple-500',
      textColor: 'text-purple-400',
    },
    {
      label: 'Compras',
      value: purchases,
      cost: totals.cost_per_purchase,
      color: 'from-emerald-500/20 to-emerald-500/5',
      barColor: 'bg-emerald-500',
      textColor: 'text-emerald-400',
    },
  ]

  const maxVal = Math.max(...steps.map(s => s.value), 1)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-zinc-300">Funil de Conversao</h3>
        <span className="text-[10px] text-zinc-600">Impressao → Compra</span>
      </div>

      <div className="space-y-1">
        {steps.map((step, i) => {
          const prev = i > 0 ? steps[i - 1].value : 0
          const rate = prev > 0 ? (step.value / prev) * 100 : 0
          const widthPct = maxVal > 0 ? Math.max((step.value / maxVal) * 100, 4) : 4

          return (
            <div key={step.label}>
              {/* Conversion rate between steps */}
              {i > 0 && (
                <div className="flex items-center gap-2 py-1.5 pl-2">
                  <ChevronDown className="w-3 h-3 text-zinc-700" />
                  <span className={`text-xs font-bold tabular-nums ${rate >= 50 ? 'text-emerald-400' : rate >= 20 ? 'text-yellow-400' : rate >= 5 ? 'text-orange-400' : 'text-red-400'}`}>
                    {rate > 0 ? rate.toFixed(1) + '%' : '—'}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    {i === 1 ? 'CTR (Link Click)' : i === 2 ? 'Connect Rate' : i === 3 ? 'Taxa Info Pag.' : 'Taxa de Compra'}
                  </span>
                </div>
              )}

              {/* Funnel bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="relative">
                    {/* Background bar (full width reference) */}
                    <div className="h-12 bg-zinc-800/30 rounded-lg overflow-hidden">
                      {/* Colored bar (proportional) */}
                      <div
                        className={`h-full rounded-lg bg-gradient-to-r ${step.color} flex items-center transition-all duration-700`}
                        style={{ width: `${widthPct}%`, minWidth: '120px' }}
                      >
                        <div className="flex items-center justify-between w-full px-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${step.barColor} flex-shrink-0`} />
                            <span className="text-[11px] font-semibold text-zinc-400 whitespace-nowrap">{step.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Value + Cost */}
                <div className="w-[180px] flex-shrink-0 flex items-center gap-4">
                  <div className="text-right flex-1">
                    <p className={`text-base font-extrabold tabular-nums ${step.textColor}`}>{fmt.num(step.value)}</p>
                  </div>
                  <div className="text-right w-[90px]">
                    {step.cost !== null && step.cost > 0 ? (
                      <p className="text-[11px] text-zinc-500 tabular-nums">{fmt.money(step.cost)}<span className="text-zinc-700">/un</span></p>
                    ) : (
                      <p className="text-[11px] text-zinc-700">—</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary line */}
      <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs">
        <span className="text-zinc-600">Conversao total: Impressao → Compra</span>
        <span className={`font-bold tabular-nums ${impressions > 0 && purchases > 0 ? 'text-lime-400' : 'text-zinc-600'}`}>
          {impressions > 0 && purchases > 0 ? (purchases / impressions * 100).toFixed(3) + '%' : '—'}
          {impressions > 0 && purchases > 0 && <span className="text-zinc-600 font-normal ml-2">({fmt.num(purchases)} de {fmt.num(impressions)})</span>}
        </span>
      </div>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color?: string; sub?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4">
      <div className="flex items-center gap-1.5 mb-3 h-5">
        <Icon className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold truncate">{label}</span>
      </div>
      <p className={`text-[17px] font-extrabold leading-snug tabular-nums ${color || 'text-zinc-100'}`}>{value}</p>
      {sub && <p className="text-[10px] text-zinc-600 mt-1 truncate">{sub}</p>}
    </div>
  )
}
function FinCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-3">{label}</p>
      <p className={`text-2xl font-black tabular-nums ${color}`}>{value}</p>
    </div>
  )
}
