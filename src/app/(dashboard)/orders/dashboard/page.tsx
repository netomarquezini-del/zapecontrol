'use client'

import { useState } from 'react'
import { useFetch } from '@/hooks/use-fetch'
import { OrderDashboardStats } from '@/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProgressBar } from '@/components/orders/progress-bar'
import { PriorityBadge } from '@/components/orders/priority-badge'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { ClipboardList, Package, TrendingUp, AlertTriangle, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ConsolidatedItem {
  product_id: string
  product_name: string
  product_sku: string
  product_photo: string | null
  total_ordered: number
  total_delivered: number
  total_remaining: number
  order_count: number
  has_urgent: boolean
  has_critical: boolean
}

interface OrderSummary {
  id: string
  code: string
  status: string
  created_at: string
  items: {
    id: string
    product_id: string
    quantity: number
    priority: string
    product: { id: string; name: string; sku: string; photo_url: string | null }
  }[]
}

export default function OrdersDashboardPage() {
  const { data: stats, loading: statsLoading } = useFetch<OrderDashboardStats>('/api/orders/dashboard')
  const { data: consolidated, loading: consolidatedLoading } = useFetch<ConsolidatedItem[]>('/api/orders/dashboard/consolidated')
  const { data: orders } = useFetch<OrderSummary[]>('/api/orders?status=todos')

  // Calculate per-order progress from items (approximation from order list)
  const activeOrders = (orders || []).filter(o => o.status === 'aberto' || o.status === 'parcial')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Acompanhamento de Pedidos</h1>

      {/* Stats Cards */}
      {statsLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<ClipboardList className="h-5 w-5" />}
            label="Pedidos Abertos"
            value={stats.openOrders}
            color="blue"
          />
          <StatCard
            icon={<Package className="h-5 w-5" />}
            label="Itens Pendentes"
            value={stats.pendingItems}
            color="orange"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Progresso Geral"
            value={`${stats.overallProgress}%`}
            color={stats.overallProgress >= 80 ? 'green' : stats.overallProgress >= 50 ? 'yellow' : 'red'}
          />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5" />}
            label="Urgentes"
            value={stats.urgentItems}
            color={stats.urgentItems > 0 ? 'red' : 'green'}
          />
        </div>
      )}

      {/* Tabs: By Order / Consolidated */}
      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Por Pedido</TabsTrigger>
          <TabsTrigger value="consolidated">Consolidado por Produto</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-3">
          {activeOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhum pedido aberto</p>
            </div>
          ) : (
            activeOrders.map((order) => {
              const totalQty = order.items?.reduce((s, i) => s + i.quantity, 0) || 0
              const hasUrgent = order.items?.some(i => i.priority === 'urgente' || i.priority === 'critico')
              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-lg border p-4 ${
                    hasUrgent ? 'border-l-4 border-l-orange-400' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{order.code}</p>
                      <OrderStatusBadge status={order.status as any} />
                      <span className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" /> Ver
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-2 w-48">
                          {item.product?.photo_url && (
                            <img src={item.product.photo_url} alt="" className="w-6 h-6 rounded object-cover" />
                          )}
                          <span className="truncate">{item.product?.name}</span>
                        </div>
                        <span className="text-muted-foreground w-24 text-right">
                          {item.quantity.toLocaleString('pt-BR')} un.
                        </span>
                        {item.priority !== 'normal' && (
                          <PriorityBadge priority={item.priority as any} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="consolidated">
          {consolidatedLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : !consolidated?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhum item pendente</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 text-sm text-muted-foreground">
                    <th className="p-3 text-left">Produto</th>
                    <th className="p-3 text-center">Total Pedido</th>
                    <th className="p-3 text-center">Entregue</th>
                    <th className="p-3 text-center">Falta</th>
                    <th className="p-3 text-center w-40">Progresso</th>
                    <th className="p-3 text-center">Pedidos</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidated.map((item) => {
                    const percent = item.total_ordered > 0
                      ? Math.round((item.total_delivered / item.total_ordered) * 100)
                      : 0
                    return (
                      <tr
                        key={item.product_id}
                        className={`border-b last:border-0 ${
                          item.has_critical ? 'bg-red-50' :
                          item.has_urgent ? 'bg-orange-50' : ''
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
                        <td className="p-3 text-center font-medium">{item.total_ordered.toLocaleString('pt-BR')}</td>
                        <td className="p-3 text-center text-green-600 font-medium">{item.total_delivered.toLocaleString('pt-BR')}</td>
                        <td className="p-3 text-center text-red-600 font-bold">{item.total_remaining.toLocaleString('pt-BR')}</td>
                        <td className="p-3">
                          <ProgressBar percent={percent} />
                        </td>
                        <td className="p-3 text-center text-muted-foreground">{item.order_count}</td>
                        <td className="p-3 text-center">
                          {item.has_critical && <PriorityBadge priority="critico" />}
                          {!item.has_critical && item.has_urgent && <PriorityBadge priority="urgente" />}
                          {!item.has_critical && !item.has_urgent && (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  color: 'blue' | 'green' | 'orange' | 'yellow' | 'red'
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>{icon}</div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
