'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import { Loader2, Download, FileText, BarChart3, Filter } from 'lucide-react'

interface GestaoDocument {
  id: number
  closer_id: number | null
  closer_name: string
  tipo: 'pdd' | 'relatorio-calls'
  data_call: string
  file_name: string
  file_url: string
  nota_media: number | null
  total_calls: number | null
  fechamentos: number | null
  created_at: string
}

interface Closer {
  id: number
  name: string
}

const TIPO_LABEL: Record<string, string> = {
  'pdd': 'PDD',
  'relatorio-calls': 'Relatorio Calls',
}

function getCurrentMonth() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export default function RelatoriosPage() {
  const [documents, setDocuments] = useState<GestaoDocument[]>([])
  const [closers, setClosers] = useState<Closer[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedCloser, setSelectedCloser] = useState<number | 'todos'>('todos')
  const [selectedTipo, setSelectedTipo] = useState<string>('todos')
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const supabase = getSupabase()

    const [y, m] = selectedMonth.split('-').map(Number)
    const daysInMonth = new Date(y, m, 0).getDate()
    const startDate = `${selectedMonth}-01`
    const endDate = `${selectedMonth}-${String(daysInMonth).padStart(2, '0')}`

    let query = supabase
      .from('gestao_documents')
      .select('*')
      .gte('data_call', startDate)
      .lte('data_call', endDate)
      .order('data_call', { ascending: false })

    if (selectedTipo !== 'todos') {
      query = query.eq('tipo', selectedTipo)
    }

    if (selectedCloser !== 'todos') {
      query = query.eq('closer_id', selectedCloser)
    }

    const [docRes, closerRes] = await Promise.all([
      query,
      supabase.from('closers').select('*').order('name'),
    ])

    setDocuments((docRes.data ?? []) as GestaoDocument[])
    setClosers((closerRes.data ?? []) as Closer[])
    setLoading(false)
  }, [selectedMonth, selectedTipo, selectedCloser])

  useEffect(() => { fetchAll() }, [fetchAll])

  const th = "py-3.5 px-4 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-600"
  const td = "py-3 px-4 text-[13px]"

  const totalCalls = documents.reduce((acc, d) => acc + (d.total_calls || 0), 0)
  const totalFechamentos = documents.reduce((acc, d) => acc + (d.fechamentos || 0), 0)
  const avgNota = documents.length > 0
    ? documents.reduce((acc, d) => acc + (d.nota_media || 0), 0) / documents.filter(d => d.nota_media != null).length
    : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/8 border border-lime-400/15">
            <FileText size={18} className="text-lime-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Relatorios</h1>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">PDDs e Relatorios de Calls</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Month picker */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-xl border border-[#222222] bg-[#111111] px-4 py-2.5 text-[12px] font-bold text-white outline-none focus:border-lime-400/30 transition-colors cursor-pointer"
          />

          {/* Tipo filter */}
          <select
            value={selectedTipo}
            onChange={(e) => setSelectedTipo(e.target.value)}
            className="rounded-xl border border-[#222222] bg-[#111111] px-4 py-2.5 text-[12px] font-bold text-white outline-none focus:border-lime-400/30 transition-colors cursor-pointer appearance-none"
          >
            <option value="todos">Todos os tipos</option>
            <option value="pdd">PDD</option>
            <option value="relatorio-calls">Relatorio Calls</option>
          </select>

          {/* Closer filter */}
          <select
            value={selectedCloser}
            onChange={(e) => setSelectedCloser(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
            className="rounded-xl border border-[#222222] bg-[#111111] px-4 py-2.5 text-[12px] font-bold text-white outline-none focus:border-lime-400/30 transition-colors cursor-pointer appearance-none"
          >
            <option value="todos">Todos os closers</option>
            {closers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 size={28} className="animate-spin text-lime-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Carregando</span>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-1">Documentos</p>
              <p className="text-xl font-extrabold text-white">{documents.length}</p>
            </div>
            <div className="card p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-1">Total Calls</p>
              <p className="text-xl font-extrabold text-white">{totalCalls}</p>
            </div>
            <div className="card p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-1">Fechamentos</p>
              <p className="text-xl font-extrabold text-lime-400">{totalFechamentos}</p>
            </div>
            <div className="card p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-1">Nota Media</p>
              <p className="text-xl font-extrabold text-white">{avgNota > 0 ? avgNota.toFixed(1) : '—'}</p>
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-[#222222] flex items-center gap-2.5">
              <BarChart3 size={15} className="text-lime-400" />
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                {documents.length} relatorio{documents.length !== 1 ? 's' : ''} encontrado{documents.length !== 1 ? 's' : ''}
              </p>
            </div>

            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <FileText size={32} className="text-zinc-700" />
                <p className="text-[13px] font-semibold text-zinc-600">Nenhum relatorio encontrado</p>
                <p className="text-[11px] text-zinc-700">Ajuste os filtros ou selecione outro periodo</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #222222' }}>
                      <th className={`text-left ${th}`}>Tipo</th>
                      <th className={`text-left ${th}`}>Closer</th>
                      <th className={`text-left ${th}`}>Data</th>
                      <th className={`text-right ${th}`}>Nota Media</th>
                      <th className={`text-right ${th}`}>Calls</th>
                      <th className={`text-right ${th}`}>Fechamentos</th>
                      <th className={`text-center ${th}`}>Arquivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id} style={{ borderBottom: '1px solid #222222' }} className="hover:bg-white/[0.02] transition-colors">
                        <td className={td}>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                            doc.tipo === 'pdd'
                              ? 'bg-lime-400/8 text-lime-400 border border-lime-400/15'
                              : 'bg-blue-400/8 text-blue-400 border border-blue-400/15'
                          }`}>
                            {doc.tipo === 'pdd' ? <FileText size={11} /> : <BarChart3 size={11} />}
                            {TIPO_LABEL[doc.tipo] || doc.tipo}
                          </span>
                        </td>
                        <td className={`${td} font-extrabold text-white`}>{doc.closer_name}</td>
                        <td className={`${td} font-semibold text-zinc-400`}>{formatDate(doc.data_call)}</td>
                        <td className={`${td} text-right font-semibold`}>
                          {doc.nota_media != null ? (
                            <span className={doc.nota_media >= 7 ? 'text-lime-400' : doc.nota_media >= 5 ? 'text-yellow-500' : 'text-red-400'}>
                              {doc.nota_media.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                        <td className={`${td} text-right font-semibold text-zinc-300`}>{doc.total_calls ?? '—'}</td>
                        <td className={`${td} text-right font-semibold text-zinc-300`}>{doc.fechamentos ?? '—'}</td>
                        <td className={`${td} text-center`}>
                          {doc.file_url ? (
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lime-400/8 border border-lime-400/15 text-[11px] font-bold text-lime-400 hover:bg-lime-400/15 transition-all"
                            >
                              <Download size={12} />
                              Abrir
                            </a>
                          ) : (
                            <span className="text-zinc-600 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
