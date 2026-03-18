import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = createServerClient()

  // Check ownership or admin
  const { data: entry } = await supabase
    .from('production_entries')
    .select('created_by, production_date')
    .eq('id', params.id)
    .single()

  if (!entry) return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 })

  const today = new Date().toISOString().split('T')[0]
  if (entry.production_date !== today && user.role !== 'admin') {
    return NextResponse.json({ error: 'Só pode editar lançamentos do dia atual' }, { status: 403 })
  }
  if (entry.created_by !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Só pode editar seus próprios lançamentos' }, { status: 403 })
  }

  const body = await req.json()
  const { data, error } = await supabase
    .from('production_entries')
    .update({ quantity: body.quantity, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Somente admin pode excluir lançamentos' }, { status: 403 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('production_entries')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
