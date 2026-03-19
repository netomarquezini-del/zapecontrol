import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionUser, hasPermission } from '@/lib/auth/permissions'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!hasPermission(user.role, 'manage_priorities')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json()
  const { priority } = body

  if (!['normal', 'urgente', 'critico'].includes(priority)) {
    return NextResponse.json({ error: 'Prioridade inválida' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('order_items')
    .update({ priority })
    .eq('id', params.itemId)
    .eq('order_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
