import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServerClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/permissions'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('manage_users')
  if (error) return error

  const body = await req.json()
  const { name, role, password, is_active } = body
  const supabase = createServerClient()

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (name !== undefined) updates.name = name
  if (role !== undefined) updates.role = role
  if (is_active !== undefined) updates.is_active = is_active
  if (password) updates.password_hash = await bcrypt.hash(password, 10)

  const { data, error: dbError } = await supabase
    .from('users')
    .update(updates)
    .eq('id', params.id)
    .select('id, email, name, role, is_active, created_at')
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}
