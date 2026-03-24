'use client'

import { useEffect, useState, useCallback } from 'react'
import { ArrowLeftRight, RefreshCw, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts'
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
  pct: (v: number) => v.toFixed(1) + '%',
  roas: (v: number) => v.toFixed(2) + 'x',
}

function roasColor(roas: number) {
  if (roas === 0) return 'text-zinc-500'
  if (roas < 1.4) return 'text-red-400'
  if (roas <= 1.8) return 'text-yellow-400'
  return 'text-emerald-400'
}

interface Totals {
  spend: number; purchases_meta: number; revenue_meta: number; roas_meta: number
  purchases_real: number; revenue_real: number; refunds: number; refund_amount: number
  net_revenue: number; roas_real: number; divergence: number
  cpa_meta: number; cpa_real: number; ticket_medio: number; refund_rate: number
}

interface DailyRow {
  date: string; spend: number
  purchases_meta: number; revenue_meta: number; roas_meta: number
  purchases_real: number; revenue_real: number; roas_real: number
}

export default function RoasRealPage() {
  const [dates, setDates] = useState(defaultDates)
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

  const chartData = daily.map(d => ({
    date: d.date.split('-').slice(1).reverse().join('/'),
    'ROAS Meta': d.roas_meta,
    'ROAS Real': d.roas_real,
    'Vendas Meta': d.purchases_meta,
    'Vendas Real': d.purchases_real,
  }))

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
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          {lastUpdate && <span>{lastUpdate}</span>}
          <button onClick={fetchData} className="p-1.5 rounded-lg hover:bg-zinc-800 transition">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <DatePicker startDate={dates.startDate} endDate={dates.endDate} onChange={(s, e) => setDates({ startDate: s, endDate: e })} />
      </div>

      {totals && (
        <>
          {/* Comparison Hero */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Meta ROAS */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">ROAS Meta (atribuicao)</p>
              <p className={`text-4xl font-black ${roasColor(totals.roas_meta)}`}>
                {totals.roas_meta > 0 ? fmt.roas(totals.roas_meta) : '—'}
              </p>
              <div className="mt-3 space-y-1 text-xs text-zinc-500">
                <p>{totals.purchases_meta} vendas · {fmt.money(totals.revenue_meta)}</p>
                <p>CPA: {fmt.money(totals.cpa_meta)}</p>
              </div>
            </div>

            {/* VS / Divergence */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center flex flex-col items-center justify-center">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
                Math.abs(totals.divergence) <= 10 ? 'bg-emerald-400/10 text-emerald-400' :
                Math.abs(totals.divergence) <= 30 ? 'bg-yellow-400/10 text-yellow-400' :
                'bg-red-400/10 text-red-400'
              }`}>
                {Math.abs(totals.divergence) <= 10 ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Divergencia</p>
              <p className={`text-3xl font-black mt-1 ${
                Math.abs(totals.divergence) <= 10 ? 'text-emerald-400' :
                Math.abs(totals.divergence) <= 30 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {totals.divergence > 0 ? '+' : ''}{fmt.pct(totals.divergence)}
              </p>
              <p className="text-[11px] text-zinc-600 mt-2">
                {Math.abs(totals.divergence) <= 10 ? 'Dados confiaveis' :
                 totals.divergence > 0 ? 'Ticto registra mais vendas' : 'Meta superestima vendas'}
              </p>
            </div>

            {/* Real ROAS */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">ROAS Real (Ticto)</p>
              <p className={`text-4xl font-black ${roasColor(totals.roas_real)}`}>
                {totals.roas_real > 0 ? fmt.roas(totals.roas_real) : '—'}
              </p>
              <div className="mt-3 space-y-1 text-xs text-zinc-500">
                <p>{totals.purchases_real} vendas · {fmt.money(totals.revenue_real)}</p>
                <p>CPA: {totals.cpa_real > 0 ? fmt.money(totals.cpa_real) : '—'}</p>
              </div>
            </div>
          </div>

          {/* Details row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Gasto Total</p>
              <p className="text-lg font-bold text-blue-400 mt-1">{fmt.money(totals.spend)}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Ticket Medio</p>
              <p className="text-lg font-bold text-zinc-200 mt-1">{totals.ticket_medio > 0 ? fmt.money(totals.ticket_medio) : '—'}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Reembolsos</p>
              <p className="text-lg font-bold text-red-400 mt-1">{totals.refunds} ({fmt.pct(totals.refund_rate)})</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Receita Liquida</p>
              <p className="text-lg font-bold text-emerald-400 mt-1">{fmt.money(totals.net_revenue)}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Lucro</p>
              <p className={`text-lg font-bold mt-1 ${totals.net_revenue - totals.spend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {fmt.money(totals.net_revenue - totals.spend)}
              </p>
            </div>
          </div>

          {/* Chart: ROAS comparison by day */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-zinc-400 mb-4">ROAS Diario: Meta vs Real</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#666', fontSize: 11 }} domain={[0, 'auto']} />
                  <Tooltip
                    contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '12px', fontSize: 12 }}
                    formatter={(value, name) => [Number(value).toFixed(2) + 'x', String(name)]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#666' }} />
                  <Bar dataKey="ROAS Meta" fill="#4f8cff" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="ROAS Real" radius={[3, 3, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry['ROAS Real'] >= 1.4 ? '#22c55e' : entry['ROAS Real'] > 0 ? '#ef4444' : '#333'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-4 py-3 border-b border-zinc-800">Data</th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-4 py-3 border-b border-zinc-800">Gasto</th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-4 py-3 border-b border-zinc-800">Vendas Meta</th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-4 py-3 border-b border-zinc-800">Vendas Real</th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-4 py-3 border-b border-zinc-800">ROAS Meta</th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-4 py-3 border-b border-zinc-800">ROAS Real</th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-4 py-3 border-b border-zinc-800">Diff</th>
                </tr>
              </thead>
              <tbody>
                {daily.map(d => {
                  const diff = d.purchases_meta > 0 ? ((d.purchases_real - d.purchases_meta) / d.purchases_meta * 100) : 0
                  return (
                    <tr key={d.date} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition">
                      <td className="px-4 py-3 text-sm text-zinc-300">{d.date.split('-').reverse().join('/')}</td>
                      <td className="px-4 py-3 text-sm text-right text-zinc-400">{fmt.money(d.spend)}</td>
                      <td className="px-4 py-3 text-sm text-right text-blue-400 font-semibold">{d.purchases_meta}</td>
                      <td className="px-4 py-3 text-sm text-right text-emerald-400 font-semibold">{d.purchases_real}</td>
                      <td className={`px-4 py-3 text-sm text-right font-bold ${roasColor(d.roas_meta)}`}>{d.roas_meta > 0 ? fmt.roas(d.roas_meta) : '—'}</td>
                      <td className={`px-4 py-3 text-sm text-right font-bold ${roasColor(d.roas_real)}`}>{d.roas_real > 0 ? fmt.roas(d.roas_real) : '—'}</td>
                      <td className={`px-4 py-3 text-sm text-right font-bold ${Math.abs(diff) <= 10 ? 'text-zinc-500' : diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
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
          <h3 className="text-lg font-bold text-zinc-400 mb-2">Aguardando dados da Ticto</h3>
          <p className="text-sm text-zinc-600">Quando as vendas reais começarem a chegar via webhook, o cruzamento sera exibido aqui.</p>
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
