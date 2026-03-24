'use client'

import { useEffect, useState, useCallback } from 'react'
import { ShoppingBag, RefreshCw, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react'
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

export default function InfoprodutosPage() {
  const today = todayISO()
  const [dates, setDates] = useState({ startDate: today, endDate: today })
  const [totals, setTotals] = useState<Totals | null>(null)
  const [topBumps, setTopBumps] = useState<{ name: string; count: number; revenue: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/infoprodutos?startDate=${dates.startDate}&endDate=${dates.endDate}`)
      const data = await res.json()
      if (data.totals) setTotals(data.totals)
      if (data.top_bumps) setTopBumps(data.top_bumps)
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [dates])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { const iv = setInterval(fetchData, 5 * 60 * 1000); return () => clearInterval(iv) }, [fetchData])

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

          {/* 4. Bumps separados + Upsell + Downsell */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-zinc-300 mb-4">Bumps, Upsells & Downsells</h3>

            {/* Bumps individuais */}
            {topBumps.length > 0 && (
              <div className="mb-5">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-lime-400" /> Order Bumps
                  <span className="text-lime-400 ml-1">{fmt.num(totals.bump_orders)} pedidos com bump ({fmt.pct(totals.bump_rate)})</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {topBumps.map(b => (
                    <div key={b.name} className="bg-zinc-800/40 border border-zinc-800 rounded-xl px-4 py-3">
                      <p className="text-xs font-bold text-zinc-200 truncate" title={b.name}>{b.name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-lg font-black text-lime-400 tabular-nums">{fmt.num(b.count)}</span>
                        <span className="text-xs text-zinc-400 tabular-nums">{fmt.money(b.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upsell + Downsell */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpRight className="w-4 h-4 text-lime-400" />
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Upsells</p>
                </div>
                <p className="text-2xl font-black text-lime-400 tabular-nums">{fmt.num(totals.upsell_count)}</p>
                <p className="text-xs text-zinc-500 mt-1">{fmt.money(totals.upsell_revenue)}</p>
              </div>
              <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDownRight className="w-4 h-4 text-zinc-400" />
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Downsells</p>
                </div>
                <p className="text-2xl font-black text-zinc-300 tabular-nums">{fmt.num(totals.downsell_count)}</p>
                <p className="text-xs text-zinc-500 mt-1">{fmt.money(totals.downsell_revenue)}</p>
              </div>
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
