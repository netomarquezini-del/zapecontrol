'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, CalendarPlus } from 'lucide-react'

interface ScheduleFormProps {
  isOpen: boolean
  onClose: () => void
  onScheduled: () => void
  leadId: string
  leadName: string
}

interface CloserOption {
  id: string
  name: string
}

export default function ScheduleForm({
  isOpen,
  onClose,
  onScheduled,
  leadId,
  leadName,
}: ScheduleFormProps) {
  const [closers, setClosers] = useState<CloserOption[]>([])
  const [closerId, setCloserId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadingClosers, setLoadingClosers] = useState(false)

  // Load closers (users with closer role)
  useEffect(() => {
    if (!isOpen) return

    async function loadClosers() {
      setLoadingClosers(true)
      try {
        const res = await fetch('/api/users?role=closer')
        if (res.ok) {
          const data = await res.json()
          const userList = data.users || data.data || data || []
          setClosers(
            Array.isArray(userList)
              ? userList.map((u: { id: string; name?: string; nome?: string; email?: string }) => ({
                  id: u.id,
                  name: u.name || u.nome || u.email || u.id,
                }))
              : []
          )
        }
      } catch {
        // Silently fail - closers dropdown will be empty
        console.warn('[schedule-form] Could not load closers')
      } finally {
        setLoadingClosers(false)
      }
    }

    loadClosers()
  }, [isOpen])

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setCloserId('')
      setDate('')
      setTime('')
      setNotes('')
      setError('')
    }
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!closerId) {
      setError('Selecione um closer')
      return
    }
    if (!date || !time) {
      setError('Selecione data e hora')
      return
    }

    const scheduledAt = new Date(`${date}T${time}:00`)
    if (isNaN(scheduledAt.getTime())) {
      setError('Data/hora invalida')
      return
    }

    if (scheduledAt <= new Date()) {
      setError('A data/hora deve ser no futuro')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/sdr/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          closer_id: closerId,
          scheduled_at: scheduledAt.toISOString(),
          notes: notes || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erro ao criar agendamento')
        return
      }

      onScheduled()
      onClose()
    } catch {
      setError('Erro de conexao')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#222222] bg-[#111111] p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime-400/10 border border-lime-400/20">
              <CalendarPlus size={18} className="text-lime-400" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-white">Agendar Reuniao</h2>
              <p className="text-xs text-zinc-500">{leadName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Closer */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Closer
            </label>
            {loadingClosers ? (
              <div className="flex h-10 items-center rounded-lg border border-[#222222] bg-[#0a0a0a] px-3">
                <Loader2 size={14} className="animate-spin text-zinc-500" />
                <span className="ml-2 text-xs text-zinc-500">Carregando...</span>
              </div>
            ) : (
              <select
                value={closerId}
                onChange={(e) => setCloserId(e.target.value)}
                className="w-full rounded-lg border border-[#222222] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-lime-400/40"
              >
                <option value="">Selecione um closer</option>
                {closers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full rounded-lg border border-[#222222] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-lime-400/40 [color-scheme:dark]"
            />
          </div>

          {/* Time */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Hora
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-[#222222] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-lime-400/40 [color-scheme:dark]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Observacoes para o closer..."
              className="w-full resize-none rounded-lg border border-[#222222] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors focus:border-lime-400/40"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#222222] bg-transparent px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-lime-300 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Agendando...
                </>
              ) : (
                'Agendar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
