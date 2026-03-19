'use client'

import { Badge } from '@/components/ui/badge'
import { Priority } from '@/types'
import { cn } from '@/lib/utils'

const priorityConfig: Record<Priority, { label: string; icon: string; className: string }> = {
  normal: { label: 'Normal', icon: '', className: 'bg-gray-100 text-gray-700' },
  urgente: { label: 'Urgente', icon: '⚡', className: 'bg-orange-100 text-orange-700 border-orange-300' },
  critico: { label: 'Crítico', icon: '🔴', className: 'bg-red-100 text-red-700 border-red-300' },
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === 'normal') return null
  const config = priorityConfig[priority]
  return (
    <Badge variant="outline" className={cn('text-xs', config.className)}>
      {config.icon} {config.label}
    </Badge>
  )
}
