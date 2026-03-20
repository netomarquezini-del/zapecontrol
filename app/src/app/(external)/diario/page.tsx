'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { Zap, Loader2, Plus } from 'lucide-react'
import Gauge from '@/components/gauge'

interface MetaMensal { id: number; nivel: string; meta_diaria_vendas: number }
interface MetaCloser { id: number; mes_id: number; closer_id: number; meta_diaria: number }
interface Closer { id: number; name: string }
interface DailyEntry { id: string; closer_id: number; valor: number; timestamp: number }

const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const NIVEL_COLORS: Record<string, string> = { minima: '#52525b', super: '#84CC16', ultra: '#A3E635', black: '#D9F99D' }
const NIVEL_ORDER = ['minima', 'super', 'ultra', 'black']

function getCurrentMonth() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

function getStorageKey() {
  return `zape-diario-${format(new Date(), 'yyyy-MM-dd')}`
}

export default function DiarioPage() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [loading, setLoading] = useState(true)
  const [metas, setMetas] = useState<MetaMensal[]>([])
  const [closerMetas, setCloserMetas] = useState<MetaCloser[]>([])
  const [closers, setClosers] = useState<Closer[]>([])
  const [entries, setEntries] = useState<DailyEntry[]>([])

  const fetchMetas = useCallback(async () => {
    setLoading(true)
    const supabase = getSupabase()
    const month = getCurrentMonth()
    const [metasRes, closersRes, cmRes] = await Promise.all([
      supabase.from('metas_mensais').select('id, nivel, meta_diaria_vendas').eq('mes', month),
      supabase.from('closers').select('id, name').order('name'),
      supabase.from('metas_closers').select('*'),
    ])
    const ms = (metasRes.data ?? []) as MetaMensal[]
    const cls = (closersRes.data ?? []) as Closer[]
    const mesIds = new Set(ms.map((m) => m.id))
    setMetas(ms.sort((a, b) => NIVEL_ORDER.indexOf(a.nivel) - NIVEL_ORDER.indexOf(b.nivel)))
    setClosers(cls)
    setCloserMetas(((cmRes.data ?? []) as MetaCloser[]).filter((cm) => mesIds.has(cm.mes_id)))
    setLoading(false)
  }, [])

  // Poll localStorage every 3 seconds for live updates from registro page
  useEffect(() => {
    const load = () => {
      const stored = localStorage.getItem(getStorageKey())
      if (stored) setEntries(JSON.parse(stored))
      else setEntries([])
    }
    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => { fetchMetas() }, [fetchMetas])

  const totalDia = entries.reduce((s, e) => s + e.valor, 0)
  const closerMap = new Map(closers.map((c) => [c.id, c.name]))

  // Gauge levels
  const gaugeLevels = metas.map((m) => ({
    label: m.nivel.charAt(0).toUpperCase() + m.nivel.slice(1),
    value: m.meta_diaria_vendas,
    color: NIVEL_COLORS[m.nivel] || '#71717a',
  }))
  const maxMeta = gaugeLevels.length > 0 ? Math.max(...gaugeLevels.map((l) => l.value), totalDia * 1.05) : totalDia * 1.2 || 10000

  // Per-closer
  const closerStats = closers.map((c) => {
    const total = entries.filter((e) => e.closer_id === c.id).reduce((s, e) => s + e.valor, 0)
    const numVendas = entries.filter((e) => e.closer_id === c.id).length
    const cLevels = metas.map((m) => {
      const cm = closerMetas.find((cm) => cm.closer_id === c.id && cm.mes_id === m.id)
      return { label: m.nivel.charAt(0).toUpperCase() + m.nivel.slice(1), value: cm?.meta_diaria || 0, color: NIVEL_COLORS[m.nivel] || '#71717a' }
    }).filter((l) => l.value > 0)
    const cMax = cLevels.length > 0 ? Math.max(...cLevels.map((l) => l.value), total * 1.05) : total * 1.2 || 5000
    return { ...c, total, numVendas, levels: cLevels, max: cMax }
  }).filter((c) => c.total > 0 || c.levels.length > 0).sort((a, b) => b.total - a.total)

  // Recent entries (last 5)
  const recentEntries = [...entries].reverse().slice(0, 5)

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 size={32} className="animate-spin text-lime-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] bg-black">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/10 border border-lime-400/20">
              <Zap size={18} className="text-lime-400" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-white tracking-tight">ZAPE</span>
                <span className="text-base font-thin text-zinc-600">control</span>
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                Meta Diaria — {today.split('-').reverse().join('/')}
              </p>
            </div>
          </div>
          <a
            href="/diario-registro"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-lime-400 px-6 py-3 text-[13px] font-extrabold text-black hover:bg-lime-300 transition-all cursor-pointer"
          >
            <Plus size={16} /> Registrar Venda
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* TOP ROW: Main gauge + Recent entries */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Gauge */}
          <div className="lg:col-span-2 rounded-2xl border border-[#1a1a1a] bg-[#050505] p-8 flex flex-col items-center justify-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-600 mb-8">Meta Geral do Dia</p>
            <Gauge
              value={totalDia}
              max={maxMeta}
              levels={gaugeLevels}
              size={320}
              label={`${entries.length} venda${entries.length !== 1 ? 's' : ''} hoje`}
              formatValue={fmtBRL}
            />
            {/* Level legend */}
            <div className="flex items-center gap-8 mt-10">
              {gaugeLevels.map((l) => (
                <div key={l.label} className="flex items-center gap-3 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3">
                  <div className="w-4 h-4 rounded-full" style={{ background: l.color, boxShadow: `0 0 10px ${l.color}40` }} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">{l.label}</p>
                    <p className="text-[15px] font-black text-white">{fmtBRL(l.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent entries */}
          <div className="rounded-2xl border border-[#1a1a1a] bg-[#050505] p-6 flex flex-col">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-600 mb-5">Ultimas Vendas</p>
            {recentEntries.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[13px] font-semibold text-zinc-700">Nenhuma venda registrada</p>
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {recentEntries.map((e) => (
                  <div key={e.id} className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3">
                    <p className="text-[12px] font-bold text-zinc-400">{closerMap.get(e.closer_id)}</p>
                    <p className="text-[20px] font-extrabold text-lime-400">{fmtBRL(e.valor)}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-[#1a1a1a] pt-4 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">{entries.length} venda{entries.length !== 1 ? 's' : ''}</span>
                <span className="text-[22px] font-extrabold text-lime-400">{fmtBRL(totalDia)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CLOSER GAUGES */}
        {closerStats.length > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-600 mb-6">Meta por Closer</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {closerStats.map((c) => (
                <div key={c.id} className={`rounded-2xl border p-6 flex flex-col items-center transition-all duration-500 ${
                  c.levels.length > 0 && c.total >= c.levels[c.levels.length - 1].value
                    ? 'border-lime-400/30 bg-gradient-to-b from-lime-400/[0.06] to-transparent'
                    : 'border-[#1a1a1a] bg-[#050505]'
                }`}>
                  <p className="text-[14px] font-extrabold text-white mb-1">{c.name}</p>
                  <p className="text-[11px] font-bold text-zinc-600 mb-4">{c.numVendas} venda{c.numVendas !== 1 ? 's' : ''}</p>
                  {c.levels.length > 0 ? (
                    <Gauge value={c.total} max={c.max} levels={c.levels} size={200} formatValue={fmtBRL} />
                  ) : (
                    <div className="py-6">
                      <p className="text-3xl font-extrabold text-lime-400">{fmtBRL(c.total)}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
