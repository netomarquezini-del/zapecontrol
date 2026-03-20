'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import { Loader2, Trophy, Users, Headphones, TrendingUp, TrendingDown, Target } from 'lucide-react'
import { MonthPicker } from '@/components/date-picker'

interface Closer { id: number; name: string }
interface Sdr { id: number; name: string }
interface MetaMensal { id: number; mes: string; nivel: string; meta_mensal_vendas: number; meta_diaria_vendas: number }
interface MetaCloser { id: number; mes_id: number; closer_id: number; meta_mensal: number; meta_diaria: number }
interface MetaSdr { id: number; mes_id: number; sdr_id: number; meta_mensal: number; meta_diaria: number; meta_reunioes_mensal: number; meta_reunioes_diaria: number }
interface Movement { id: number; data_raw: string; closer_id: number; agendamentos: { sdr_id: number; quantidade: number }[] | null; reunioes: { sdr_id: number; quantidade: number }[] | null; reagendamentos: { sdr_id: number; quantidade: number }[] | null; noshows: { sdr_id: number; quantidade: number }[] | null; ganhos: { valor: number; sdr_id: number }[] | null }

const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const NIVEIS = ['minima', 'super', 'ultra', 'black'] as const
const NIVEL_LABEL: Record<string, string> = { minima: 'Minima', super: 'Super', ultra: 'Ultra', black: 'Black' }

function getCurrentMonth() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

function getBusinessDays(month: string) {
  const [y, m] = month.split('-').map(Number)
  const days = new Date(y, m, 0).getDate()
  let c = 0
  for (let d = 1; d <= days; d++) { const dow = new Date(y, m - 1, d).getDay(); if (dow >= 1 && dow <= 5) c++ }
  return c
}

function getBusinessDaysElapsed(month: string) {
  const [y, m] = month.split('-').map(Number)
  const now = new Date()
  const isCurrent = now.getFullYear() === y && (now.getMonth() + 1) === m
  const lastDay = isCurrent ? now.getDate() : new Date(y, m, 0).getDate()
  let c = 0
  for (let d = 1; d <= lastDay; d++) { const dow = new Date(y, m - 1, d).getDay(); if (dow >= 1 && dow <= 5) c++ }
  return c
}

export default function AcompanhamentoPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [selectedNivel, setSelectedNivel] = useState<string>('minima')
  const [loading, setLoading] = useState(true)
  const [closers, setClosers] = useState<Closer[]>([])
  const [sdrs, setSdrs] = useState<Sdr[]>([])
  const [metasMensais, setMetasMensais] = useState<MetaMensal[]>([])
  const [closerMetas, setCloserMetas] = useState<MetaCloser[]>([])
  const [sdrMetas, setSdrMetas] = useState<MetaSdr[]>([])
  const [movements, setMovements] = useState<Movement[]>([])

  const bd = getBusinessDays(selectedMonth)
  const bdElapsed = getBusinessDaysElapsed(selectedMonth)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const supabase = getSupabase()
    const [y, m] = selectedMonth.split('-').map(Number)
    const daysInMonth = new Date(y, m, 0).getDate()

    const [movRes, cRes, sRes, mRes, cmRes, smRes] = await Promise.all([
      supabase.from('movements').select('*').gte('data_raw', `${selectedMonth}-01`).lte('data_raw', `${selectedMonth}-${String(daysInMonth).padStart(2, '0')}`),
      supabase.from('closers').select('*').order('name'),
      supabase.from('sdrs').select('*').order('name'),
      supabase.from('metas_mensais').select('*').eq('mes', selectedMonth),
      supabase.from('metas_closers').select('*'),
      supabase.from('metas_sdrs').select('*'),
    ])

    const metas = (mRes.data ?? []) as MetaMensal[]
    const metaIds = new Set(metas.map((m) => m.id))

    setMovements((movRes.data ?? []) as Movement[])
    setClosers((cRes.data ?? []) as Closer[])
    setSdrs((sRes.data ?? []) as Sdr[])
    setMetasMensais(metas)
    setCloserMetas(((cmRes.data ?? []) as MetaCloser[]).filter((c) => metaIds.has(c.mes_id)))
    setSdrMetas(((smRes.data ?? []) as MetaSdr[]).filter((s) => metaIds.has(s.mes_id)))
    setLoading(false)
  }, [selectedMonth])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Nivel lookup
  const mesIdToNivel: Record<number, string> = {}
  metasMensais.forEach((m) => { mesIdToNivel[m.id] = m.nivel })
  const selectedMesId = metasMensais.find((m) => m.nivel === selectedNivel)?.id

  // Closer stats
  const closerStats = closers.map((c) => {
    const meta = closerMetas.find((cm) => cm.closer_id === c.id && cm.mes_id === selectedMesId)
    let vendas = 0, numVendas = 0, reunioes = 0, agend = 0, reag = 0, noshow = 0
    movements.filter((m) => m.closer_id === c.id).forEach((m) => {
      (m.ganhos ?? []).forEach((g) => { vendas += g.valor || 0; numVendas++ });
      (m.reunioes ?? []).forEach((r) => { reunioes += r.quantidade || 0 });
      (m.agendamentos ?? []).forEach((a) => { agend += a.quantidade || 0 });
      (m.reagendamentos ?? []).forEach((r) => { reag += r.quantidade || 0 });
      (m.noshows ?? []).forEach((n) => { noshow += n.quantidade || 0 })
    })
    const metaMensal = meta?.meta_mensal || 0
    const metaEsperada = meta ? meta.meta_diaria * bdElapsed : 0
    const pctMeta = metaMensal > 0 ? (vendas / metaMensal) * 100 : 0
    const pctEsperada = metaEsperada > 0 ? (vendas / metaEsperada) * 100 : 0
    const conversao = reunioes > 0 ? (numVendas / reunioes) * 100 : 0
    const ticketMedio = numVendas > 0 ? vendas / numVendas : 0
    return { ...c, vendas, numVendas, reunioes, agend, reag, noshow, metaMensal, metaEsperada, pctMeta, pctEsperada, conversao, ticketMedio }
  }).sort((a, b) => b.vendas - a.vendas)

  // SDR stats
  const sdrStats = sdrs.map((s) => {
    const meta = sdrMetas.find((sm) => sm.sdr_id === s.id && sm.mes_id === selectedMesId)
    let agend = 0, reun = 0, reag = 0, noshow = 0, vendas = 0, numVendas = 0
    movements.forEach((m) => {
      (m.agendamentos ?? []).filter((a) => a.sdr_id === s.id).forEach((a) => { agend += a.quantidade || 0 });
      (m.reunioes ?? []).filter((r) => r.sdr_id === s.id).forEach((r) => { reun += r.quantidade || 0 });
      (m.reagendamentos ?? []).filter((r) => r.sdr_id === s.id).forEach((r) => { reag += r.quantidade || 0 });
      (m.noshows ?? []).filter((n) => n.sdr_id === s.id).forEach((n) => { noshow += n.quantidade || 0 });
      (m.ganhos ?? []).filter((g) => g.sdr_id === s.id).forEach((g) => { vendas += g.valor || 0; numVendas++ })
    })
    const metaMensal = meta?.meta_mensal || 0
    const metaEsperada = meta ? meta.meta_diaria * bdElapsed : 0
    const pctMeta = metaMensal > 0 ? (agend / metaMensal) * 100 : 0
    const pctEsperada = metaEsperada > 0 ? (agend / metaEsperada) * 100 : 0
    const metaReunMensal = meta?.meta_reunioes_mensal || 0
    const metaReunEsperada = meta ? (meta.meta_reunioes_diaria || 0) * bdElapsed : 0
    const pctMetaReun = metaReunMensal > 0 ? (reun / metaReunMensal) * 100 : 0
    const pctReunEsperada = metaReunEsperada > 0 ? (reun / metaReunEsperada) * 100 : 0
    const taxaReuniao = agend > 0 ? (reun / agend) * 100 : 0
    const taxaNoshow = agend > 0 ? (noshow / agend) * 100 : 0
    return { ...s, agend, reun, reag, noshow, vendas, numVendas, metaMensal, metaEsperada, pctMeta, pctEsperada, metaReunMensal, metaReunEsperada, pctMetaReun, pctReunEsperada, taxaReuniao, taxaNoshow }
  }).sort((a, b) => b.agend - a.agend)

  // Totals
  const closerTotal = closerStats.reduce((a, c) => ({ vendas: a.vendas + c.vendas, meta: a.meta + c.metaMensal, esperada: a.esperada + c.metaEsperada }), { vendas: 0, meta: 0, esperada: 0 })
  const sdrTotal = sdrStats.reduce((a, s) => ({ agend: a.agend + s.agend, meta: a.meta + s.metaMensal, esperada: a.esperada + s.metaEsperada }), { agend: 0, meta: 0, esperada: 0 })

  const th = "py-3.5 px-4 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-600"
  const td = "py-3 px-4 text-[13px]"

  const StatusBadge = ({ pct }: { pct: number }) => {
    const color = pct >= 100 ? '#A3E635' : pct >= 70 ? '#f59e0b' : '#ef4444'
    const bg = pct >= 100 ? 'rgba(163,230,53,0.08)' : pct >= 70 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)'
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold" style={{ background: bg, color }}>
        {pct >= 100 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        {pct.toFixed(1)}%
      </span>
    )
  }

  const DualProgressCard = ({ label, pctMeta, pctEsperada, actual, metaVal, esperadoVal, unit }: {
    label: string; pctMeta: number; pctEsperada: number; actual: string; metaVal: string; esperadoVal: string; unit?: string
  }) => {
    const colorMeta = pctMeta >= 100 ? 'bg-lime-400' : pctMeta >= 70 ? 'bg-yellow-500' : 'bg-red-500'
    const colorEsp = pctEsperada >= 100 ? 'bg-lime-400' : pctEsperada >= 70 ? 'bg-yellow-500' : 'bg-red-500'
    return (
      <div className={`rounded-xl border p-5 transition-all duration-300 ${pctMeta >= 100 ? 'border-lime-400/20 bg-lime-400/[0.03]' : 'border-[#1a1a1a] bg-[#0a0a0a]'}`}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-extrabold text-white">{label}</span>
          <span className={`text-[15px] font-extrabold ${pctMeta >= 100 ? 'text-lime-400' : 'text-white'}`}>{actual}</span>
        </div>
        <div className="space-y-3">
          {/* Meta mensal */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600">Meta mensal: {metaVal}</span>
              <span className={`text-[11px] font-extrabold ${pctMeta >= 100 ? 'text-lime-400' : 'text-zinc-400'}`}>{pctMeta.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
              <div className={`h-full rounded-full ${colorMeta} transition-all duration-700`} style={{ width: `${Math.min(pctMeta, 100)}%` }} />
            </div>
          </div>
          {/* Meta esperada hoje */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-700">Esperado hoje: {esperadoVal}</span>
              <span className={`text-[11px] font-extrabold ${pctEsperada >= 100 ? 'text-lime-400' : 'text-zinc-500'}`}>{pctEsperada.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
              <div className={`h-full rounded-full ${colorEsp} transition-all duration-700 opacity-60`} style={{ width: `${Math.min(pctEsperada, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/8 border border-lime-400/15">
            <Target size={18} className="text-lime-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Acompanhamento</h1>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">{bd} dias uteis — {bdElapsed} decorridos</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <a
            href="/diario"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-lime-400/10 border border-lime-400/20 px-5 py-2.5 text-[12px] font-extrabold text-lime-400 hover:bg-lime-400/15 transition-all cursor-pointer"
          >
            Meta Diaria
          </a>
          <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
          <div className="flex rounded-xl border border-[#1a1a1a] overflow-hidden">
            {NIVEIS.map((n) => (
              <button
                key={n}
                onClick={() => setSelectedNivel(n)}
                className={`px-3 py-2 text-[11px] font-bold transition-all cursor-pointer ${selectedNivel === n ? 'bg-lime-400/10 text-lime-400' : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.02]'}`}
              >
                {NIVEL_LABEL[n]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 size={28} className="animate-spin text-lime-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Carregando</span>
        </div>
      ) : (
        <>
          {/* OVERVIEW CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={`card p-5 ${closerTotal.meta > 0 && closerTotal.vendas >= closerTotal.meta ? 'border-lime-400/30 bg-gradient-to-br from-lime-400/8 to-transparent' : ''}`}>
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-1">Vendas vs Meta</p>
              <p className="text-xl font-extrabold text-lime-400">{fmtBRL(closerTotal.vendas)}</p>
              <p className="text-[10px] font-semibold text-zinc-600 mt-1">Meta: {fmtBRL(closerTotal.meta)}</p>
              <div className="w-full h-1.5 rounded-full bg-[#1a1a1a] mt-2">
                <div className={`h-full rounded-full transition-all duration-700 ${closerTotal.meta > 0 && closerTotal.vendas >= closerTotal.meta ? 'bg-lime-400' : 'bg-yellow-500'}`} style={{ width: `${Math.min(closerTotal.meta > 0 ? (closerTotal.vendas / closerTotal.meta) * 100 : 0, 100)}%` }} />
              </div>
            </div>
            <div className="card p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-1">Vendas vs Esperado</p>
              <p className={`text-xl font-extrabold ${closerTotal.vendas >= closerTotal.esperada ? 'text-lime-400' : 'text-red-400'}`}>
                {closerTotal.vendas >= closerTotal.esperada ? '+' : ''}{fmtBRL(closerTotal.vendas - closerTotal.esperada)}
              </p>
              <p className="text-[10px] font-semibold text-zinc-600 mt-1">Esperado: {fmtBRL(closerTotal.esperada)}</p>
            </div>
            <div className={`card p-5 ${sdrTotal.meta > 0 && sdrTotal.agend >= sdrTotal.meta ? 'border-lime-400/30 bg-gradient-to-br from-lime-400/8 to-transparent' : ''}`}>
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-1">Agend. vs Meta SDR</p>
              <p className="text-xl font-extrabold text-white">{sdrTotal.agend}</p>
              <p className="text-[10px] font-semibold text-zinc-600 mt-1">Meta: {sdrTotal.meta}</p>
              <div className="w-full h-1.5 rounded-full bg-[#1a1a1a] mt-2">
                <div className={`h-full rounded-full transition-all duration-700 ${sdrTotal.meta > 0 && sdrTotal.agend >= sdrTotal.meta ? 'bg-lime-400' : 'bg-yellow-500'}`} style={{ width: `${Math.min(sdrTotal.meta > 0 ? (sdrTotal.agend / sdrTotal.meta) * 100 : 0, 100)}%` }} />
              </div>
            </div>
            <div className="card p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-1">Agend. vs Esperado</p>
              <p className={`text-xl font-extrabold ${sdrTotal.agend >= sdrTotal.esperada ? 'text-lime-400' : 'text-red-400'}`}>
                {sdrTotal.agend >= sdrTotal.esperada ? '+' : ''}{(sdrTotal.agend - sdrTotal.esperada).toFixed(0)}
              </p>
              <p className="text-[10px] font-semibold text-zinc-600 mt-1">Esperado: {sdrTotal.esperada.toFixed(0)}</p>
            </div>
          </div>

          {/* CLOSER PROGRESS */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Users size={15} className="text-lime-400" />
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Progresso Closers — Vendas</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {closerStats.map((c) => (
                <DualProgressCard
                  key={c.id}
                  label={c.name}
                  pctMeta={c.pctMeta}
                  pctEsperada={c.pctEsperada}
                  actual={fmtBRL(c.vendas)}
                  metaVal={fmtBRL(c.metaMensal)}
                  esperadoVal={fmtBRL(c.metaEsperada)}
                />
              ))}
            </div>
          </div>

          {/* SDR PROGRESS — REUNIOES */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Headphones size={15} className="text-lime-400" />
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Progresso SDRs — Reunioes</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sdrStats.map((s) => (
                <DualProgressCard
                  key={s.id}
                  label={s.name}
                  pctMeta={s.pctMetaReun}
                  pctEsperada={s.pctReunEsperada}
                  actual={String(s.reun)}
                  metaVal={String(s.metaReunMensal)}
                  esperadoVal={s.metaReunEsperada.toFixed(0)}
                />
              ))}
            </div>
          </div>

          {/* CLOSER DETAILED TABLE */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1a1a1a] flex items-center gap-2.5">
              <Trophy size={15} className="text-lime-400" />
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Detalhamento Closers</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <th className={`text-left ${th}`}>#</th>
                    <th className={`text-left ${th}`}>Closer</th>
                    <th className={`text-right ${th}`}>Meta</th>
                    <th className={`text-right ${th}`}>Esperado</th>
                    <th className={`text-right ${th}`}>Vendas</th>
                    <th className={`text-right ${th}`}>% Meta</th>
                    <th className={`text-right ${th}`}>% Esperado</th>
                    <th className={`text-right ${th}`}>Reunioes</th>
                    <th className={`text-right ${th}`}>Conversao</th>
                    <th className={`text-right ${th}`}>Ticket</th>
                  </tr>
                </thead>
                <tbody>
                  {closerStats.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #1a1a1a' }} className="hover:bg-white/[0.02] transition-colors">
                      <td className={td}>
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold" style={{ background: i === 0 ? 'rgba(163,230,53,0.12)' : '#1a1a1a', color: i === 0 ? '#A3E635' : '#71717a' }}>{i + 1}</span>
                      </td>
                      <td className={`${td} font-extrabold text-white`}>{c.name}</td>
                      <td className={`${td} text-right font-semibold text-zinc-500`}>{fmtBRL(c.metaMensal)}</td>
                      <td className={`${td} text-right font-semibold text-zinc-500`}>{fmtBRL(c.metaEsperada)}</td>
                      <td className={`${td} text-right font-extrabold text-lime-400`}>{fmtBRL(c.vendas)}</td>
                      <td className={`${td} text-right`}><StatusBadge pct={c.pctMeta} /></td>
                      <td className={`${td} text-right`}><StatusBadge pct={c.pctEsperada} /></td>
                      <td className={`${td} text-right font-semibold text-zinc-300`}>{c.reunioes}</td>
                      <td className={`${td} text-right font-semibold text-zinc-300`}>{c.conversao.toFixed(1)}%</td>
                      <td className={`${td} text-right font-semibold text-zinc-300`}>{fmtBRL(c.ticketMedio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SDR DETAILED TABLE */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1a1a1a] flex items-center gap-2.5">
              <Headphones size={15} className="text-lime-400" />
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Detalhamento SDRs</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <th className={`text-left ${th}`}>#</th>
                    <th className={`text-left ${th}`}>SDR</th>
                    <th className={`text-right ${th}`}>Meta Agend</th>
                    <th className={`text-right ${th}`}>Esp. Agend</th>
                    <th className={`text-right ${th}`}>Agend.</th>
                    <th className={`text-right ${th}`}>% Meta Ag</th>
                    <th className={`text-right ${th}`}>% Esp. Ag</th>
                    <th className={`text-right ${th}`}>Meta Reun</th>
                    <th className={`text-right ${th}`}>Reunioes</th>
                    <th className={`text-right ${th}`}>% Meta Re</th>
                    <th className={`text-right ${th}`}>% Reuniao</th>
                    <th className={`text-right ${th}`}>No-Show</th>
                    <th className={`text-right ${th}`}>% No-Show</th>
                    <th className={`text-right ${th}`}>Vendas R$</th>
                  </tr>
                </thead>
                <tbody>
                  {sdrStats.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #1a1a1a' }} className="hover:bg-white/[0.02] transition-colors">
                      <td className={td}>
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold" style={{ background: i === 0 ? 'rgba(163,230,53,0.12)' : '#1a1a1a', color: i === 0 ? '#A3E635' : '#71717a' }}>{i + 1}</span>
                      </td>
                      <td className={`${td} font-extrabold text-white`}>{s.name}</td>
                      <td className={`${td} text-right font-semibold text-zinc-500`}>{s.metaMensal}</td>
                      <td className={`${td} text-right font-semibold text-zinc-500`}>{s.metaEsperada.toFixed(0)}</td>
                      <td className={`${td} text-right font-extrabold text-white`}>{s.agend}</td>
                      <td className={`${td} text-right`}><StatusBadge pct={s.pctMeta} /></td>
                      <td className={`${td} text-right`}><StatusBadge pct={s.pctEsperada} /></td>
                      <td className={`${td} text-right font-semibold text-zinc-500`}>{s.metaReunMensal}</td>
                      <td className={`${td} text-right font-semibold text-zinc-300`}>{s.reun}</td>
                      <td className={`${td} text-right`}>{s.metaReunMensal > 0 ? <StatusBadge pct={s.pctMetaReun} /> : <span className="text-zinc-600">—</span>}</td>
                      <td className={`${td} text-right font-semibold text-zinc-300`}>{s.taxaReuniao.toFixed(1)}%</td>
                      <td className={`${td} text-right font-semibold text-zinc-300`}>{s.noshow}</td>
                      <td className={`${td} text-right font-semibold text-zinc-300`}>{s.taxaNoshow.toFixed(1)}%</td>
                      <td className={`${td} text-right font-extrabold text-lime-400`}>{fmtBRL(s.vendas)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
