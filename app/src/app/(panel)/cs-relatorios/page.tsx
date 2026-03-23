'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import {
  FileText,
  Loader2,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface CsReport {
  id: number
  type: string
  title: string
  file_url: string | null
  summary: string | null
  data: Record<string, unknown> | null
  period_start: string | null
  period_end: string | null
  created_at: string
}

type FilterTab = 'all' | 'daily' | 'weekly'

export default function CsRelatoriosPage() {
  const [reports, setReports] = useState<CsReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    const supabase = getSupabase()
    let query = supabase
      .from('cs_reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter === 'daily') query = query.eq('type', 'daily')
    if (filter === 'weekly') query = query.eq('type', 'weekly')

    const { data } = await query
    setReports(data ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'daily', label: 'Diários' },
    { key: 'weekly', label: 'Semanais' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/8 border border-lime-400/15">
            <FileText size={18} className="text-lime-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Relatórios CS</h1>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
              Joana — Relatórios Diários e Semanais
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-xl px-4 py-2 text-[13px] font-bold transition-all cursor-pointer border ${
              filter === tab.key
                ? 'bg-lime-400/10 border-lime-400/20 text-lime-400'
                : 'bg-[#111111] border-[#222222] text-zinc-500 hover:text-zinc-200 hover:border-zinc-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={28} className="animate-spin text-lime-400" />
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-[#222222] bg-[#111111] px-5 py-16 text-center">
          <FileText size={32} className="mx-auto mb-4 text-zinc-700" />
          <p className="text-[13px] font-semibold text-zinc-600">
            Nenhum relatório gerado ainda. Os relatórios são gerados automaticamente às 18:30.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const isExpanded = expandedId === report.id
            return (
              <div
                key={report.id}
                className="rounded-2xl border border-[#222222] bg-[#111111] hover:border-lime-400/10 transition-all overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
                  {/* Type Badge */}
                  <span
                    className={`inline-flex self-start items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                      report.type === 'daily'
                        ? 'text-blue-400 bg-blue-400/8 border-blue-400/15'
                        : 'text-purple-400 bg-purple-400/8 border-purple-400/15'
                    }`}
                  >
                    {report.type === 'daily' ? 'Diário' : 'Semanal'}
                  </span>

                  {/* Title & Date */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate">{report.title}</p>
                    <p className="text-[11px] font-semibold text-zinc-600 mt-0.5">
                      {formatDate(report.created_at)}
                      {report.period_start && report.period_end && (
                        <span className="ml-2">
                          • {formatDate(report.period_start)} — {formatDate(report.period_end)}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {report.file_url && (
                      <a
                        href={report.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-xl bg-lime-400/10 border border-lime-400/20 px-4 py-2 text-[12px] font-bold text-lime-400 hover:bg-lime-400/15 transition-all"
                      >
                        <Download size={14} />
                        PDF
                      </a>
                    )}
                    {report.data && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : report.id)}
                        className="flex items-center gap-2 rounded-xl bg-[#1a1a1a] border border-[#222222] px-4 py-2 text-[12px] font-bold text-zinc-400 hover:text-white hover:border-zinc-600 transition-all cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {isExpanded ? 'Fechar' : 'Ver'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Summary Preview */}
                {report.summary && !isExpanded && (
                  <div className="px-5 pb-4 -mt-1">
                    <p className="text-[12px] font-medium text-zinc-500 line-clamp-2">{report.summary}</p>
                  </div>
                )}

                {/* Expanded Data */}
                {isExpanded && (
                  <div className="border-t border-[#222222] px-5 py-4 space-y-3">
                    {report.summary && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-1.5">
                          Resumo
                        </span>
                        <p className="text-[13px] font-medium text-zinc-300 whitespace-pre-wrap">{report.summary}</p>
                      </div>
                    )}
                    {report.data && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-1.5">
                          Dados
                        </span>
                        <pre className="rounded-xl bg-black/50 border border-[#222222] p-4 text-[11px] font-mono text-zinc-400 overflow-x-auto max-h-96 overflow-y-auto">
                          {JSON.stringify(report.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
