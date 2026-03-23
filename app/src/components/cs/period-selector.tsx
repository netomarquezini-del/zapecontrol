'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'

interface PeriodSelectorProps {
  from: Date
  to: Date
  onChange: (from: Date, to: Date) => void
}

type QuickPeriod = 'hoje' | 'ontem' | '7dias' | 'mes'

function spNow(): Date {
  const str = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  return new Date(str)
}

function spStartOfDay(d: Date): Date {
  const sp = new Date(d.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  sp.setHours(0, 0, 0, 0)
  return sp
}

function spEndOfDay(d: Date): Date {
  const sp = new Date(d.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  sp.setHours(23, 59, 59, 999)
  return sp
}

function getQuickRange(key: QuickPeriod): { from: Date; to: Date } {
  const now = spNow()
  switch (key) {
    case 'hoje': {
      return { from: spStartOfDay(now), to: now }
    }
    case 'ontem': {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      return { from: spStartOfDay(yesterday), to: spEndOfDay(yesterday) }
    }
    case '7dias': {
      const ago = new Date(now)
      ago.setDate(ago.getDate() - 7)
      return { from: spStartOfDay(ago), to: now }
    }
    case 'mes': {
      const first = new Date(now)
      first.setDate(1)
      return { from: spStartOfDay(first), to: now }
    }
  }
}

const QUICK_BUTTONS: { key: QuickPeriod; label: string }[] = [
  { key: 'hoje', label: 'Hoje' },
  { key: 'ontem', label: 'Ontem' },
  { key: '7dias', label: '7 dias' },
  { key: 'mes', label: 'Este mês' },
]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toInputDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function formatDisplayDate(d: Date): string {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
}

function detectActive(from: Date, to: Date): QuickPeriod | null {
  for (const btn of QUICK_BUTTONS) {
    const range = getQuickRange(btn.key)
    if (
      toInputDate(from) === toInputDate(range.from) &&
      from.getHours() === range.from.getHours()
    ) {
      if (btn.key === 'ontem') {
        if (toInputDate(to) === toInputDate(range.to) && to.getHours() === 23) return 'ontem'
      } else {
        if (toInputDate(to) === toInputDate(range.to)) return btn.key
      }
    }
  }
  return null
}

function getDisplayLabel(from: Date, to: Date): string {
  const active = detectActive(from, to)
  if (active) {
    const labels: Record<QuickPeriod, string> = {
      hoje: 'Hoje',
      ontem: 'Ontem',
      '7dias': 'Últimos 7 dias',
      mes: 'Este mês',
    }
    return labels[active]
  }
  return `${formatDisplayDate(from)} — ${formatDisplayDate(to)}`
}

export default function PeriodSelector({ from, to, onChange }: PeriodSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const activeKey = useMemo(() => detectActive(from, to), [from, to])
  const displayLabel = useMemo(() => getDisplayLabel(from, to), [from, to])

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleQuick = (key: QuickPeriod) => {
    const range = getQuickRange(key)
    onChange(range.from, range.to)
    setOpen(false)
  }

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return
    const [y, m, d] = e.target.value.split('-').map(Number)
    const newFrom = new Date(y, m - 1, d, 0, 0, 0, 0)
    onChange(newFrom, to)
  }

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return
    const [y, m, d] = e.target.value.split('-').map(Number)
    const newTo = new Date(y, m - 1, d, 23, 59, 59, 999)
    onChange(from, newTo)
  }

  return (
    <div className="relative" ref={ref}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 rounded-xl border border-[#222222] bg-[#111111] px-4 py-2.5 text-[13px] font-bold text-white hover:border-lime-400/20 transition-all cursor-pointer"
      >
        <Calendar size={14} className="text-lime-400" />
        <span>{displayLabel}</span>
        <ChevronDown
          size={14}
          className={`text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[280px] rounded-2xl border border-[#222222] bg-[#0a0a0a] shadow-2xl shadow-black/50 overflow-hidden">
          {/* Quick Periods */}
          <div className="p-3 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 px-2 mb-2">
              Período rápido
            </p>
            {QUICK_BUTTONS.map((btn) => (
              <button
                key={btn.key}
                onClick={() => handleQuick(btn.key)}
                className={`w-full text-left rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all cursor-pointer ${
                  activeKey === btn.key
                    ? 'bg-lime-400/10 text-lime-400 border border-lime-400/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-[#222222]" />

          {/* Custom Range */}
          <div className="p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 px-2 mb-3">
              Período personalizado
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-zinc-500 w-8">De</label>
                <input
                  type="date"
                  value={toInputDate(from)}
                  onChange={handleFromChange}
                  className="flex-1 rounded-xl border border-[#222222] bg-[#111111] px-3 py-2.5 text-[12px] font-semibold text-white outline-none focus:border-lime-400/30 transition-colors [color-scheme:dark]"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-zinc-500 w-8">Até</label>
                <input
                  type="date"
                  value={toInputDate(to)}
                  onChange={handleToChange}
                  className="flex-1 rounded-xl border border-[#222222] bg-[#111111] px-3 py-2.5 text-[12px] font-semibold text-white outline-none focus:border-lime-400/30 transition-colors [color-scheme:dark]"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Helper to get today's start in SP timezone — use as initial state */
export function getTodayStartSP(): Date {
  return spStartOfDay(spNow())
}
