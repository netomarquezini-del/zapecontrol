'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import { Loader2, Download, FileText, BarChart3, TrendingUp } from 'lucide-react'
import { MonthPicker } from '@/components/date-picker'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

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

const TIPO_LABEL: Record<string, string> = {
  'pdd': 'PDD',
  'relatorio-calls': 'Relatório Calls',
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
  const [closerNames, setCloserNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedCloser, setSelectedCloser] = useState<string>('todos')
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
      query = query.eq('closer_name', selectedCloser)
    }

    const { data } = await query
    const docs = (data ?? []) as GestaoDocument[]
    setDocuments(docs)

    // Extrair nomes unicos de closers dos documentos carregados (sem filtro de closer)
    // Para isso, busca sem filtro de closer para preencher o dropdown
    if (selectedCloser === 'todos') {
      const names = [...new Set(docs.map(d => d.closer_name))].sort()
      setCloserNames(prev => {
        const merged = [...new Set([...prev, ...names])].sort()
        return merged
      })
    }

    setLoading(false)
  }, [selectedMonth, selectedTipo, selectedCloser])

  // Carregar nomes de closers na primeira carga (sem filtro)
  useEffect(() => {
    async function loadCloserNames() {
      const supabase = getSupabase()
      const { data } = await supabase
        .from('gestao_documents')
        .select('closer_name')
      if (data) {
        const names = [...new Set(data.map((d: { closer_name: string }) => d.closer_name))].sort()
        setCloserNames(names)
      }
    }
    loadCloserNames()
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const th = "py-3.5 px-4 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-600"
  const td = "py-3 px-4 text-[13px]"

  const totalCalls = documents.reduce((acc, d) => acc + (d.total_calls || 0), 0)
  const totalFechamentos = documents.reduce((acc, d) => acc + (d.fechamentos || 0), 0)
  const docsWithNota = documents.filter(d => d.nota_media != null && d.nota_media > 0)
  const avgNota = docsWithNota.length > 0
    ? docsWithNota.reduce((acc, d) => acc + (d.nota_media || 0), 0) / docsWithNota.length
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
            <h1 className="text-xl font-extrabold text-white tracking-tight">Relatórios</h1>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">PDDs e Relatórios de Calls</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />

          <select
            value={selectedTipo}
            onChange={(e) => setSelectedTipo(e.target.value)}
            className="rounded-xl border border-[#222222] bg-[#111111] px-4 py-2.5 text-[12px] font-bold text-white outline-none focus:border-lime-400/30 transition-colors cursor-pointer appearance-none"
          >
            <option value="todos">Todos os tipos</option>
            <option value="pdd">PDD</option>
            <option value="relatorio-calls">Relatório Calls</option>
          </select>

          <select
            value={selectedCloser}
            onChange={(e) => setSelectedCloser(e.target.value)}
            className="rounded-xl border border-[#222222] bg-[#111111] px-4 py-2.5 text-[12px] font-bold text-white outline-none focus:border-lime-400/30 transition-colors cursor-pointer appearance-none"
          >
            <option value="todos">Todos os closers</option>
            {closerNames.map((name) => (
              <option key={name} value={name}>{name}</option>
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
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-1">Nota Média</p>
              <p className="text-xl font-extrabold text-white">{avgNota > 0 ? avgNota.toFixed(1) : '—'}</p>
            </div>
          </div>

          {/* Chart — Evolução da Nota por Closer */}
          {(() => {
            // Agrupar por data + closer (usando relatorio-calls pra nao duplicar com PDD)
            const callDocs = documents.filter(d => d.tipo === 'relatorio-calls' && d.nota_media && d.nota_media > 0)
            const dates = [...new Set(callDocs.map(d => d.data_call))].sort()
            const closersInDocs = [...new Set(callDocs.map(d => d.closer_name))].sort()
            const COLORS = ['#A3E635', '#60A5FA', '#F59E0B', '#EF4444', '#A78BFA']

            if (dates.length < 2) return null

            const chartData = dates.map(date => {
              const row: Record<string, string | number> = { date: date.substring(8, 10) + '/' + date.substring(5, 7) }
              closersInDocs.forEach(closer => {
                const doc = callDocs.find(d => d.data_call === date && d.closer_name === closer)
                if (doc) row[closer] = Number(doc.nota_media)
              })
              return row
            })

            return (
              <div className="card p-6">
                <div className="flex items-center gap-2.5 mb-6">
                  <TrendingUp size={15} className="text-lime-400" />
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                    Evolução da Nota por Closer
                  </h3>
                </div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#666', fontSize: 11, fontWeight: 600 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 10]}
                        tick={{ fill: '#666', fontSize: 11, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(10,10,10,0.95)',
                          border: '1px solid #222',
                          borderRadius: '12px',
                          padding: '10px 14px',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                        labelStyle={{ color: '#666', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}
                        itemStyle={{ padding: '2px 0' }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '12px' }}
                      />
                      {closersInDocs.map((closer, i) => (
                        <Line
                          key={closer}
                          type="monotone"
                          dataKey={closer}
                          stroke={COLORS[i % COLORS.length]}
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: COLORS[i % COLORS.length], strokeWidth: 0 }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )
          })()}

          {/* Table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-[#222222] flex items-center gap-2.5">
              <BarChart3 size={15} className="text-lime-400" />
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                {documents.length} relatório{documents.length !== 1 ? 's' : ''} encontrado{documents.length !== 1 ? 's' : ''}
              </p>
            </div>

            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <FileText size={32} className="text-zinc-700" />
                <p className="text-[13px] font-semibold text-zinc-600">Nenhum relatório encontrado</p>
                <p className="text-[11px] text-zinc-700">Ajuste os filtros ou selecione outro período</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #222222' }}>
                      <th className={`text-left ${th}`}>Tipo</th>
                      <th className={`text-left ${th}`}>Closer</th>
                      <th className={`text-left ${th}`}>Data</th>
                      <th className={`text-right ${th}`}>Nota</th>
                      <th className={`text-right ${th}`}>Calls</th>
                      <th className={`text-right ${th}`}>Fech.</th>
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
                          {doc.nota_media != null && doc.nota_media > 0 ? (
                            <span className={doc.nota_media >= 7 ? 'text-lime-400' : doc.nota_media >= 5 ? 'text-yellow-500' : 'text-red-400'}>
                              {Number(doc.nota_media).toFixed(1)}
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
