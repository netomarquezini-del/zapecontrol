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
  accentColor = 'text-emerald-400',
}: KpiCardProps) {
  const progressBarColor =
    progress !== undefined
      ? progress >= 100
        ? 'bg-emerald-500'
        : progress >= 70
          ? 'bg-yellow-500'
          : 'bg-red-500'
      : ''

  return (
    <div className="card p-5 flex flex-col gap-3 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${accentColor} bg-white/5`}
          >
            <Icon size={18} />
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {title}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {value}
        </span>
        {subtitle && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </span>
        )}
      </div>

      {progress !== undefined && (
        <div className="flex flex-col gap-1.5">
          <div className="w-full h-2 rounded-full" style={{ background: 'var(--border-color)' }}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressBarColor}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {progress.toFixed(1)}% da meta
          </span>
        </div>
      )}
    </div>
  )
}
