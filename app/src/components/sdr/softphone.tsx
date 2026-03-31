'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneForwarded,
  Minimize2,
  Maximize2,
  Mic,
  MicOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from 'lucide-react'
import { Device, Call } from '@twilio/voice-sdk'
import type { SdrCallDisposition, SdrCallStatus } from '@/lib/types-sdr'
import DispositionModal from './disposition-modal'
import CallControls from './call-controls'

// ─── Types ───────────────────────────────────────────────────────

interface DialLine {
  leadId: string
  leadName: string
  leadPhone: string
  callId: string | null
  callSid: string | null
  numberUsed: string | null
  status: SdrCallStatus
  error?: string
}

interface SoftphoneProps {
  sdrUserId: string
  /** Called when the softphone needs next leads to dial */
  onRequestLeads?: () => Promise<{ id: string; nome: string; telefone: string }[]>
  /** Called after disposition is saved */
  onDispositionComplete?: (leadId: string, disposition: SdrCallDisposition) => void
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function getStatusLabel(status: SdrCallStatus): string {
  const map: Record<SdrCallStatus, string> = {
    initiated: 'Discando...',
    ringing: 'Tocando...',
    answered: 'Em ligacao',
    completed: 'Finalizada',
    no_answer: 'Sem resposta',
    busy: 'Ocupado',
    failed: 'Falhou',
    canceled: 'Cancelada',
  }
  return map[status] || status
}

function getStatusColor(status: SdrCallStatus): string {
  const map: Record<SdrCallStatus, string> = {
    initiated: 'text-yellow-400',
    ringing: 'text-yellow-300',
    answered: 'text-lime-400',
    completed: 'text-zinc-500',
    no_answer: 'text-zinc-500',
    busy: 'text-orange-400',
    failed: 'text-red-400',
    canceled: 'text-zinc-600',
  }
  return map[status] || 'text-zinc-400'
}

function getStatusIcon(status: SdrCallStatus) {
  switch (status) {
    case 'initiated':
      return <Loader2 size={14} className="animate-spin text-yellow-400" />
    case 'ringing':
      return <PhoneForwarded size={14} className="animate-pulse text-yellow-300" />
    case 'answered':
      return <PhoneCall size={14} className="text-lime-400" />
    case 'completed':
      return <CheckCircle2 size={14} className="text-zinc-500" />
    case 'no_answer':
      return <XCircle size={14} className="text-zinc-500" />
    case 'busy':
      return <PhoneOff size={14} className="text-orange-400" />
    case 'failed':
      return <AlertCircle size={14} className="text-red-400" />
    case 'canceled':
      return <XCircle size={14} className="text-zinc-600" />
    default:
      return null
  }
}

// ─── Component ───────────────────────────────────────────────────

export default function Softphone({
  sdrUserId,
  onRequestLeads,
  onDispositionComplete,
}: SoftphoneProps) {
  // State
  const [isExpanded, setIsExpanded] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [lines, setLines] = useState<DialLine[]>([])
  const [activeLine, setActiveLine] = useState<DialLine | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [isDialing, setIsDialing] = useState(false)
  const [batchId, setBatchId] = useState<string | null>(null)

  // Disposition modal
  const [dispositionOpen, setDispositionOpen] = useState(false)
  const [dispositionCallId, setDispositionCallId] = useState<string | null>(null)
  const [dispositionLeadName, setDispositionLeadName] = useState('')
  const [dispositionLeadId, setDispositionLeadId] = useState<string | null>(null)

  // Refs
  const deviceRef = useRef<Device | null>(null)
  const activeCallRef = useRef<Call | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Initialize Twilio Device ────────────────────────────────

  const initDevice = useCallback(async () => {
    if (isInitialized || isInitializing) return
    setIsInitializing(true)
    setInitError(null)

    try {
      const res = await fetch('/api/sdr/calls/token')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to get token')
      }

      const { token } = await res.json()

      const device = new Device(token, {
        codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
      })

      device.on('registered', () => {
        console.log('[softphone] Device registered')
      })

      device.on('error', (error) => {
        console.error('[softphone] Device error:', error)
        setInitError(error.message || 'Device error')
      })

      device.on('incoming', (call: Call) => {
        console.log('[softphone] Incoming call:', call.parameters)
        // Auto-accept incoming conference connections
        call.accept()
        activeCallRef.current = call
        startTimer()

        call.on('disconnect', () => {
          console.log('[softphone] Call disconnected')
          stopTimer()
          activeCallRef.current = null

          // Show disposition modal for the active line
          if (activeLine?.callId) {
            setDispositionCallId(activeLine.callId)
            setDispositionLeadName(activeLine.leadName)
            setDispositionLeadId(activeLine.leadId)
            setDispositionOpen(true)
          }
        })
      })

      device.on('tokenWillExpire', async () => {
        console.log('[softphone] Token expiring, refreshing...')
        try {
          const refreshRes = await fetch('/api/sdr/calls/token')
          if (refreshRes.ok) {
            const { token: newToken } = await refreshRes.json()
            device.updateToken(newToken)
          }
        } catch (e) {
          console.error('[softphone] Token refresh error:', e)
        }
      })

      await device.register()
      deviceRef.current = device
      setIsInitialized(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Initialization failed'
      console.error('[softphone] Init error:', msg)
      setInitError(msg)
    } finally {
      setIsInitializing(false)
    }
  }, [isInitialized, isInitializing, activeLine])

  // ─── Timer ───────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    setCallDuration(0)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1)
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // ─── Cleanup ─────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      stopTimer()
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (deviceRef.current) {
        deviceRef.current.destroy()
        deviceRef.current = null
      }
    }
  }, [stopTimer])

  // ─── Poll call statuses ──────────────────────────────────────

  useEffect(() => {
    if (lines.length === 0 || !batchId) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      return
    }

    // Check if all lines are in terminal states
    const allDone = lines.every((l) =>
      ['completed', 'no_answer', 'busy', 'failed', 'canceled'].includes(l.status)
    )
    if (allDone) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      return
    }

    // Poll for status updates every 2 seconds
    if (!pollingRef.current) {
      pollingRef.current = setInterval(async () => {
        const callIds = lines
          .filter((l) => l.callId)
          .map((l) => l.callId as string)

        if (callIds.length === 0) return

        try {
          const res = await fetch(
            `/api/sdr/calls/status?ids=${callIds.join(',')}`
          )
          if (!res.ok) return

          const data = await res.json()
          if (data && Array.isArray(data.calls)) {
            setLines((prevLines) =>
              prevLines.map((line) => {
                const updated = data.calls.find(
                  (c: { id: string; status: SdrCallStatus }) => c.id === line.callId
                )
                if (updated) {
                  const newLine = { ...line, status: updated.status as SdrCallStatus }
                  // If this line just became answered, set it as the active line
                  if (updated.status === 'answered' && line.status !== 'answered') {
                    setActiveLine(newLine)
                  }
                  return newLine
                }
                return line
              })
            )
          }
        } catch {
          // Silently ignore polling errors
        }
      }, 2000)
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [lines, batchId])

  // ─── Dial next leads ────────────────────────────────────────

  async function dialNextLeads() {
    if (isDialing) return
    if (!isInitialized) {
      await initDevice()
    }

    setIsDialing(true)
    setLines([])
    setActiveLine(null)
    setBatchId(null)

    try {
      // Get leads to dial
      let leads: { id: string; nome: string; telefone: string }[] = []

      if (onRequestLeads) {
        leads = await onRequestLeads()
      }

      if (leads.length === 0) {
        setInitError('Nenhum lead disponivel para discar')
        setIsDialing(false)
        return
      }

      // Limit to 5
      const batch = leads.slice(0, 5)

      // Initialize lines with pending state
      const initialLines: DialLine[] = batch.map((lead) => ({
        leadId: lead.id,
        leadName: lead.nome,
        leadPhone: lead.telefone,
        callId: null,
        callSid: null,
        numberUsed: null,
        status: 'initiated' as SdrCallStatus,
      }))
      setLines(initialLines)
      setIsExpanded(true)

      // Call the dial API
      const res = await fetch('/api/sdr/calls/dial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_ids: batch.map((l) => l.id),
          sdr_user_id: sdrUserId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to dial')
      }

      const data = await res.json()
      setBatchId(data.batch_id)

      // Update lines with call info
      setLines((prev) =>
        prev.map((line) => {
          const callInfo = data.calls?.find(
            (c: { lead_id: string }) => c.lead_id === line.leadId
          )
          if (callInfo) {
            return {
              ...line,
              callId: callInfo.call_id,
              callSid: callInfo.call_sid,
              numberUsed: callInfo.number_used,
              status: callInfo.error ? ('failed' as SdrCallStatus) : line.status,
              error: callInfo.error,
            }
          }
          return line
        })
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Dial failed'
      console.error('[softphone] Dial error:', msg)
      setInitError(msg)
    } finally {
      setIsDialing(false)
    }
  }

  // ─── Call controls ───────────────────────────────────────────

  function handleMute() {
    const call = activeCallRef.current
    if (call) {
      if (isMuted) {
        call.mute(false)
      } else {
        call.mute(true)
      }
      setIsMuted(!isMuted)
    }
  }

  async function handleHangup() {
    // Hang up the active Twilio call
    const call = activeCallRef.current
    if (call) {
      call.disconnect()
      activeCallRef.current = null
    }
    stopTimer()

    // Also hang up any remaining pending calls via API
    const pendingSids = lines
      .filter((l) => l.callSid && ['initiated', 'ringing'].includes(l.status))
      .map((l) => l.callSid as string)

    if (pendingSids.length > 0) {
      try {
        await fetch('/api/sdr/calls/hangup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ call_sids: pendingSids }),
        })
      } catch (err) {
        console.error('[softphone] Hangup error:', err)
      }
    }

    // Update all non-terminal lines to canceled
    setLines((prev) =>
      prev.map((l) =>
        ['initiated', 'ringing', 'answered'].includes(l.status)
          ? { ...l, status: 'canceled' as SdrCallStatus }
          : l
      )
    )

    // Show disposition if there was an active call
    if (activeLine?.callId) {
      setDispositionCallId(activeLine.callId)
      setDispositionLeadName(activeLine.leadName)
      setDispositionLeadId(activeLine.leadId)
      setDispositionOpen(true)
    }

    setActiveLine(null)
    setIsMuted(false)
  }

  function handleDisposition(disposition: SdrCallDisposition) {
    if (dispositionLeadId && onDispositionComplete) {
      onDispositionComplete(dispositionLeadId, disposition)
    }
    setDispositionOpen(false)
    setDispositionCallId(null)
    setDispositionLeadName('')
    setDispositionLeadId(null)
  }

  // ─── Computed ────────────────────────────────────────────────

  const hasActiveCall = activeLine !== null && activeLine.status === 'answered'
  const isAnyLineActive = lines.some((l) =>
    ['initiated', 'ringing', 'answered'].includes(l.status)
  )
  const answeredCount = lines.filter((l) => l.status === 'answered').length

  // ─── Render: Minimized ──────────────────────────────────────

  if (!isExpanded) {
    return (
      <>
        <button
          onClick={() => {
            setIsExpanded(true)
            if (!isInitialized && !isInitializing) {
              initDevice()
            }
          }}
          className={`fixed bottom-6 right-6 z-[9990] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 ${
            hasActiveCall
              ? 'bg-lime-500 text-black animate-pulse'
              : isAnyLineActive
                ? 'bg-yellow-500 text-black'
                : 'bg-[#222222] text-lime-400 hover:bg-[#333333]'
          }`}
        >
          {hasActiveCall ? (
            <PhoneCall size={24} />
          ) : isAnyLineActive ? (
            <PhoneForwarded size={24} className="animate-pulse" />
          ) : (
            <Phone size={24} />
          )}
          {isAnyLineActive && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {lines.filter((l) => ['initiated', 'ringing', 'answered'].includes(l.status)).length}
            </span>
          )}
        </button>

        <DispositionModal
          isOpen={dispositionOpen}
          onClose={() => setDispositionOpen(false)}
          callId={dispositionCallId || ''}
          leadName={dispositionLeadName}
          onDisposition={handleDisposition}
        />
      </>
    )
  }

  // ─── Render: Expanded ───────────────────────────────────────

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[9990] w-[380px] rounded-xl border border-[#222222] bg-[#0a0a0a]/95 backdrop-blur-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222222] px-4 py-3">
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                isInitialized
                  ? 'bg-lime-400'
                  : isInitializing
                    ? 'bg-yellow-400 animate-pulse'
                    : 'bg-zinc-600'
              }`}
            />
            <span className="text-sm font-medium text-white">Power Dialer</span>
            {hasActiveCall && (
              <span className="rounded-full bg-lime-400/10 px-2 py-0.5 text-xs font-medium text-lime-400">
                AO VIVO
              </span>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          >
            <Minimize2 size={14} />
          </button>
        </div>

        {/* Error display */}
        {initError && (
          <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
            <AlertCircle size={14} />
            <span className="flex-1">{initError}</span>
            <button
              onClick={() => setInitError(null)}
              className="text-red-500 hover:text-red-400"
            >
              <XCircle size={12} />
            </button>
          </div>
        )}

        {/* Active call section */}
        {hasActiveCall && activeLine && (
          <div className="border-b border-[#222222] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{activeLine.leadName}</p>
                <p className="text-xs text-zinc-500">{activeLine.leadPhone}</p>
              </div>
              <span className="font-mono text-lg text-lime-400">
                {formatDuration(callDuration)}
              </span>
            </div>
            <CallControls
              onMute={handleMute}
              onHangup={handleHangup}
              isMuted={isMuted}
              isActive={true}
              duration={callDuration}
            />
          </div>
        )}

        {/* Lines status */}
        {lines.length > 0 && (
          <div className="max-h-[240px] overflow-y-auto">
            <div className="px-4 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Linhas ({answeredCount > 0 ? `${answeredCount} atendida` : `${lines.length} discando`})
              </p>
            </div>
            {lines.map((line, idx) => (
              <div
                key={line.leadId}
                className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                  line.status === 'answered'
                    ? 'bg-lime-400/5'
                    : 'hover:bg-zinc-900/50'
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-500">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm text-zinc-300">{line.leadName}</p>
                  <p className="text-[10px] text-zinc-600">{line.leadPhone}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(line.status)}
                  <span className={`text-xs ${getStatusColor(line.status)}`}>
                    {getStatusLabel(line.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dial button */}
        <div className="border-t border-[#222222] p-4">
          {!hasActiveCall && (
            <button
              onClick={dialNextLeads}
              disabled={isDialing || isAnyLineActive}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-lime-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isDialing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Discando...
                </>
              ) : isAnyLineActive ? (
                <>
                  <PhoneForwarded size={16} />
                  Aguardando atendimento...
                </>
              ) : (
                <>
                  <Phone size={16} />
                  Discar Proximos
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          )}

          {isAnyLineActive && !hasActiveCall && (
            <button
              onClick={handleHangup}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10"
            >
              <PhoneOff size={14} />
              Cancelar todas
            </button>
          )}

          {!isInitialized && !isAnyLineActive && (
            <p className="mt-2 text-center text-[10px] text-zinc-600">
              {isInitializing
                ? 'Inicializando dispositivo...'
                : 'O dispositivo sera inicializado ao discar'}
            </p>
          )}
        </div>
      </div>

      <DispositionModal
        isOpen={dispositionOpen}
        onClose={() => setDispositionOpen(false)}
        callId={dispositionCallId || ''}
        leadName={dispositionLeadName}
        onDisposition={handleDisposition}
      />
    </>
  )
}
