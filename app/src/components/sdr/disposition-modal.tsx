'use client'

import { useState } from 'react'
import {
  PhoneCall,
  PhoneMissed,
  CalendarPlus,
  ThumbsDown,
  PhoneOff,
  Voicemail,
  X,
  Loader2,
} from 'lucide-react'
import type { SdrCallDisposition } from '@/lib/types-sdr'

interface DispositionModalProps {
  isOpen: boolean
  onClose: () => void
  callId: string
  leadName: string
  onDisposition: (disposition: SdrCallDisposition, notes?: string) => void
}

const DISPOSITIONS: {
  value: SdrCallDisposition
  label: string
  icon: React.ReactNode
  color: string
  bgColor: string
  hoverColor: string
}[] = [
  {
    value: 'atendeu',
    label: 'Atendeu',
    icon: <PhoneCall size={20} />,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    hoverColor: 'hover:bg-emerald-500/20',
  },
  {
    value: 'nao_atendeu',
    label: 'Nao Atendeu',
    icon: <PhoneMissed size={20} />,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10',
    hoverColor: 'hover:bg-zinc-500/20',
  },
  {
    value: 'agendar',
    label: 'Agendar',
    icon: <CalendarPlus size={20} />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    hoverColor: 'hover:bg-blue-500/20',
  },
  {
    value: 'sem_interesse',
    label: 'Sem Interesse',
    icon: <ThumbsDown size={20} />,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    hoverColor: 'hover:bg-red-500/20',
  },
  {
    value: 'numero_errado',
    label: 'Numero Errado',
    icon: <PhoneOff size={20} />,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    hoverColor: 'hover:bg-orange-500/20',
  },
  {
    value: 'caixa_postal',
    label: 'Caixa Postal',
    icon: <Voicemail size={20} />,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    hoverColor: 'hover:bg-yellow-500/20',
  },
]

export default function DispositionModal({
  isOpen,
  onClose,
  callId,
  leadName,
  onDisposition,
}: DispositionModalProps) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedDisposition, setSelectedDisposition] = useState<SdrCallDisposition | null>(null)

  if (!isOpen) return null

  async function handleDisposition(disposition: SdrCallDisposition) {
    setLoading(true)
    setSelectedDisposition(disposition)
    try {
      const res = await fetch(`/api/sdr/calls/${callId}/disposition`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disposition,
          notes: notes.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        console.error('[disposition-modal] Error:', data.error)
      }

      onDisposition(disposition, notes.trim() || undefined)
      setNotes('')
      setSelectedDisposition(null)
      onClose()
    } catch (err) {
      console.error('[disposition-modal] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-xl border border-[#222222] bg-[#0a0a0a] p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Disposicao</h3>
            <p className="text-sm text-zinc-500">{leadName}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Disposition buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {DISPOSITIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => handleDisposition(d.value)}
              disabled={loading}
              className={`flex items-center gap-3 rounded-lg border border-[#222222] px-4 py-3 text-left transition-all ${d.bgColor} ${d.hoverColor} ${d.color} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading && selectedDisposition === d.value ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                d.icon
              )}
              <span className="text-sm font-medium">{d.label}</span>
            </button>
          ))}
        </div>

        {/* Notes */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observacoes (opcional)..."
          rows={2}
          className="w-full rounded-lg border border-[#222222] bg-[#111111] px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:border-lime-400/50 focus:outline-none resize-none"
        />
      </div>
    </div>
  )
}
