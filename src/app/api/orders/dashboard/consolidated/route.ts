import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionUser, hasPermission } from '@/lib/auth/permissions'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!hasPermission(user.role, 'view_orders_dashboard')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const supabase = createServerClient()

  const { data: progress, error } = await supabase
    .from('order_items_progress')
    .select('*')
    .in('order_status', ['aberto', 'parcial'])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Group by product
  const productMap = new Map<string, {
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
  }>()

  for (const item of progress || []) {
    const existing = productMap.get(item.product_id)
    if (existing) {
      existing.total_ordered += item.quantity_ordered
      existing.total_delivered += item.quantity_delivered
      existing.total_remaining += item.quantity_remaining
      existing.order_count = new Set([
        ...Array.from({ length: existing.order_count }, (_, i) => i),
        item.order_id
      ]).size
      if (item.priority === 'urgente') existing.has_urgent = true
      if (item.priority === 'critico') existing.has_critical = true
    } else {
      productMap.set(item.product_id, {
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        product_photo: item.product_photo,
        total_ordered: item.quantity_ordered,
        total_delivered: item.quantity_delivered,
        total_remaining: item.quantity_remaining,
        order_count: 1,
        has_urgent: item.priority === 'urgente',
        has_critical: item.priority === 'critico',
      })
    }
  }

  // Recalculate order_count correctly
  const ordersByProduct: Record<string, Set<string>> = {}
  for (const item of progress || []) {
    if (!ordersByProduct[item.product_id]) {
      ordersByProduct[item.product_id] = new Set()
    }
    ordersByProduct[item.product_id].add(item.order_id)
  }
  for (const productId of Object.keys(ordersByProduct)) {
    const entry = productMap.get(productId)
    if (entry) entry.order_count = ordersByProduct[productId].size
  }

  const consolidated = Array.from(productMap.values())
    .sort((a, b) => b.total_remaining - a.total_remaining)

  return NextResponse.json(consolidated)
}
