'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Mic,
  Brain,
  Star,
  TrendingUp,
  MessageSquare,
  ArrowRight,
} from 'lucide-react'
import type { SdrTranscriptionStatus } from '@/lib/types-sdr'

interface Objection {
  objection: string
  handling: string
  quality: 'good' | 'average' | 'poor'
}

interface TranscriptionData {
  id: string
  call_id: string
  status: SdrTranscriptionStatus
  transcription_text: string | null
  ai_summary: string | null
  ai_sentiment: {
    objections: Objection[]
    improvements: string[]
  } | null
  ai_score: number | null
  ai_next_steps: string | null
  language: string | null
  duration_seconds: number | null
  word_count: number | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

interface TranscriptionViewProps {
  callId: string
}

const STATUS_CONFIG: Record<
  SdrTranscriptionStatus,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  pending: {
    label: 'Pendente',
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10',
    icon: <Clock size={14} />,
  },
  transcribing: {
    label: 'Transcrevendo',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    icon: <Mic size={14} />,
  },
  analyzing: {
    label: 'Analisando',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    icon: <Brain size={14} />,
  },
  completed: {
    label: 'Concluido',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    icon: <CheckCircle2 size={14} />,
  },
  error: {
    label: 'Erro',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    icon: <AlertCircle size={14} />,
  },
}

function getScoreColor(score: number): { text: string; bg: string; border: string } {
  if (score < 4) return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' }
  if (score < 7)
    return { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' }
  return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' }
}

function getQualityBadge(quality: 'good' | 'average' | 'poor') {
  const config = {
    good: { label: 'Bom', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    average: { label: 'Medio', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    poor: { label: 'Ruim', color: 'text-red-400', bg: 'bg-red-500/10' },
  }
  return config[quality]
}

export default function TranscriptionView({ callId }: TranscriptionViewProps) {
  const [data, setData] = useState<TranscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [showFullText, setShowFullText] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTranscription = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch(`/api/sdr/transcriptions/${callId}`)
      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Erro ao buscar transcricao')
        return
      }

      if (json.data) {
        setData(json.data)

        // If still processing, poll again
        if (json.data.status === 'transcribing' || json.data.status === 'analyzing') {
          setTimeout(fetchTranscription, 3000)
        }
      } else {
        setData(null)
      }
    } catch {
      setError('Erro de conexao')
    } finally {
      setLoading(false)
    }
  }, [callId])

  useEffect(() => {
    fetchTranscription()
  }, [fetchTranscription])

  async function handleProcess() {
    setProcessing(true)
    setError(null)
    try {
      const res = await fetch('/api/sdr/transcriptions/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_id: callId }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Erro ao processar')
        return
      }

      // Start polling for updates
      setLoading(true)
      fetchTranscription()
    } catch {
      setError('Erro de conexao')
    } finally {
      setProcessing(false)
    }
  }

  async function handleReprocess() {
    setProcessing(true)
    setError(null)
    try {
      const res = await fetch('/api/sdr/transcriptions/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_id: callId, force: true }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Erro ao reprocessar')
        return
      }

      setLoading(true)
      fetchTranscription()
    } catch {
      setError('Erro de conexao')
    } finally {
      setProcessing(false)
    }
  }

  // Loading state
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-zinc-500" />
        <span className="ml-2 text-sm text-zinc-500">Carregando...</span>
      </div>
    )
  }

  // No transcription exists
  if (!data) {
    return (
      <div className="rounded-lg border border-[#222222] bg-[#111111] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-500">
            <Mic size={16} />
            <span className="text-sm">Nenhuma transcricao encontrada</span>
          </div>
          <button
            onClick={handleProcess}
            disabled={processing}
            className="flex items-center gap-2 rounded-lg bg-lime-500/10 px-3 py-1.5 text-sm font-medium text-lime-400 transition-colors hover:bg-lime-500/20 disabled:opacity-50"
          >
            {processing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Brain size={14} />
            )}
            Transcrever e Analisar
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[data.status]

  // Processing state
  if (data.status === 'transcribing' || data.status === 'analyzing' || data.status === 'pending') {
    return (
      <div className="rounded-lg border border-[#222222] bg-[#111111] p-4">
        <div className="flex items-center gap-3">
          <Loader2 size={18} className="animate-spin text-blue-400" />
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
              >
                {statusConfig.icon}
                {statusConfig.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              {data.status === 'transcribing'
                ? 'Convertendo audio em texto com Whisper...'
                : data.status === 'analyzing'
                  ? 'Analisando qualidade da ligacao com IA...'
                  : 'Aguardando processamento...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (data.status === 'error') {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400" />
            <span className="text-sm font-medium text-red-400">
              Erro na transcricao
            </span>
          </div>
          <button
            onClick={handleReprocess}
            disabled={processing}
            className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
          >
            {processing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Reprocessar
          </button>
        </div>
        {data.error_message && (
          <p className="mt-2 text-xs text-red-400/80">{data.error_message}</p>
        )}
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    )
  }

  // Completed state — full analysis view
  const scoreColor = data.ai_score ? getScoreColor(data.ai_score) : null
  const sentiment = data.ai_sentiment as {
    objections: Objection[]
    improvements: string[]
  } | null

  return (
    <div className="space-y-4">
      {/* Header: Status + Score */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
        >
          {statusConfig.icon}
          {statusConfig.label}
        </span>

        {data.ai_score !== null && scoreColor && (
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${scoreColor.bg} ${scoreColor.border}`}
          >
            <Star size={16} className={scoreColor.text} />
            <span className={`text-lg font-bold ${scoreColor.text}`}>
              {data.ai_score}
            </span>
            <span className="text-xs text-zinc-500">/10</span>
          </div>
        )}
      </div>

      {/* Summary */}
      {data.ai_summary && (
        <div className="rounded-lg border border-[#222222] bg-[#111111] p-4">
          <div className="mb-2 flex items-center gap-2 text-zinc-400">
            <MessageSquare size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">
              Resumo
            </span>
          </div>
          <p className="text-sm leading-relaxed text-zinc-300">
            {data.ai_summary}
          </p>
        </div>
      )}

      {/* Objections Table */}
      {sentiment?.objections && sentiment.objections.length > 0 && (
        <div className="rounded-lg border border-[#222222] bg-[#111111] p-4">
          <div className="mb-3 flex items-center gap-2 text-zinc-400">
            <AlertCircle size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">
              Objecoes ({sentiment.objections.length})
            </span>
          </div>
          <div className="space-y-2">
            {sentiment.objections.map((obj, i) => {
              const badge = getQualityBadge(obj.quality)
              return (
                <div
                  key={i}
                  className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1.5">
                      <p className="text-sm text-zinc-300">
                        <span className="font-medium text-zinc-400">
                          Objecao:{' '}
                        </span>
                        {obj.objection}
                      </p>
                      <p className="text-sm text-zinc-400">
                        <span className="font-medium text-zinc-500">
                          Tratamento:{' '}
                        </span>
                        {obj.handling}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.bg} ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Improvements */}
      {sentiment?.improvements && sentiment.improvements.length > 0 && (
        <div className="rounded-lg border border-[#222222] bg-[#111111] p-4">
          <div className="mb-3 flex items-center gap-2 text-zinc-400">
            <TrendingUp size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">
              Pontos de Melhoria
            </span>
          </div>
          <ul className="space-y-2">
            {sentiment.improvements.map((imp, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-zinc-300"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-400" />
                {imp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps */}
      {data.ai_next_steps && (
        <div className="rounded-lg border border-[#222222] bg-[#111111] p-4">
          <div className="mb-2 flex items-center gap-2 text-zinc-400">
            <ArrowRight size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">
              Proximos Passos
            </span>
          </div>
          <p className="text-sm leading-relaxed text-zinc-300">
            {data.ai_next_steps}
          </p>
        </div>
      )}

      {/* Full Transcription (collapsible) */}
      {data.transcription_text && (
        <div className="rounded-lg border border-[#222222] bg-[#111111]">
          <button
            onClick={() => setShowFullText(!showFullText)}
            className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[#161616]"
          >
            <div className="flex items-center gap-2 text-zinc-400">
              <Mic size={14} />
              <span className="text-xs font-medium uppercase tracking-wider">
                Transcricao Completa
              </span>
              {data.word_count && (
                <span className="text-xs text-zinc-600">
                  ({data.word_count} palavras)
                </span>
              )}
            </div>
            {showFullText ? (
              <ChevronUp size={16} className="text-zinc-500" />
            ) : (
              <ChevronDown size={16} className="text-zinc-500" />
            )}
          </button>
          {showFullText && (
            <div className="max-h-80 overflow-y-auto border-t border-[#222222] px-4 py-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                {data.transcription_text}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Processing Info */}
      {data.started_at && data.completed_at && (
        <div className="flex items-center gap-4 text-xs text-zinc-600">
          <span>
            Processado em{' '}
            {Math.round(
              (new Date(data.completed_at).getTime() -
                new Date(data.started_at).getTime()) /
                1000
            )}
            s
          </span>
          {data.duration_seconds && (
            <span>Audio: {data.duration_seconds}s</span>
          )}
          {data.word_count && <span>{data.word_count} palavras</span>}
        </div>
      )}
    </div>
  )
}
