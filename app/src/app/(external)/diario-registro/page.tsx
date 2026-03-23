'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { Plus, Trash2, Loader2, Check } from 'lucide-react'

interface Closer { id: number; name: string }
interface DailyEntry { id: string; closer_id: number; valor: number; created_at: string }

const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function DiarioRegistroPage() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [closers, setClosers] = useState<Closer[]>([])
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [formCloser, setFormCloser] = useState<number | ''>('')
  const [formValor, setFormValor] = useState<number | ''>('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = getSupabase()
      const { data: closersData } = await supabase.from('closers').select('id, name').order('name')
      setClosers((closersData ?? []) as Closer[])

      // Load today's entries from Supabase
      const { data: entriesData } = await supabase
        .from('vendas_diarias')
        .select('id, closer_id, valor, created_at')
        .eq('data', today)
        .order('created_at', { ascending: true })
      setEntries((entriesData ?? []) as DailyEntry[])
      setLoading(false)
    }
    load()
  }, [today])

  const addEntry = async () => {
    if (!formCloser || !formValor) return
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('vendas_diarias')
      .insert({ closer_id: Number(formCloser), valor: Number(formValor), data: today })
      .select('id, closer_id, valor, created_at')
      .single()

    if (!error && data) {
      setEntries((prev) => [...prev, data as DailyEntry])
      setFormCloser('')
      setFormValor('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const removeEntry = async (id: string) => {
    const supabase = getSupabase()
    await supabase.from('vendas_diarias').delete().eq('id', id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const closerMap = new Map(closers.map((c) => [c.id, c.name]))
  const totalDia = entries.reduce((s, e) => s + e.valor, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-lime-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-[#222222] bg-black">
        <div className="max-w-xl mx-auto px-5 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-zape.svg" alt="Zape" className="h-8" />
            <div>
              <span className="text-lg font-extrabold text-white tracking-tight">Registrar Venda</span>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-700">{today.split('-').reverse().join('/')}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 py-8 space-y-6">
        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-2">Closer</label>
            <select value={formCloser} onChange={(e) => setFormCloser(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-2xl border border-[#222222] bg-[#111111] px-5 py-4 text-[15px] font-bold text-white outline-none focus:border-lime-400/30 transition-colors [color-scheme:dark] cursor-pointer">
              <option value="">Selecione o closer...</option>
              {closers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-2">Valor da Venda</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[15px] font-bold text-zinc-600">R$</span>
              <input
                type="number" value={formValor} onChange={(e) => setFormValor(e.target.value === '' ? '' : Number(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && addEntry()}
                placeholder="0,00"
                className="w-full rounded-2xl border border-[#222222] bg-[#111111] pl-12 pr-5 py-4 text-[22px] font-extrabold text-white outline-none focus:border-lime-400/30 transition-colors"
              />
            </div>
          </div>
          <button onClick={addEntry} disabled={!formCloser || !formValor}
            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-lime-400 py-4 text-[15px] font-extrabold text-black hover:bg-lime-300 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
            {saved ? <><Check size={20} /> Registrado!</> : <><Plus size={20} /> Registrar Venda</>}
          </button>
        </div>

        {/* Entries */}
        {entries.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Vendas de hoje</p>
            {[...entries].reverse().map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-2xl border border-[#222222] bg-[#111111] px-5 py-4">
                <div>
                  <p className="text-[14px] font-extrabold text-white">{closerMap.get(e.closer_id)}</p>
                  <p className="text-[18px] font-extrabold text-lime-400">{fmtBRL(e.valor)}</p>
                </div>
                <button onClick={() => removeEntry(e.id)} className="rounded-xl p-3 text-zinc-700 hover:text-red-400 hover:bg-red-400/5 transition-colors cursor-pointer">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between pt-4 border-t border-[#222222]">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-600">Total — {entries.length} venda{entries.length !== 1 ? 's' : ''}</span>
              <span className="text-[20px] font-extrabold text-lime-400">{fmtBRL(totalDia)}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
