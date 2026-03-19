'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useFetch } from '@/hooks/use-fetch'
import { Order, OrderItemProgress, Delivery, UserRole, Priority } from '@/types'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { PriorityBadge } from '@/components/orders/priority-badge'
import { ProgressBar } from '@/components/orders/progress-bar'
import { ArrowLeft, Truck, Package } from 'lucide-react'

interface OrderDetail extends Order {
  progress: OrderItemProgress[]
  deliveries: (Delivery & { order_item: any })[]
}

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role as UserRole | undefined

  const { data: order, loading, refetch } = useFetch<OrderDetail>(`/api/orders/${orderId}`)

  const canDeliver = userRole === 'admin' || userRole === 'gerente' || userRole === 'fabrica'
  const canManagePriority = userRole === 'admin' || userRole === 'gerente'

  async function handlePriorityChange(itemId: string, priority: Priority) {
    await fetch(`/api/orders/${orderId}/items/${itemId}/priority`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority }),
    })
    refetch()
  }

  if (loading) return <p className="text-muted-foreground">Carregando...</p>
  if (!order) return <p className="text-muted-foreground">Pedido não encontrado</p>

  const totalOrdered = order.progress?.reduce((s, p) => s + p.quantity_ordered, 0) || 0
  const totalDelivered = order.progress?.reduce((s, p) => s + p.quantity_delivered, 0) || 0
  const overallPercent = totalOrdered > 0 ? Math.round((totalDelivered / totalOrdered) * 100) : 0

  // Sort progress by priority (critico > urgente > normal), then by remaining desc
  const sortedProgress = [...(order.progress || [])].sort((a, b) => {
    const priorityWeight: Record<string, number> = { critico: 3, urgente: 2, normal: 1 }
    const diff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0)
    if (diff !== 0) return diff
    return b.quantity_remaining - a.quantity_remaining
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{order.code}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Criado em {new Date(order.created_at).toLocaleDateString('pt-BR')}
            {order.creator && ` por ${order.creator.name}`}
          </p>
        </div>
        {canDeliver && order.status !== 'concluido' && order.status !== 'cancelado' && (
          <Link href={`/orders/${orderId}/deliver`}>
            <Button>
              <Truck className="h-4 w-4 mr-2" /> Lançar Entrega
            </Button>
          </Link>
        )}
      </div>

      {/* Overall Progress */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Progresso Geral</p>
          <p className="text-sm text-muted-foreground">
            {totalDelivered.toLocaleString('pt-BR')} / {totalOrdered.toLocaleString('pt-BR')} unidades
          </p>
        </div>
        <ProgressBar percent={overallPercent} />
      </div>

      {/* Items Progress */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold">Itens do Pedido</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b text-sm text-muted-foreground">
              <th className="p-3 text-left">Produto</th>
              <th className="p-3 text-center">Pedido</th>
              <th className="p-3 text-center">Entregue</th>
              <th className="p-3 text-center">Falta</th>
              <th className="p-3 text-center w-48">Progresso</th>
              <th className="p-3 text-center">Prioridade</th>
            </tr>
          </thead>
          <tbody>
            {sortedProgress.map((item) => (
              <tr
                key={item.order_item_id}
                className={`border-b last:border-0 ${
                  item.priority === 'critico' ? 'bg-red-50' :
                  item.priority === 'urgente' ? 'bg-orange-50' : ''
                }`}
              >
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {item.product_photo ? (
                      <img src={item.product_photo} alt="" className="w-10 h-10 rounded object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {item.product_sku}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-center font-medium">{item.quantity_ordered.toLocaleString('pt-BR')}</td>
                <td className="p-3 text-center text-green-600 font-medium">{item.quantity_delivered.toLocaleString('pt-BR')}</td>
                <td className="p-3 text-center text-red-600 font-medium">
                  {item.quantity_remaining > 0 ? item.quantity_remaining.toLocaleString('pt-BR') : '✅'}
                </td>
                <td className="p-3">
                  <ProgressBar percent={item.progress_percent} />
                </td>
                <td className="p-3 text-center">
                  {canManagePriority ? (
                    <Select
                      value={item.priority}
                      onValueChange={(v) => handlePriorityChange(item.order_item_id, v as Priority)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="urgente">⚡ Urgente</SelectItem>
                        <SelectItem value="critico">🔴 Crítico</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <PriorityBadge priority={item.priority} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delivery History */}
      {order.deliveries && order.deliveries.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold">Histórico de Entregas</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b text-sm text-muted-foreground">
                <th className="p-3 text-left">Data</th>
                <th className="p-3 text-left">Produto</th>
                <th className="p-3 text-center">Quantidade</th>
                <th className="p-3 text-left">Registrado por</th>
                <th className="p-3 text-left">Observações</th>
              </tr>
            </thead>
            <tbody>
              {order.deliveries.map((delivery) => (
                <tr key={delivery.id} className="border-b last:border-0">
                  <td className="p-3">{new Date(delivery.delivery_date).toLocaleDateString('pt-BR')}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {delivery.order_item?.product?.photo_url && (
                        <img src={delivery.order_item.product.photo_url} alt="" className="w-6 h-6 rounded object-cover" />
                      )}
                      <span>{delivery.order_item?.product?.name || '-'}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center font-medium">{delivery.quantity.toLocaleString('pt-BR')}</td>
                  <td className="p-3 text-muted-foreground">{delivery.creator?.name || '-'}</td>
                  <td className="p-3 text-muted-foreground text-sm">{delivery.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
