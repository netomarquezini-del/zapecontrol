'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useFetch } from '@/hooks/use-fetch'
import { OrderItemProgress } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PriorityBadge } from '@/components/orders/priority-badge'
import { ProgressBar } from '@/components/orders/progress-bar'
import { ArrowLeft, Save, Package, Truck } from 'lucide-react'

interface OrderWithProgress {
  id: string
  code: string
  status: string
  progress: OrderItemProgress[]
}

interface DeliveryEntry {
  order_item_id: string
  quantity: number
}

export default function DeliverPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const { data: order, loading } = useFetch<OrderWithProgress>(`/api/orders/${orderId}`)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [entries, setEntries] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)

  // Filter only items with remaining quantity, sorted by priority
  const pendingItems = (order?.progress || [])
    .filter(p => p.quantity_remaining > 0)
    .sort((a, b) => {
      const w: Record<string, number> = { critico: 3, urgente: 2, normal: 1 }
      return (w[b.priority] || 0) - (w[a.priority] || 0)
    })

  function updateEntry(itemId: string, qty: number) {
    setEntries(prev => ({ ...prev, [itemId]: qty }))
  }

  async function handleSave() {
    const deliveryEntries: DeliveryEntry[] = Object.entries(entries)
      .filter(([_, qty]) => qty > 0)
      .map(([order_item_id, quantity]) => ({ order_item_id, quantity }))

    if (!deliveryEntries.length) {
      alert('Informe a quantidade entregue de ao menos 1 produto')
      return
    }

    setSaving(true)
    const res = await fetch(`/api/orders/${orderId}/deliveries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: deliveryEntries, delivery_date: date }),
    })

    if (res.ok) {
      router.push(`/orders/${orderId}`)
    } else {
      const err = await res.json()
      alert(err.error || 'Erro ao registrar entrega')
    }
    setSaving(false)
  }

  if (loading) return <p className="text-muted-foreground">Carregando...</p>
  if (!order) return <p className="text-muted-foreground">Pedido não encontrado</p>

  const totalDelivering = Object.values(entries).reduce((s, q) => s + (q || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/orders/${orderId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Lançar Entrega</h1>
          <p className="text-sm text-muted-foreground">Pedido {order.code}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="flex gap-4 items-end">
          <div className="space-y-2">
            <Label>Data da Entrega</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        {pendingItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Truck className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Todos os itens já foram entregues!</p>
          </div>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 text-sm text-muted-foreground">
                    <th className="p-3 text-left">Produto</th>
                    <th className="p-3 text-center">Pedido</th>
                    <th className="p-3 text-center">Entregue</th>
                    <th className="p-3 text-center">Falta</th>
                    <th className="p-3 text-center w-32">Progresso</th>
                    <th className="p-3 text-center">Prior.</th>
                    <th className="p-3 text-center w-32">Entregar</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingItems.map((item) => (
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
                      <td className="p-3 text-center">{item.quantity_ordered.toLocaleString('pt-BR')}</td>
                      <td className="p-3 text-center text-green-600">{item.quantity_delivered.toLocaleString('pt-BR')}</td>
                      <td className="p-3 text-center text-red-600 font-medium">{item.quantity_remaining.toLocaleString('pt-BR')}</td>
                      <td className="p-3">
                        <ProgressBar percent={item.progress_percent} size="sm" />
                      </td>
                      <td className="p-3 text-center">
                        <PriorityBadge priority={item.priority} />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          min="0"
                          max={item.quantity_remaining}
                          value={entries[item.order_item_id] || ''}
                          onChange={(e) => updateEntry(item.order_item_id, parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="text-center"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {totalDelivering > 0
                  ? `${totalDelivering.toLocaleString('pt-BR')} unidade(s) sendo entregue(s)`
                  : 'Informe as quantidades entregues'
                }
              </p>
              <Button onClick={handleSave} disabled={saving || totalDelivering === 0} size="lg">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Registrando...' : 'Registrar Entrega'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
