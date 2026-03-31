'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Headphones,
  Users,
  Kanban,
  RefreshCw,
  BarChart3,
  Mic,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  Loader2,
} from 'lucide-react'
import type { SdrScheduleStatus } from '@/lib/types-sdr'

interface UpcomingSchedule {
  id: string
  status: SdrScheduleStatus
  scheduled_at: string
  sdr_leads: { id: string; nome: string; telefone: string; empresa: string | null } | null
}

const UPCOMING_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  agendado: { label: 'Agendado', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  confirmado: { label: 'Confirmado', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
}

const cards = [
  {
    href: '/comercial/sdr-station/inbox',
    icon: MessageSquare,
    title: 'Inbox',
    description: 'Central de mensagens multi-canal: WhatsApp e Instagram Direct.',
  },
  {
    href: '/comercial/sdr-station/leads',
    icon: Users,
    title: 'Leads',
    description: 'Gerencie seus leads, historico de contatos e informacoes.',
  },
  {
    href: '/comercial/sdr-station/pipeline',
    icon: Kanban,
    title: 'Pipeline',
    description: 'Visualize e mova leads entre etapas do funil.',
  },
  {
    href: '/comercial/sdr-station/cadencias',
    icon: RefreshCw,
    title: 'Cadencias',
    description: 'Configure sequencias automatizadas de contato.',
  },
  {
    href: '/comercial/sdr-station/metricas',
    icon: BarChart3,
    title: 'Metricas',
    description: 'Acompanhe performance, taxas e resultados.',
  },
  {
    href: '/comercial/sdr-station/gravacoes',
    icon: Mic,
    title: 'Gravacoes',
    description: 'Acesse gravacoes de chamadas e transcricoes com IA.',
  },
  {
    href: '/comercial/sdr-station/numeros',
    icon: Phone,
    title: 'Numeros',
    description: 'Gerencie numeros telefonicos e limites diarios.',
  },
  {
    href: '/comercial/sdr-station/agenda',
    icon: Calendar,
    title: 'Agenda',
    description: 'Agendamentos com closers, follow-ups e no-shows.',
  },
]

function formatScheduleTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

export default function SdrStationPage() {
  const [upcoming, setUpcoming] = useState<UpcomingSchedule[]>([])
  const [loadingUpcoming, setLoadingUpcoming] = useState(true)

  useEffect(() => {
    async function loadUpcoming() {
      try {
        const res = await fetch('/api/sdr/schedules/upcoming')
        if (res.ok) {
          const result = await res.json()
          setUpcoming(result.data || [])
        }
      } catch {
        console.warn('[sdr-station] Could not load upcoming schedules')
      } finally {
        setLoadingUpcoming(false)
      }
    }
    loadUpcoming()
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 lg:p-10">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-lime-400/10 border border-lime-400/20">
            <Headphones size={20} className="text-lime-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            SDR Station
          </h1>
        </div>
        <p className="text-sm text-zinc-500 ml-[52px]">
          Central de operacoes para prospecao ativa e qualificacao de leads.
        </p>
      </div>

      {/* Proximos Agendamentos */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-lime-400" />
          <h2 className="text-sm font-bold text-white">Proximos Agendamentos</h2>
          {upcoming.length > 0 && (
            <span className="ml-1 rounded-full bg-lime-400/10 px-2 py-0.5 text-[11px] font-medium text-lime-400">
              {upcoming.length}
            </span>
          )}
        </div>

        {loadingUpcoming ? (
          <div className="flex items-center gap-2 rounded-xl border border-[#222222] bg-[#111111] p-4">
            <Loader2 size={14} className="animate-spin text-zinc-500" />
            <span className="text-xs text-zinc-500">Carregando agendamentos...</span>
          </div>
        ) : upcoming.length === 0 ? (
          <div className="rounded-xl border border-[#222222] bg-[#111111] p-4 text-center">
            <p className="text-xs text-zinc-600">Nenhum agendamento para hoje ou amanha</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {upcoming.map((s) => {
              const cfg = UPCOMING_STATUS[s.status] || UPCOMING_STATUS.agendado
              const today = isToday(s.scheduled_at)

              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border border-[#222222] bg-[#111111] px-4 py-3 transition-colors hover:border-[#333333]"
                >
                  <div className="flex flex-col items-center min-w-[44px]">
                    <span className="text-sm font-bold text-white">
                      {formatScheduleTime(s.scheduled_at)}
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      {today ? 'Hoje' : 'Amanha'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 border-l border-[#222222] pl-3">
                    <p className="truncate text-sm font-medium text-white">
                      {s.sdr_leads?.nome || 'Lead'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${cfg.color} ${cfg.bg}`}
                      >
                        {cfg.label}
                      </span>
                      {s.sdr_leads?.empresa && (
                        <span className="truncate text-[10px] text-zinc-600">
                          {s.sdr_leads.empresa}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick-access cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-2xl border border-[#222222] bg-[#111111] p-6 transition-all duration-200 hover:border-lime-400/20 hover:bg-[#141414]"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-white/[0.04] border border-[#222222] group-hover:border-lime-400/15 group-hover:bg-lime-400/5 transition-all duration-200">
                <card.icon
                  size={18}
                  className="text-zinc-500 group-hover:text-lime-400 transition-colors duration-200"
                />
              </div>
              <h2 className="text-[15px] font-bold text-white">
                {card.title}
              </h2>
            </div>
            <p className="text-[13px] text-zinc-600 leading-relaxed">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
