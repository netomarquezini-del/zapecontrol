'use client'

import { Badge } from '@/components/ui/badge'
import { OrderStatus } from '@/types'

const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  aberto: { label: 'Aberto', variant: 'outline' },
  parcial: { label: 'Parcial', variant: 'secondary' },
  concluido: { label: 'Concluído', variant: 'default' },
  cancelado: { label: 'Cancelado', variant: 'destructive' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
