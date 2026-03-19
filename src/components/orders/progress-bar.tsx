'use client'

import { cn } from '@/lib/utils'

interface ProgressBarProps {
  percent: number
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export function ProgressBar({ percent, showLabel = true, size = 'md' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))

  const colorClass =
    clamped >= 100
      ? 'bg-green-500'
      : clamped >= 50
        ? 'bg-yellow-500'
        : 'bg-red-500'

  return (
    <div className="flex items-center gap-2">
      <div className={cn('flex-1 bg-gray-100 rounded-full overflow-hidden', size === 'sm' ? 'h-2' : 'h-3')}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorClass)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn('font-medium tabular-nums', size === 'sm' ? 'text-xs w-10' : 'text-sm w-12', 'text-right')}>
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  )
}
