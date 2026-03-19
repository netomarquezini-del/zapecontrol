import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; deliveryId: string } }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = createServerClient()

  // Check delivery exists and user can edit
  const { data: delivery } = await supabase
    .from('deliveries')
    .select('*')
    .eq('id', params.deliveryId)
    .single()

  if (!delivery) return NextResponse.json({ error: 'Entrega não encontrada' }, { status: 404 })

  // Only author or admin can edit, and only same day
  const today = new Date().toISOString().split('T')[0]
  if (delivery.created_by !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão para editar esta entrega' }, { status: 403 })
  }
  if (delivery.delivery_date !== today && user.role !== 'admin') {
    return NextResponse.json({ error: 'Só é possível editar entregas do mesmo dia' }, { status: 400 })
  }

  const body = await req.json()
  const { quantity } = body

  if (!quantity || quantity <= 0) {
    return NextResponse.json({ error: 'Quantidade deve ser > 0' }, { status: 400 })
  }

  const { error } = await supabase
    .from('deliveries')
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq('id', params.deliveryId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
