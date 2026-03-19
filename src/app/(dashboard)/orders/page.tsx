'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useFetch } from '@/hooks/use-fetch'
import { Order, UserRole } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { ProgressBar } from '@/components/orders/progress-bar'
import { PriorityBadge } from '@/components/orders/priority-badge'
import { Plus, ClipboardList, Eye, Ban } from 'lucide-react'

export default function OrdersPage() {
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role as UserRole | undefined

  const [statusFilter, setStatusFilter] = useState('todos')
  const { data: orders, loading, refetch } = useFetch<Order[]>(
    `/api/orders?status=${statusFilter}`
  )

  const canCreate = userRole === 'admin' || userRole === 'gerente'

  function calculateProgress(order: Order) {
    if (!order.items?.length) return 0
    // Simple estimation - will be more accurate with progress data
    return 0
  }

  async function handleCancel(orderId: string) {
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) return
    await fetch(`/api/orders/${orderId}/cancel`, { method: 'PATCH' })
    refetch()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        {canCreate && (
          <Link href="/orders/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Novo Pedido
            </Button>
          </Link>
        )}
      </div>

      <div className="flex gap-4 items-end">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setTimeout(refetch, 100) }}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="aberto">Aberto</SelectItem>
              <SelectItem value="parcial">Parcial</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !orders?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const totalItems = order.items?.length || 0
            const totalQty = order.items?.reduce((s, i) => s + i.quantity, 0) || 0
            const hasUrgent = order.items?.some(i => i.priority === 'urgente' || i.priority === 'critico')

            return (
              <div
                key={order.id}
                className={`bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow ${
                  hasUrgent ? 'border-l-4 border-l-orange-400' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold text-lg">{order.code}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')} — {totalItems} produto(s), {totalQty.toLocaleString('pt-BR')} unidade(s)
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                    {order.items?.map(item =>
                      item.priority !== 'normal' ? (
                        <PriorityBadge key={item.id} priority={item.priority} />
                      ) : null
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" /> Detalhes
                      </Button>
                    </Link>
                    {userRole === 'admin' && order.status !== 'cancelado' && order.status !== 'concluido' && (
                      <Button variant="outline" size="sm" onClick={() => handleCancel(order.id)}>
                        <Ban className="h-4 w-4 mr-1" /> Cancelar
                      </Button>
                    )}
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm bg-gray-50 rounded px-2 py-1">
                        {item.product?.photo_url && (
                          <img src={item.product.photo_url} alt="" className="w-6 h-6 rounded object-cover" />
                        )}
                        <span className="truncate">{item.product?.name}</span>
                        <span className="text-muted-foreground ml-auto">×{item.quantity.toLocaleString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
