import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const supabase = getServiceSupabase()

    const updates: Record<string, unknown> = {}
    if (body.permissions !== undefined) updates.permissions = body.permissions
    if (body.role !== undefined) updates.role = body.role
    if (body.role_template_id !== undefined) updates.role_template_id = body.role_template_id
    if (body.active !== undefined) updates.active = body.active
    if (body.name !== undefined) updates.name = body.name

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    const { error } = await supabase.from('app_users').update(updates).eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = getServiceSupabase()

    // Get auth_id before deleting app_users row
    const { data: user } = await supabase.from('app_users').select('auth_id, role').eq('id', id).single()
    if (!user) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 })
    }
    if (user.role === 'admin') {
      return NextResponse.json({ error: 'Nao e possivel deletar um admin' }, { status: 403 })
    }

    // Delete app_users row
    const { error: dbErr } = await supabase.from('app_users').delete().eq('id', id)
    if (dbErr) {
      return NextResponse.json({ error: dbErr.message }, { status: 400 })
    }

    // Delete auth user
    if (user.auth_id) {
      await supabase.auth.admin.deleteUser(user.auth_id)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
