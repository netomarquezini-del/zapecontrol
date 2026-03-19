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

  // Get all progress data for non-cancelled orders
  const { data: progress, error } = await supabase
    .from('order_items_progress')
    .select('*')
    .neq('order_status', 'cancelado')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Calculate stats
  const openOrderIds = new Set(
    (progress || [])
      .filter(p => p.order_status === 'aberto' || p.order_status === 'parcial')
      .map(p => p.order_id)
  )

  const activeItems = (progress || []).filter(
    p => p.order_status === 'aberto' || p.order_status === 'parcial'
  )

  const pendingItems = activeItems.filter(p => p.quantity_remaining > 0)
  const urgentItems = pendingItems.filter(p => p.priority === 'urgente' || p.priority === 'critico')

  const totalOrdered = activeItems.reduce((sum, p) => sum + p.quantity_ordered, 0)
  const totalDelivered = activeItems.reduce((sum, p) => sum + p.quantity_delivered, 0)
  const overallProgress = totalOrdered > 0 ? Math.round((totalDelivered / totalOrdered) * 100) : 0

  return NextResponse.json({
    openOrders: openOrderIds.size,
    pendingItems: pendingItems.length,
    overallProgress,
    urgentItems: urgentItems.length,
  })
}
