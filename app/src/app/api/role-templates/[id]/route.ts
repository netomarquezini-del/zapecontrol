import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const supabase = getServiceSupabase()

    // Check if system template
    const { data: tmpl } = await supabase.from('role_templates').select('is_system').eq('id', id).single()
    if (tmpl?.is_system) {
      return NextResponse.json({ error: 'Nao e possivel editar template do sistema' }, { status: 403 })
    }

    const updates: Record<string, unknown> = {}
    if (body.label !== undefined) updates.label = body.label
    if (body.description !== undefined) updates.description = body.description
    if (body.permissions !== undefined) updates.permissions = body.permissions

    const { error } = await supabase.from('role_templates').update(updates).eq('id', id)
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

    // Check if system template
    const { data: tmpl } = await supabase.from('role_templates').select('is_system').eq('id', id).single()
    if (tmpl?.is_system) {
      return NextResponse.json({ error: 'Nao e possivel deletar template do sistema' }, { status: 403 })
    }

    const { error } = await supabase.from('role_templates').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
