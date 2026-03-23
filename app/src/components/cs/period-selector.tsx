'use client'

import { useMemo } from 'react'
import { Calendar } from 'lucide-react'

interface PeriodSelectorProps {
  from: Date
  to: Date
  onChange: (from: Date, to: Date) => void
}

type QuickPeriod = 'hoje' | 'ontem' | '7dias' | 'mes'

/** Get current date/time in São Paulo timezone */
function spNow(): Date {
  const str = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  return new Date(str)
}

/** Build a Date at 00:00 São Paulo time for a given SP date */
function spStartOfDay(d: Date): Date {
  const sp = new Date(d.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  sp.setHours(0, 0, 0, 0)
  return sp
}

/** Build a Date at 23:59:59 São Paulo time for a given SP date */
function spEndOfDay(d: Date): Date {
  const sp = new Date(d.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  sp.setHours(23, 59, 59, 999)
  return sp
}

function getQuickRange(key: QuickPeriod): { from: Date; to: Date } {
  const now = spNow()
  switch (key) {
    case 'hoje': {
      const from = spStartOfDay(now)
      return { from, to: now }
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

function detectActive(from: Date, to: Date): QuickPeriod | null {
  for (const btn of QUICK_BUTTONS) {
    const range = getQuickRange(btn.key)
    // Compare only the date part for from, and allow ~2min tolerance on to
    if (
      toInputDate(from) === toInputDate(range.from) &&
      from.getHours() === range.from.getHours() &&
      from.getMinutes() === range.from.getMinutes()
    ) {
      // For "ontem" check end of day
      if (btn.key === 'ontem') {
        if (toInputDate(to) === toInputDate(range.to) && to.getHours() === 23) return 'ontem'
      } else {
        // For "hoje", "7dias", "mes" — to is "now", so just check same date
        if (toInputDate(to) === toInputDate(range.to)) return btn.key
      }
    }
  }
  return null
}

export default function PeriodSelector({ from, to, onChange }: PeriodSelectorProps) {
  const activeKey = useMemo(() => detectActive(from, to), [from, to])

  const handleQuick = (key: QuickPeriod) => {
    const range = getQuickRange(key)
    onChange(range.from, range.to)
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
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#222222] bg-[#111111] p-1">
      {/* Quick buttons */}
      {QUICK_BUTTONS.map((btn) => (
        <button
          key={btn.key}
          onClick={() => handleQuick(btn.key)}
          className={`rounded-lg px-4 py-2 text-[12px] font-bold transition-all cursor-pointer ${
            activeKey === btn.key
              ? 'bg-lime-400/10 text-lime-400 border border-lime-400/20'
              : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
          }`}
        >
          {btn.label}
        </button>
      ))}

      {/* Separator */}
      <div className="h-6 w-px bg-[#222222] mx-1" />

      {/* Custom date inputs */}
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-zinc-600 flex-shrink-0" />
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-bold uppercase text-zinc-600">De</label>
          <input
            type="date"
            value={toInputDate(from)}
            onChange={handleFromChange}
            className="rounded-lg border border-[#222222] bg-[#0a0a0a] px-3 py-2 text-[12px] font-semibold text-white outline-none focus:border-lime-400/30 transition-colors [color-scheme:dark]"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-bold uppercase text-zinc-600">Até</label>
          <input
            type="date"
            value={toInputDate(to)}
            onChange={handleToChange}
            className="rounded-lg border border-[#222222] bg-[#0a0a0a] px-3 py-2 text-[12px] font-semibold text-white outline-none focus:border-lime-400/30 transition-colors [color-scheme:dark]"
          />
        </div>
      </div>
    </div>
  )
}

/** Helper to get today's start in SP timezone — use as initial state */
export function getTodayStartSP(): Date {
  return spStartOfDay(spNow())
}
