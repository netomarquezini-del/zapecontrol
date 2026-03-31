'use client'

import { Fragment, useEffect, useState, useCallback, useRef } from 'react'
import {
  Mic, Search, ChevronLeft, ChevronRight, Loader2,
  Play, Pause, Download, ChevronDown, ChevronUp,
  Clock, User, Phone, FileText, Star,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────

interface RecordingLead {
  id: string
  nome: string
  telefone: string
  empresa: string | null
}

interface RecordingTranscription {
  id: string
  status: string
  ai_summary: string | null
  ai_score: number | null
  ai_sentiment: string | null
  transcription_text: string | null
}

interface RecordingCall {
  id: string
  lead_id: string
  sdr_user_id: string
  direction: string
  status: string
  disposition: string | null
  duration_seconds: number | null
  recording_url: string | null
  external_call_id: string | null
  started_at: string
  answered_at: string | null
  ended_at: string | null
  notes: string | null
  created_at: string
  sdr_leads: RecordingLead | null
  sdr_transcriptions: RecordingTranscription[] | null
}

// ─── Helpers ────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function formatDurationLong(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '0s'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs}s`
}

function getDispositionLabel(disposition: string | null): string {
  const map: Record<string, string> = {
    atendeu: 'Atendeu',
    nao_atendeu: 'Nao Atendeu',
    agendar: 'Agendar',
    sem_interesse: 'Sem Interesse',
    numero_errado: 'Numero Errado',
    caixa_postal: 'Caixa Postal',
  }
  return disposition ? map[disposition] || disposition : '-'
}

function getTranscriptionStatusLabel(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendente', color: '#facc15' },
    transcribing: { label: 'Transcrevendo', color: '#60a5fa' },
    analyzing: { label: 'Analisando', color: '#818cf8' },
    completed: { label: 'Concluida', color: '#34d399' },
    error: { label: 'Erro', color: '#f87171' },
  }
  return map[status] || { label: status, color: '#71717a' }
}

function getScoreColor(score: number): string {
  if (score >= 8) return '#34d399'  // emerald
  if (score >= 6) return '#a3e635'  // lime
  if (score >= 4) return '#facc15'  // yellow
  return '#f87171'                  // red
}

// ─── Audio Player Component ─────────────────────────────────────

function InlineAudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [loading, setLoading] = useState(false)

  const speeds = [1, 1.5, 2]

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      setLoading(true)
      audio.play()
        .then(() => {
          setPlaying(true)
          setLoading(false)
        })
        .catch(() => {
          setLoading(false)
        })
    }
  }

  const toggleSpeed = () => {
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length
    const newSpeed = speeds[nextIdx]
    setSpeed(newSpeed)
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  return (
    <div className="flex items-center gap-2 min-w-[260px]">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setPlaying(false)}
        onError={() => { setPlaying(false); setLoading(false) }}
      />

      <button
        onClick={togglePlay}
        className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-lime-400/20 text-lime-400 hover:bg-lime-400/30 transition-colors"
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : playing ? (
          <Pause size={14} />
        ) : (
          <Play size={14} className="ml-0.5" />
        )}
      </button>

      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 rounded-full appearance-none cursor-pointer bg-[#333333] accent-lime-400 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-lime-400 [&::-webkit-slider-thumb]:appearance-none"
        />
        <div className="flex items-center justify-between text-[10px] text-zinc-600">
          <span>{formatDuration(Math.round(currentTime))}</span>
          <span>{formatDuration(Math.round(duration))}</span>
        </div>
      </div>

      <button
        onClick={toggleSpeed}
        className="shrink-0 rounded-md bg-[#1a1a1a] border border-[#333333] px-1.5 py-0.5 text-[10px] font-mono font-medium text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
      >
        {speed}x
      </button>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────

export default function SdrGravacoesPage() {
  const [recordings, setRecordings] = useState<RecordingCall[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const limit = 25

  // Filters
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [sdrFilter, setSdrFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [minDuration, setMinDuration] = useState('')

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const fetchRecordings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (search) params.set('search', search)
      if (sdrFilter) params.set('sdr_id', sdrFilter)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      if (minDuration) params.set('min_duration', minDuration)

      const res = await fetch(`/api/sdr/calls/recordings?${params.toString()}`)
      const data = await res.json()

      if (res.ok) {
        setRecordings(data.data || [])
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 0)
      }
    } catch (err) {
      console.error('Error fetching recordings:', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, sdrFilter, dateFrom, dateTo, minDuration])

  useEffect(() => {
    fetchRecordings()
  }, [fetchRecordings])

  const toggleExpanded = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleDownload = (url: string, callId: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = `gravacao-${callId}.mp3`
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setSdrFilter('')
    setDateFrom('')
    setDateTo('')
    setMinDuration('')
    setPage(1)
  }

  const hasFilters = search || sdrFilter || dateFrom || dateTo || minDuration

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 lg:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-lime-400/10 border border-lime-400/20">
            <Mic size={20} className="text-lime-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Gravacoes</h1>
            <p className="text-xs text-zinc-500">
              {total} gravac{total !== 1 ? 'oes' : 'ao'} encontrada{total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por lead, telefone ou empresa..."
            className="w-full rounded-xl border border-[#222222] bg-[#111111] pl-11 pr-4 py-3 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-lime-400/50 focus:outline-none"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">De</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
              className="rounded-lg border border-[#222222] bg-[#111111] px-3 py-2 text-xs text-zinc-300 focus:border-lime-400/50 focus:outline-none [color-scheme:dark]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">Ate</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
              className="rounded-lg border border-[#222222] bg-[#111111] px-3 py-2 text-xs text-zinc-300 focus:border-lime-400/50 focus:outline-none [color-scheme:dark]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">SDR ID</label>
            <input
              type="text"
              value={sdrFilter}
              onChange={(e) => { setSdrFilter(e.target.value); setPage(1) }}
              placeholder="UUID do SDR"
              className="rounded-lg border border-[#222222] bg-[#111111] px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:border-lime-400/50 focus:outline-none w-48"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">Duracao min (s)</label>
            <input
              type="number"
              min={0}
              value={minDuration}
              onChange={(e) => { setMinDuration(e.target.value); setPage(1) }}
              placeholder="Ex: 30"
              className="rounded-lg border border-[#222222] bg-[#111111] px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:border-lime-400/50 focus:outline-none w-28"
            />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="rounded-lg border border-[#333333] px-3 py-2 text-xs text-zinc-400 hover:bg-[#1a1a1a] hover:text-white transition-colors"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#222222] bg-[#111111] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-zinc-500" />
          </div>
        ) : recordings.length === 0 ? (
          <div className="py-20 text-center">
            <Mic size={32} className="mx-auto mb-3 text-zinc-700" />
            <p className="text-sm text-zinc-500">Nenhuma gravacao encontrada</p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-3 text-xs text-lime-400 hover:text-lime-300 transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#222222]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Lead</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">SDR</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Duracao</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">Transcricao</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Player</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {recordings.map((call) => {
                  const lead = call.sdr_leads
                  const transcription = call.sdr_transcriptions?.[0] || null
                  const isExpanded = expandedRows.has(call.id)

                  return (
                    <Fragment key={call.id}>
                      <tr className="border-b border-[#1a1a1a] hover:bg-[#0f0f0f] transition-colors">
                        {/* Data */}
                        <td className="px-4 py-3">
                          <div className="text-sm text-white">{formatDate(call.started_at)}</div>
                          <div className="text-[10px] text-zinc-600">{getDispositionLabel(call.disposition)}</div>
                        </td>

                        {/* Lead */}
                        <td className="px-4 py-3">
                          <div className="text-sm text-white font-medium">{lead?.nome || '-'}</div>
                          <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                            <Phone size={10} />
                            {lead?.telefone || '-'}
                          </div>
                          {lead?.empresa && (
                            <div className="text-[10px] text-zinc-600">{lead.empresa}</div>
                          )}
                        </td>

                        {/* SDR */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <User size={12} className="text-zinc-600" />
                            <span className="truncate max-w-[120px]" title={call.sdr_user_id}>
                              {call.sdr_user_id.slice(0, 8)}...
                            </span>
                          </div>
                        </td>

                        {/* Duracao */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-sm text-zinc-300">
                            <Clock size={12} className="text-zinc-600" />
                            {formatDurationLong(call.duration_seconds)}
                          </div>
                        </td>

                        {/* Transcricao status */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          {transcription ? (
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                                style={{
                                  backgroundColor: getTranscriptionStatusLabel(transcription.status).color + '22',
                                  color: getTranscriptionStatusLabel(transcription.status).color,
                                }}
                              >
                                {getTranscriptionStatusLabel(transcription.status).label}
                              </span>
                              {transcription.ai_score !== null && (
                                <span
                                  className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold"
                                  style={{
                                    backgroundColor: getScoreColor(transcription.ai_score) + '22',
                                    color: getScoreColor(transcription.ai_score),
                                  }}
                                >
                                  <Star size={10} />
                                  {transcription.ai_score.toFixed(1)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-600">-</span>
                          )}
                        </td>

                        {/* Player */}
                        <td className="px-4 py-3">
                          {call.recording_url ? (
                            <InlineAudioPlayer url={call.recording_url} />
                          ) : (
                            <span className="text-xs text-zinc-600">Indisponivel</span>
                          )}
                        </td>

                        {/* Acoes */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {transcription && (transcription.transcription_text || transcription.ai_summary) && (
                              <button
                                onClick={() => toggleExpanded(call.id)}
                                className="rounded-lg p-1.5 text-zinc-500 hover:bg-[#1a1a1a] hover:text-white transition-colors"
                                title="Ver transcricao"
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            )}
                            {call.recording_url && (
                              <button
                                onClick={() => handleDownload(call.recording_url!, call.id)}
                                className="rounded-lg p-1.5 text-zinc-500 hover:bg-[#1a1a1a] hover:text-white transition-colors"
                                title="Download"
                              >
                                <Download size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded transcription row */}
                      {isExpanded && transcription && (
                        <tr className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="space-y-3">
                              {/* Summary */}
                              {transcription.ai_summary && (
                                <div>
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <FileText size={12} className="text-lime-400" />
                                    <span className="text-xs font-semibold text-lime-400 uppercase tracking-wider">Resumo IA</span>
                                  </div>
                                  <p className="text-sm text-zinc-300 leading-relaxed">{transcription.ai_summary}</p>
                                </div>
                              )}

                              {/* Metadata row */}
                              <div className="flex flex-wrap items-center gap-3">
                                {transcription.ai_sentiment && (
                                  <span className="rounded-md bg-[#1a1a1a] border border-[#333333] px-2 py-0.5 text-xs text-zinc-400">
                                    Sentimento: {transcription.ai_sentiment}
                                  </span>
                                )}
                                {transcription.ai_score !== null && (
                                  <span
                                    className="rounded-md px-2 py-0.5 text-xs font-bold"
                                    style={{
                                      backgroundColor: getScoreColor(transcription.ai_score) + '22',
                                      color: getScoreColor(transcription.ai_score),
                                    }}
                                  >
                                    Score: {transcription.ai_score.toFixed(1)}/10
                                  </span>
                                )}
                              </div>

                              {/* Full transcription */}
                              {transcription.transcription_text && (
                                <div>
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <Mic size={12} className="text-zinc-500" />
                                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Transcricao completa</span>
                                  </div>
                                  <div className="max-h-60 overflow-y-auto rounded-xl border border-[#222222] bg-[#111111] p-4">
                                    <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">
                                      {transcription.transcription_text}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#222222] px-4 py-3">
            <p className="text-xs text-zinc-500">
              Mostrando {(page - 1) * limit + 1}-{Math.min(page * limit, total)} de {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-[#1a1a1a] hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 7) {
                  pageNum = i + 1
                } else if (page <= 4) {
                  pageNum = i + 1
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i
                } else {
                  pageNum = page - 3 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-lime-400/20 text-lime-400'
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-[#1a1a1a] hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

