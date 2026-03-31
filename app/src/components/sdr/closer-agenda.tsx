'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Calendar,
  Clock,
  Phone,
  Check,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronDown,
  User,
} from 'lucide-react'
import type { SdrScheduleStatus } from '@/lib/types-sdr'

interface ScheduleEntry {
  id: string
  lead_id: string
  closer_user_id: string | null
  sdr_user_id: string | null
  status: SdrScheduleStatus
  scheduled_at: string
  duration_minutes: number
  meeting_link: string | null
  notes: string | null
  sdr_leads: {
    id: string
    nome: string
    telefone: string
    empresa: string | null
  } | null
}

interface CloserAgendaProps {
  closerId?: string
}

const STATUS_CONFIG: Record<SdrScheduleStatus, { label: string; color: string; bg: string }> = {
  agendado: { label: 'Agendado', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  confirmado: { label: 'Confirmado', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  realizado: { label: 'Realizado', color: 'text-lime-400', bg: 'bg-lime-400/10' },
  no_show: { label: 'No-show', color: 'text-red-400', bg: 'bg-red-400/10' },
  cancelado: { label: 'Cancelado', color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()

  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  const dayAfterTomorrow = new Date(todayStart)
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

  const weekEnd = new Date(todayStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  if (date >= todayStart && date < tomorrowStart) return 'Hoje'
  if (date >= tomorrowStart && date < dayAfterTomorrow) return 'Amanha'
  if (date >= dayAfterTomorrow && date < weekEnd) return 'Esta semana'
  return 'Depois'
}

export default function CloserAgenda({ closerId: initialCloserId }: CloserAgendaProps) {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([])
  const [closers, setClosers] = useState<{ id: string; name: string }[]>([])
  const [selectedCloser, setSelectedCloser] = useState(initialCloserId || '')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Load closers
  useEffect(() => {
    async function loadClosers() {
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
        console.warn('[closer-agenda] Could not load closers')
      }
    }
    loadClosers()
  }, [])

  // Load schedules
  const loadSchedules = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCloser) params.set('closer_id', selectedCloser)

      const res = await fetch(`/api/sdr/schedules?${params.toString()}`)
      if (res.ok) {
        const result = await res.json()
        setSchedules(result.data || [])
      }
    } catch {
      console.error('[closer-agenda] Failed to load schedules')
    } finally {
      setLoading(false)
    }
  }, [selectedCloser])

  useEffect(() => {
    loadSchedules()
  }, [loadSchedules])

  // Status actions
  async function updateStatus(scheduleId: string, status: SdrScheduleStatus) {
    setActionLoading(scheduleId)
    try {
      const res = await fetch(`/api/sdr/schedules/${scheduleId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        await loadSchedules()
      }
    } catch {
      console.error('[closer-agenda] Failed to update status')
    } finally {
      setActionLoading(null)
    }
  }

  // Group schedules by date
  const grouped = schedules.reduce<Record<string, ScheduleEntry[]>>((acc, s) => {
    const group = getDateGroup(s.scheduled_at)
    if (!acc[group]) acc[group] = []
    acc[group].push(s)
    return acc
  }, {})

  const groupOrder = ['Hoje', 'Amanha', 'Esta semana', 'Depois']

  return (
    <div className="space-y-6">
      {/* Header + Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime-400/10 border border-lime-400/20">
            <Calendar size={18} className="text-lime-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Agenda</h2>
        </div>

        {/* Closer filter */}
        <div className="relative">
          <select
            value={selectedCloser}
            onChange={(e) => setSelectedCloser(e.target.value)}
            className="appearance-none rounded-lg border border-[#222222] bg-[#0a0a0a] py-2 pl-3 pr-8 text-sm text-white outline-none transition-colors focus:border-lime-400/40"
          >
            <option value="">Todos os closers</option>
            {closers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-zinc-500" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="rounded-xl border border-[#222222] bg-[#111111] p-8 text-center">
          <Calendar size={32} className="mx-auto mb-3 text-zinc-600" />
          <p className="text-sm text-zinc-500">Nenhum agendamento encontrado</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupOrder.map((group) => {
            const items = grouped[group]
            if (!items || items.length === 0) return null

            return (
              <div key={group}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {group}
                </h3>
                <div className="space-y-2">
                  {items.map((schedule) => {
                    const statusCfg = STATUS_CONFIG[schedule.status]
                    const lead = schedule.sdr_leads
                    const isActive = schedule.status === 'agendado' || schedule.status === 'confirmado'

                    return (
                      <div
                        key={schedule.id}
                        className="rounded-xl border border-[#222222] bg-[#111111] p-4 transition-colors hover:border-[#333333]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          {/* Left: Time + Lead info */}
                          <div className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <span className="text-lg font-bold text-white">
                                {formatTime(schedule.scheduled_at)}
                              </span>
                              <span className="text-[10px] text-zinc-600">
                                {formatDate(schedule.scheduled_at)}
                              </span>
                            </div>
                            <div className="border-l border-[#222222] pl-3">
                              <p className="text-sm font-medium text-white">
                                {lead?.nome || 'Lead desconhecido'}
                              </p>
                              {lead?.empresa && (
                                <p className="text-xs text-zinc-500">{lead.empresa}</p>
                              )}
                              <div className="mt-1 flex items-center gap-3">
                                {lead?.telefone && (
                                  <span className="flex items-center gap-1 text-xs text-zinc-500">
                                    <Phone size={10} />
                                    {lead.telefone}
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-xs text-zinc-500">
                                  <Clock size={10} />
                                  {schedule.duration_minutes}min
                                </span>
                              </div>
                              {schedule.notes && (
                                <p className="mt-1.5 text-xs text-zinc-600 italic">
                                  {schedule.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right: Status + Actions */}
                          <div className="flex flex-col items-end gap-2">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${statusCfg.color} ${statusCfg.bg}`}
                            >
                              {statusCfg.label}
                            </span>

                            {isActive && (
                              <div className="flex items-center gap-1">
                                {actionLoading === schedule.id ? (
                                  <Loader2 size={14} className="animate-spin text-zinc-500" />
                                ) : (
                                  <>
                                    {schedule.status === 'agendado' && (
                                      <button
                                        onClick={() => updateStatus(schedule.id, 'confirmado')}
                                        title="Confirmar"
                                        className="rounded-md p-1.5 text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                                      >
                                        <Check size={14} />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => updateStatus(schedule.id, 'realizado')}
                                      title="Realizado"
                                      className="rounded-md p-1.5 text-lime-400 hover:bg-lime-400/10 transition-colors"
                                    >
                                      <User size={14} />
                                    </button>
                                    <button
                                      onClick={() => updateStatus(schedule.id, 'no_show')}
                                      title="No-show"
                                      className="rounded-md p-1.5 text-amber-400 hover:bg-amber-400/10 transition-colors"
                                    >
                                      <AlertTriangle size={14} />
                                    </button>
                                    <button
                                      onClick={() => updateStatus(schedule.id, 'cancelado')}
                                      title="Cancelar"
                                      className="rounded-md p-1.5 text-red-400 hover:bg-red-400/10 transition-colors"
                                    >
                                      <XCircle size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
