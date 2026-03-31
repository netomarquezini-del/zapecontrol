'use client'

import { useEffect, useState } from 'react'
import { Phone, MessageSquare, StickyNote, Calendar, Loader2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import type { SdrInteraction, SdrInteractionType } from '@/lib/types-sdr'

interface LeadTimelineProps {
  leadId: string
}

const TYPE_CONFIG: Record<SdrInteractionType, { icon: typeof Phone; label: string; color: string }> = {
  call: { icon: Phone, label: 'Ligacao', color: 'text-blue-400' },
  message: { icon: MessageSquare, label: 'Mensagem', color: 'text-emerald-400' },
  note: { icon: StickyNote, label: 'Nota', color: 'text-yellow-400' },
  schedule: { icon: Calendar, label: 'Agendamento', color: 'text-indigo-400' },
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function LeadTimeline({ leadId }: LeadTimelineProps) {
  const [interactions, setInteractions] = useState<SdrInteraction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInteractions() {
      setLoading(true)
      try {
        const supabase = getSupabase()
        const { data, error } = await supabase
          .from('sdr_interactions')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching interactions:', error.message)
        } else {
          setInteractions(data || [])
        }
      } catch (err) {
        console.error('Error fetching interactions:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchInteractions()
  }, [leadId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-zinc-500" />
      </div>
    )
  }

  if (interactions.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-zinc-500">Nenhuma interacao registrada</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-[#222222]" />

      <div className="space-y-4">
        {interactions.map((interaction) => {
          const config = TYPE_CONFIG[interaction.type] || TYPE_CONFIG.note
          const Icon = config.icon

          return (
            <div key={interaction.id} className="relative flex items-start gap-4 pl-2">
              <div
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#111111] border border-[#222222] ${config.color}`}
              >
                <Icon size={14} />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium ${config.color}`}>
                    {config.label}
                  </span>
                  <span className="text-xs text-zinc-600">
                    {formatDate(interaction.created_at)}
                  </span>
                </div>
                {interaction.summary && (
                  <p className="text-sm text-zinc-400">{interaction.summary}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
