'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  BrainCircuit,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
  OctagonAlert,
  Send,
  Loader2,
  User,
  Building2,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
  Trash2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────

interface CopilotSuggestion {
  id: string
  type: 'tip' | 'objection' | 'next_step' | 'warning'
  content: string
  confidence: number
  timestamp: number
}

interface LeadContext {
  lead: {
    id: string
    nome: string
    empresa: string | null
    cargo: string | null
    telefone: string
    email: string | null
    status: string
    tags: string[]
    notes: string | null
    total_calls: number
    total_messages: number
    last_contact_at: string | null
  }
  interactions: {
    id: string
    type: string
    summary: string | null
    created_at: string
  }[]
  calls: {
    id: string
    direction: string
    status: string
    disposition: string | null
    duration_seconds: number | null
    started_at: string
    notes: string | null
  }[]
}

interface CopilotPanelProps {
  isActive: boolean
  leadId: string | null
  onToggle: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────

const SUGGESTION_ICONS: Record<CopilotSuggestion['type'], typeof Lightbulb> = {
  tip: Lightbulb,
  objection: AlertTriangle,
  next_step: ArrowRight,
  warning: OctagonAlert,
}

const SUGGESTION_COLORS: Record<CopilotSuggestion['type'], { border: string; bg: string; icon: string; label: string }> = {
  tip: {
    border: 'border-lime-500/30',
    bg: 'bg-lime-500/5',
    icon: 'text-lime-400',
    label: 'Dica',
  },
  objection: {
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/5',
    icon: 'text-yellow-400',
    label: 'Objecao',
  },
  next_step: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5',
    icon: 'text-blue-400',
    label: 'Proximo Passo',
  },
  warning: {
    border: 'border-red-500/30',
    bg: 'bg-red-500/5',
    icon: 'text-red-400',
    label: 'Alerta',
  },
}

function generateId(): string {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ─── Component ────────────────────────────────────────────────────

export default function CopilotPanel({ isActive, leadId, onToggle }: CopilotPanelProps) {
  const [context, setContext] = useState<LeadContext | null>(null)
  const [suggestions, setSuggestions] = useState<CopilotSuggestion[]>([])
  const [transcript, setTranscript] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamBuffer, setStreamBuffer] = useState('')
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false)
  const [isLoadingContext, setIsLoadingContext] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const suggestionsEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // ─── Persist toggle preference ──────────────────────────────

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sdr-copilot-active', String(isActive))
    }
  }, [isActive])

  // ─── Fetch lead context when lead changes ───────────────────

  useEffect(() => {
    if (!isActive || !leadId) {
      setContext(null)
      setSuggestions([])
      setTranscript('')
      setStreamBuffer('')
      return
    }

    let cancelled = false
    setIsLoadingContext(true)
    setError(null)

    async function fetchContext() {
      try {
        const res = await fetch(`/api/sdr/copilot/context?lead_id=${leadId}`)
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Erro ao carregar contexto')
        }
        const data = await res.json()
        if (!cancelled) {
          setContext(data)
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Erro ao carregar contexto'
          setError(message)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingContext(false)
        }
      }
    }

    fetchContext()
    return () => { cancelled = true }
  }, [isActive, leadId])

  // ─── Auto-scroll suggestions ────────────────────────────────

  useEffect(() => {
    if (suggestionsEndRef.current) {
      suggestionsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [suggestions])

  // ─── Cleanup on unmount ─────────────────────────────────────

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [])

  // ─── Send transcript to copilot API ─────────────────────────

  const sendTranscript = useCallback(async () => {
    if (!leadId || !transcript.trim() || isStreaming) return

    setIsStreaming(true)
    setStreamBuffer('')
    setError(null)

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/sdr/copilot/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, transcript: transcript.trim() }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro no copilot')
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()

          if (payload === '[DONE]') {
            // Parse accumulated JSON into suggestions
            parseSuggestions(accumulated)
            accumulated = ''
            continue
          }

          try {
            const parsed = JSON.parse(payload)
            if (parsed.error) {
              setError(parsed.error)
              continue
            }
            if (parsed.text) {
              accumulated += parsed.text
              setStreamBuffer(accumulated)
            }
          } catch {
            // Incomplete JSON chunk, skip
          }
        }
      }

      // If there's leftover accumulated text, try to parse it
      if (accumulated.trim()) {
        parseSuggestions(accumulated)
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled, ignore
        return
      }
      const message = err instanceof Error ? err.message : 'Erro ao conectar com copilot'
      setError(message)
    } finally {
      setIsStreaming(false)
      setStreamBuffer('')
      abortRef.current = null
    }
  }, [leadId, transcript, isStreaming])

  // ─── Parse suggestion JSON ──────────────────────────────────

  function parseSuggestions(raw: string) {
    try {
      // Try to extract JSON array from the response
      let jsonStr = raw.trim()

      // Handle markdown code blocks
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      }

      // Find array in the text
      const arrayMatch = jsonStr.match(/\[[\s\S]*\]/)
      if (!arrayMatch) return

      const parsed = JSON.parse(arrayMatch[0])
      if (!Array.isArray(parsed) || parsed.length === 0) return

      const newSuggestions: CopilotSuggestion[] = parsed
        .filter(
          (s: Record<string, unknown>) =>
            s &&
            typeof s.content === 'string' &&
            s.content.trim() &&
            ['tip', 'objection', 'next_step', 'warning'].includes(s.type as string)
        )
        .map((s: { type: CopilotSuggestion['type']; content: string; confidence?: number }) => ({
          id: generateId(),
          type: s.type,
          content: s.content,
          confidence: Math.max(0, Math.min(1, Number(s.confidence) || 0.5)),
          timestamp: Date.now(),
        }))

      if (newSuggestions.length > 0) {
        setSuggestions((prev) => [...newSuggestions, ...prev])
      }
    } catch {
      // Could not parse suggestions, skip silently
    }
  }

  // ─── Handle keyboard shortcut ───────────────────────────────

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      sendTranscript()
    }
  }

  // ─── Clear suggestions ─────────────────────────────────────

  function clearSuggestions() {
    setSuggestions([])
  }

  // ─── Render: Collapsed ──────────────────────────────────────

  if (!isActive) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 z-[9980] -translate-y-1/2 flex items-center gap-1.5 rounded-l-lg border border-r-0 border-[#222222] bg-[#111111]/95 px-2 py-3 text-zinc-500 backdrop-blur-md transition-all hover:bg-[#1a1a1a] hover:text-lime-400"
        title="Abrir AI Copilot"
      >
        <BrainCircuit size={16} />
        <ChevronLeft size={12} />
      </button>
    )
  }

  // ─── Render: Expanded ───────────────────────────────────────

  return (
    <div className="fixed right-0 top-0 z-[9980] flex h-full w-[320px] flex-col border-l border-[#222222] bg-[#111111]/95 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#222222] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <BrainCircuit size={18} className="text-lime-400" />
          <span className="text-sm font-semibold text-white">AI Copilot</span>
          {isStreaming ? (
            <span className="flex items-center gap-1 rounded-full bg-lime-400/10 px-2 py-0.5 text-[10px] font-medium text-lime-400">
              <Loader2 size={10} className="animate-spin" />
              Analisando
            </span>
          ) : leadId ? (
            <span className="flex items-center gap-1 rounded-full bg-lime-400/10 px-2 py-0.5 text-[10px] font-medium text-lime-400">
              <Wifi size={10} />
              Ativo
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
              <WifiOff size={10} />
              Standby
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          title="Fechar painel"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Lead info */}
      {isLoadingContext && (
        <div className="flex items-center justify-center gap-2 border-b border-[#222222] px-4 py-6">
          <Loader2 size={16} className="animate-spin text-zinc-500" />
          <span className="text-xs text-zinc-500">Carregando contexto...</span>
        </div>
      )}

      {context && (
        <div className="border-b border-[#222222] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-400/10">
              <User size={14} className="text-lime-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {context.lead.nome}
              </p>
              <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                {context.lead.empresa && (
                  <span className="flex items-center gap-1 truncate">
                    <Building2 size={9} />
                    {context.lead.empresa}
                  </span>
                )}
                {context.lead.cargo && (
                  <span className="flex items-center gap-1 truncate">
                    <Briefcase size={9} />
                    {context.lead.cargo}
                  </span>
                )}
              </div>
            </div>
          </div>
          {context.interactions.length > 0 && (
            <div className="mt-2 rounded-md bg-[#0a0a0a] px-2.5 py-2">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Historico recente
              </p>
              {context.interactions.slice(0, 3).map((interaction) => (
                <p
                  key={interaction.id}
                  className="truncate text-[11px] leading-relaxed text-zinc-400"
                >
                  <span className="text-zinc-600">[{interaction.type}]</span>{' '}
                  {interaction.summary || 'Sem resumo'}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mx-3 mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Suggestions feed */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {!leadId && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <BrainCircuit size={32} className="text-zinc-700" />
            <p className="text-sm text-zinc-600">Nenhuma ligacao ativa</p>
            <p className="text-xs text-zinc-700">
              O copilot sera ativado automaticamente quando uma ligacao iniciar
            </p>
          </div>
        )}

        {leadId && suggestions.length === 0 && !isStreaming && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <Lightbulb size={24} className="text-zinc-700" />
            <p className="text-xs text-zinc-600">
              Envie a transcricao para receber sugestoes em tempo real
            </p>
          </div>
        )}

        {/* Streaming buffer preview */}
        {isStreaming && streamBuffer && (
          <div className="mb-3 rounded-lg border border-dashed border-lime-500/20 bg-lime-500/5 p-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-lime-600">
              Processando...
            </p>
            <p className="text-xs leading-relaxed text-zinc-400">{streamBuffer}</p>
          </div>
        )}

        {/* Suggestion cards */}
        {suggestions.map((suggestion) => {
          const colors = SUGGESTION_COLORS[suggestion.type]
          const Icon = SUGGESTION_ICONS[suggestion.type]

          return (
            <div
              key={suggestion.id}
              className={`mb-2.5 rounded-lg border ${colors.border} ${colors.bg} p-3 animate-in fade-in slide-in-from-top-2 duration-300`}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon size={13} className={colors.icon} />
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${colors.icon}`}>
                    {colors.label}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-1 w-12 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${
                        suggestion.confidence >= 0.7
                          ? 'bg-lime-400'
                          : suggestion.confidence >= 0.4
                            ? 'bg-yellow-400'
                            : 'bg-zinc-500'
                      }`}
                      style={{ width: `${suggestion.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-zinc-600">
                    {Math.round(suggestion.confidence * 100)}%
                  </span>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-zinc-300">
                {suggestion.content}
              </p>
            </div>
          )
        })}

        <div ref={suggestionsEndRef} />
      </div>

      {/* Transcript section (collapsible) */}
      {leadId && suggestions.length > 0 && (
        <div className="border-t border-[#222222]">
          <button
            onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
            className="flex w-full items-center justify-between px-4 py-2 text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              Transcricao acumulada
            </span>
            {isTranscriptOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </button>
          {isTranscriptOpen && (
            <div className="max-h-[120px] overflow-y-auto px-4 pb-3">
              <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-500">
                {transcript || 'Nenhuma transcricao ainda.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Input area */}
      {leadId && (
        <div className="border-t border-[#222222] p-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Transcricao / Notas
            </p>
            {suggestions.length > 0 && (
              <button
                onClick={clearSuggestions}
                className="flex items-center gap-1 text-[10px] text-zinc-600 transition-colors hover:text-zinc-400"
                title="Limpar sugestoes"
              >
                <Trash2 size={10} />
                Limpar
              </button>
            )}
          </div>
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Cole ou digite a transcricao da conversa aqui..."
              disabled={isStreaming}
              rows={3}
              className="w-full resize-none rounded-lg border border-[#222222] bg-[#0a0a0a] px-3 py-2 text-xs leading-relaxed text-zinc-300 placeholder:text-zinc-700 focus:border-lime-500/30 focus:outline-none focus:ring-1 focus:ring-lime-500/20 disabled:opacity-50"
            />
            <button
              onClick={sendTranscript}
              disabled={isStreaming || !transcript.trim()}
              className="absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-md bg-lime-400 text-black transition-all hover:bg-lime-300 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Enviar para analise (Ctrl+Enter)"
            >
              {isStreaming ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Send size={13} />
              )}
            </button>
          </div>
          <p className="mt-1 text-[9px] text-zinc-700">
            Ctrl+Enter para enviar
          </p>
        </div>
      )}
    </div>
  )
}
