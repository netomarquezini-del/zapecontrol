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

  // Get all item IDs for this order
  const { data: items } = await supabase
    .from('order_items')
    .select('id')
    .eq('order_id', params.id)

  if (!items?.length) return NextResponse.json([])

  const itemIds = items.map(i => i.id)

  const { data, error } = await supabase
    .from('deliveries')
    .select(`
      *,
      creator:users!deliveries_created_by_fkey(id, name),
      order_item:order_items(
        id,
        product:products(id, name, sku, photo_url)
      )
    `)
    .in('order_item_id', itemIds)
    .order('delivery_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!hasPermission(user.role, 'launch_deliveries')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json()
  const { entries, delivery_date } = body

  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json({ error: 'Informe ao menos 1 entrega' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Validate quantities don't exceed remaining
  const { data: progress } = await supabase
    .from('order_items_progress')
    .select('*')
    .eq('order_id', params.id)

  if (!progress) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

  const progressMap = new Map(progress.map(p => [p.order_item_id, p]))

  for (const entry of entries) {
    if (!entry.order_item_id || !entry.quantity || entry.quantity <= 0) {
      return NextResponse.json({ error: 'Cada entrega deve ter item e quantidade > 0' }, { status: 400 })
    }
    const itemProgress = progressMap.get(entry.order_item_id)
    if (!itemProgress) {
      return NextResponse.json({ error: `Item ${entry.order_item_id} não encontrado no pedido` }, { status: 400 })
    }
    if (entry.quantity > itemProgress.quantity_remaining) {
      return NextResponse.json({
        error: `Quantidade excede saldo pendente para ${itemProgress.product_name} (saldo: ${itemProgress.quantity_remaining})`
      }, { status: 400 })
    }
  }

  // Insert deliveries
  const deliveries = entries.map((entry: any) => ({
    order_item_id: entry.order_item_id,
    quantity: entry.quantity,
    delivery_date: delivery_date || new Date().toISOString().split('T')[0],
    created_by: user.id,
    notes: entry.notes || null,
  }))

  const { error } = await supabase.from('deliveries').insert(deliveries)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true }, { status: 201 })
}
