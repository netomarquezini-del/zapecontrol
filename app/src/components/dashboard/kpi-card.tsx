'use client'

import { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  icon: LucideIcon
  title: string
  value: string
  subtitle?: string
  progress?: number // 0-100
  accentColor?: string // tailwind color class
}

export default function KpiCard({
  icon: Icon,
  title,
  value,
  subtitle,
  progress,
  accentColor = 'text-lime-400',
}: KpiCardProps) {
  const progressBarColor =
    progress !== undefined
      ? progress >= 100
        ? 'bg-lime-500'
        : progress >= 70
          ? 'bg-yellow-500'
          : 'bg-red-500'
      : ''

  return (
    <div className={`card p-5 flex flex-col gap-4 transition-all duration-300 group ${progress !== undefined && progress >= 100 ? 'border-lime-400/30 shadow-[0_0_20px_rgba(163,230,53,0.08)]' : ''}`}>
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${accentColor} bg-white/[0.04] border border-white/[0.06] group-hover:bg-white/[0.06] transition-colors duration-300`}
        >
          <Icon size={18} strokeWidth={1.5} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-label">
          {title}
        </span>
        <span className="text-2xl font-extrabold tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>
          {value}
        </span>
        {subtitle && (
          <span className="text-[11px] font-normal" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </span>
        )}
      </div>

      {progress !== undefined && (
        <div className="flex flex-col gap-2">
          <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--border-color)' }}>
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${progressBarColor}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
            {progress.toFixed(1)}% da meta
          </span>
        </div>
      )}
    </div>
  )
}
