'use client'

import { useEffect, useState, useCallback } from 'react'
import { ArrowLeftRight, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'
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
  roas: (v: number) => v.toFixed(2) + 'x',
}

// Semáforo pro ROAS
function roasColor(roas: number) {
  if (roas === 0) return 'text-zinc-500'
  if (roas < 1.4) return 'text-red-400'
  if (roas <= 1.8) return 'text-yellow-400'
  return 'text-emerald-400'
}

interface Totals {
  spend: number
  purchases_meta: number; revenue_meta: number; roas_meta: number; cpa_meta: number
  orders: number; revenue_principal: number; revenue_bumps: number
  revenue_upsells: number; revenue_downsells: number; revenue_real: number
  bump_count: number; bump_rate: number; upsell_count: number; downsell_count: number
  refunds: number; refund_amount: number; refund_rate: number
  net_revenue: number; roas_real: number; cpa_real: number; ticket_medio: number
  imposto: number; margem: number; divergence: number
}

interface DailyRow {
  date: string; spend: number
  purchases_meta: number; revenue_meta: number; roas_meta: number
  orders_real: number; revenue_real: number; roas_real: number
}

export default function RoasRealPage() {
  const today = todayISO()
  const [dates, setDates] = useState({ startDate: today, endDate: today })
  const [totals, setTotals] = useState<Totals | null>(null)
  const [daily, setDaily] = useState<DailyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/meta-ads/real-roas?startDate=${dates.startDate}&endDate=${dates.endDate}&breakdown=daily`)
      const data = await res.json()
      if (data.totals) setTotals(data.totals)
      if (data.daily) setDaily(data.daily)
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [dates])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { const iv = setInterval(fetchData, 5 * 60 * 1000); return () => clearInterval(iv) }, [fetchData])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
            <ArrowLeftRight className="w-6 h-6 text-lime-400" />
            ROAS Real
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Meta Ads (atribuicao) vs Ticto (vendas confirmadas)</p>
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
          {/* Comparison Hero — ROAS semáforo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Meta ROAS */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">ROAS Meta (atribuicao)</p>
              <p className={`text-5xl font-black ${roasColor(totals.roas_meta)}`}>
                {totals.roas_meta > 0 ? fmt.roas(totals.roas_meta) : '—'}
              </p>
              <div className="mt-4 space-y-1 text-xs text-zinc-500">
                <p><span className="text-white font-bold">{fmt.num(totals.purchases_meta)}</span> vendas · {fmt.money(totals.revenue_meta)}</p>
                <p>CPA: <span className="text-white font-semibold">{fmt.money(totals.cpa_meta)}</span></p>
              </div>
            </div>

            {/* Divergência — semáforo */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center flex flex-col items-center justify-center">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
                Math.abs(totals.divergence) <= 10 ? 'bg-emerald-400/10 text-emerald-400' :
                Math.abs(totals.divergence) <= 25 ? 'bg-yellow-400/10 text-yellow-400' :
                'bg-red-400/10 text-red-400'
              }`}>
                {Math.abs(totals.divergence) <= 10 ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Divergencia</p>
              <p className={`text-3xl font-black mt-1 ${
                Math.abs(totals.divergence) <= 10 ? 'text-emerald-400' :
                Math.abs(totals.divergence) <= 25 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {totals.divergence > 0 ? '+' : ''}{fmt.pct(totals.divergence)}
              </p>
              <p className="text-[11px] text-zinc-600 mt-2">
                {Math.abs(totals.divergence) <= 10 ? 'Dados confiaveis' :
                 Math.abs(totals.divergence) <= 25 ? 'Atencao — divergencia moderada' :
                 totals.divergence > 0 ? 'Ticto registra muito mais vendas' : 'Meta superestima vendas'}
              </p>
            </div>

            {/* Real ROAS */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">ROAS Real (Ticto)</p>
              <p className={`text-5xl font-black ${roasColor(totals.roas_real)}`}>
                {totals.roas_real > 0 ? fmt.roas(totals.roas_real) : '—'}
              </p>
              <div className="mt-4 space-y-1 text-xs text-zinc-500">
                <p><span className="text-white font-bold">{fmt.num(totals.orders)}</span> pedidos · {fmt.money(totals.revenue_real)}</p>
                <p>CPA: <span className="text-white font-semibold">{totals.cpa_real > 0 ? fmt.money(totals.cpa_real) : '—'}</span></p>
              </div>
            </div>
          </div>

          {/* Financeiro */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card label="Receita Total" value={fmt.money(totals.revenue_real)} color="text-lime-400" />
            <Card label="Gasto Ads" value={fmt.money(totals.spend)} color="text-white" />
            <Card label="Imposto (12%)" value={fmt.money(totals.imposto)} color="text-zinc-400" />
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 relative overflow-hidden">
              <div className={`absolute inset-0 ${totals.margem >= 0 ? 'bg-lime-400/[0.03]' : 'bg-red-400/[0.03]'} pointer-events-none`} />
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-3 relative z-10">Margem</p>
              <p className={`text-2xl font-black tabular-nums relative z-10 ${totals.margem >= 0 ? 'text-lime-400' : 'text-red-400'}`}>{totals.margem >= 0 ? '+' : ''}{fmt.money(totals.margem)}</p>
              <p className="text-[10px] text-zinc-600 mt-1 relative z-10">Receita - Gasto - Imposto</p>
            </div>
          </div>

          {/* Pedidos */}
          <div className="grid grid-cols-2 gap-3">
            <Card label="Pedidos" value={fmt.num(totals.orders)} sub={`CPA Real: ${totals.cpa_real > 0 ? fmt.money(totals.cpa_real) : '—'}`} color="text-lime-400" />
            <Card label="Ticket Medio" value={fmt.money(totals.ticket_medio)} sub={`Bumps: ${totals.bump_count} (${fmt.pct(totals.bump_rate)}) · Upsells: ${totals.upsell_count} · Downsells: ${totals.downsell_count}`} color="text-lime-400" />
          </div>

          {/* Tabela diária */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <TH align="left">Data</TH>
                  <TH>Gasto</TH>
                  <TH>Vendas Meta</TH>
                  <TH>Pedidos Real</TH>
                  <TH>Receita Meta</TH>
                  <TH>Receita Real</TH>
                  <TH>ROAS Meta</TH>
                  <TH>ROAS Real</TH>
                  <TH>Diff</TH>
                </tr>
              </thead>
              <tbody>
                {daily.map(d => {
                  const diff = d.purchases_meta > 0 ? ((d.orders_real - d.purchases_meta) / d.purchases_meta * 100) : 0
                  return (
                    <tr key={d.date} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition">
                      <td className="px-3 py-2.5 text-xs text-zinc-300">{d.date.split('-').reverse().join('/')}</td>
                      <td className="px-3 py-2.5 text-xs text-right text-white tabular-nums font-semibold">{fmt.money(d.spend)}</td>
                      <td className="px-3 py-2.5 text-xs text-right text-zinc-400 tabular-nums">{d.purchases_meta}</td>
                      <td className="px-3 py-2.5 text-xs text-right text-lime-400 tabular-nums font-semibold">{d.orders_real}</td>
                      <td className="px-3 py-2.5 text-xs text-right text-zinc-400 tabular-nums">{fmt.money(d.revenue_meta)}</td>
                      <td className="px-3 py-2.5 text-xs text-right text-lime-400 tabular-nums font-semibold">{fmt.money(d.revenue_real)}</td>
                      <td className={`px-3 py-2.5 text-xs text-right font-bold tabular-nums ${roasColor(d.roas_meta)}`}>{d.roas_meta > 0 ? fmt.roas(d.roas_meta) : '—'}</td>
                      <td className={`px-3 py-2.5 text-xs text-right font-bold tabular-nums ${roasColor(d.roas_real)}`}>{d.roas_real > 0 ? fmt.roas(d.roas_real) : '—'}</td>
                      <td className={`px-3 py-2.5 text-xs text-right font-bold tabular-nums ${Math.abs(diff) <= 10 ? 'text-zinc-500' : diff > 0 ? 'text-lime-400' : 'text-red-400'}`}>
                        {d.purchases_meta > 0 ? (diff > 0 ? '+' : '') + diff.toFixed(0) + '%' : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!totals && !loading && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <ArrowLeftRight className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-zinc-400 mb-2">Aguardando dados</h3>
          <p className="text-sm text-zinc-600">Selecione um periodo com dados de vendas Ticto.</p>
        </div>
      )}

      {loading && !totals && (
        <div className="flex items-center justify-center h-40"><RefreshCw className="w-6 h-6 text-lime-400 animate-spin" /></div>
      )}
    </div>
  )
}

function TH({ children, align }: { children: React.ReactNode; align?: string }) {
  return <th className={`${align === 'left' ? 'text-left' : 'text-right'} px-3 py-2.5 text-[9px] uppercase tracking-wider text-zinc-500 font-semibold whitespace-nowrap border-b border-zinc-800`}>{children}</th>
}

function Card({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-3">{label}</p>
      <p className={`text-xl font-black tabular-nums ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-zinc-600 mt-1">{sub}</p>}
    </div>
  )
}
