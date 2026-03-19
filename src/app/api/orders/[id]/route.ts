import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionUser, hasPermission } from '@/lib/auth/permissions'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!hasPermission(user.role, 'view_orders_dashboard')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      creator:users!orders_created_by_fkey(id, name),
      items:order_items(
        *,
        product:products(id, name, sku, photo_url, type)
      )
    `)
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

  // Get delivery progress for each item
  const { data: progress } = await supabase
    .from('order_items_progress')
    .select('*')
    .eq('order_id', params.id)

  // Get deliveries history
  const itemIds = data.items?.map((i: any) => i.id) || []
  const { data: deliveries } = await supabase
    .from('deliveries')
    .select(`
      *,
      creator:users!deliveries_created_by_fkey(id, name)
    `)
    .in('order_item_id', itemIds)
    .order('delivery_date', { ascending: false })

  return NextResponse.json({ ...data, progress, deliveries })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!hasPermission(user.role, 'manage_orders')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const supabase = createServerClient()

  // Check order is still open
  const { data: order } = await supabase
    .from('orders')
    .select('status')
    .eq('id', params.id)
    .single()

  if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  if (order.status !== 'aberto') {
    return NextResponse.json({ error: 'Só é possível editar pedidos com status "aberto"' }, { status: 400 })
  }

  const body = await req.json()
  const { items } = body

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'Pedido deve ter ao menos 1 item' }, { status: 400 })
  }

  // Delete old items and insert new ones
  await supabase.from('order_items').delete().eq('order_id', params.id)

  const orderItems = items.map((item: any) => ({
    order_id: params.id,
    product_id: item.product_id,
    quantity: item.quantity,
    priority: item.priority || 'normal',
  }))

  const { error } = await supabase.from('order_items').insert(orderItems)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('orders').update({ updated_at: new Date().toISOString() }).eq('id', params.id)

  return NextResponse.json({ success: true })
}
