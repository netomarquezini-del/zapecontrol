'use client'

import { useEffect, useState, useCallback } from 'react'
import { CreditCard, RefreshCw, Search, ArrowUpRight, ArrowDownRight, Check, XCircle } from 'lucide-react'
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
}

interface Transaction {
  id: number; order_id: string; status: string; status_date: string
  payment_method: string; product_name: string; paid_amount: number; price: number
  customer_name: string; customer_email: string; customer_state: string
  utm_source: string; utm_campaign: string; utm_content: string
}

export default function TransacoesPage() {
  const [dates, setDates] = useState(defaultDates)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'authorized' | 'refunded'>('all')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/infoprodutos?startDate=${dates.startDate}&endDate=${dates.endDate}&view=transactions`)
      const data = await res.json()
      if (data.transactions) setTransactions(data.transactions)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [dates])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = transactions.filter(t => {
    if (filter === 'authorized' && t.status !== 'authorized') return false
    if (filter === 'refunded' && !['refunded', 'chargeback'].includes(t.status)) return false
    if (search) {
      const s = search.toLowerCase()
      return (t.customer_name || '').toLowerCase().includes(s) ||
        (t.customer_email || '').toLowerCase().includes(s) ||
        (t.order_id || '').toLowerCase().includes(s)
    }
    return true
  })

  const statusBadge = (status: string) => {
    switch (status) {
      case 'authorized': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"><Check className="w-3 h-3" />Aprovada</span>
      case 'refunded': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-yellow-400/10 text-yellow-400 border border-yellow-400/20"><ArrowDownRight className="w-3 h-3" />Reembolso</span>
      case 'chargeback': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-400/10 text-red-400 border border-red-400/20"><XCircle className="w-3 h-3" />Chargeback</span>
      default: return <span className="text-[10px] text-zinc-500">{status}</span>
    }
  }

  const paymentIcon = (method: string) => {
    switch (method) {
      case 'pix': return <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">PIX</span>
      case 'credit_card': return <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">Cartao</span>
      case 'bank_slip': return <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">Boleto</span>
      default: return <span className="text-[10px] text-zinc-500">{method}</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-lime-400" />
            Transacoes
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Todas as vendas e reembolsos · Ticto</p>
        </div>
        <button onClick={fetchData} className="p-1.5 rounded-lg hover:bg-zinc-800 transition text-zinc-600">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <DatePicker startDate={dates.startDate} endDate={dates.endDate} onChange={(s, e) => setDates({ startDate: s, endDate: e })} />

        <div className="flex gap-2 ml-auto">
          {(['all', 'authorized', 'refunded'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                filter === f
                  ? 'border-zinc-600 bg-zinc-800 text-zinc-200'
                  : 'border-zinc-800 text-zinc-600 hover:text-zinc-400'
              }`}>
              {f === 'all' ? 'Todas' : f === 'authorized' ? 'Aprovadas' : 'Reembolsos'}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, email ou pedido..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-600 transition"
        />
      </div>

      {/* Stats bar */}
      <div className="flex gap-6 text-xs text-zinc-500">
        <span><strong className="text-zinc-300">{filtered.length}</strong> transacoes</span>
        <span><strong className="text-emerald-400">{filtered.filter(t => t.status === 'authorized').length}</strong> aprovadas</span>
        <span><strong className="text-red-400">{filtered.filter(t => ['refunded','chargeback'].includes(t.status)).length}</strong> reembolsos</span>
        <span className="ml-auto">Total: <strong className="text-zinc-200">{fmt.money(filtered.filter(t => t.status === 'authorized').reduce((s, t) => s + Number(t.paid_amount), 0))}</strong></span>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-4 py-3 border-b border-zinc-800">Data</th>
              <th className="text-left text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-4 py-3 border-b border-zinc-800">Cliente</th>
              <th className="text-left text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-4 py-3 border-b border-zinc-800">Status</th>
              <th className="text-left text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-4 py-3 border-b border-zinc-800">Pagamento</th>
              <th className="text-right text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-4 py-3 border-b border-zinc-800">Valor</th>
              <th className="text-left text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-4 py-3 border-b border-zinc-800">Bump</th>
              <th className="text-left text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-4 py-3 border-b border-zinc-800">Fonte</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => {
              const hasBump = Number(t.paid_amount) > Number(t.price) && Number(t.price) > 0
              const bumpValue = hasBump ? Number(t.paid_amount) - Number(t.price) : 0
              return (
                <tr key={`${t.order_id}-${t.status}-${i}`} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition">
                  <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
                    {t.status_date ? new Date(t.status_date).toLocaleDateString('pt-BR') : '—'}
                    <br />
                    <span className="text-zinc-600">{t.status_date ? new Date(t.status_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-zinc-200 truncate max-w-[200px]">{t.customer_name || '—'}</p>
                    <p className="text-[11px] text-zinc-600 truncate max-w-[200px]">{t.customer_email}</p>
                  </td>
                  <td className="px-4 py-3">{statusBadge(t.status)}</td>
                  <td className="px-4 py-3">{paymentIcon(t.payment_method)}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-zinc-200">{fmt.money(Number(t.paid_amount))}</td>
                  <td className="px-4 py-3">
                    {hasBump ? (
                      <span className="text-[10px] font-bold text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit">
                        <ArrowUpRight className="w-3 h-3" />+{fmt.money(bumpValue)}
                      </span>
                    ) : <span className="text-zinc-700">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-zinc-500 max-w-[150px] truncate" title={t.utm_campaign}>
                    {t.utm_source || 'direto'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-zinc-600 text-sm">
            {loading ? 'Carregando...' : 'Nenhuma transacao encontrada'}
          </div>
        )}
      </div>
    </div>
  )
}
