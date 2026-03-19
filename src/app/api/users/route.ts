import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServerClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/permissions'

export async function GET() {
  const { error, user } = await requirePermission('manage_users')
  if (error) return error

  const supabase = createServerClient()
  const { data, error: dbError } = await supabase
    .from('users')
    .select('id, email, name, role, is_active, created_at')
    .order('created_at', { ascending: false })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { error, user } = await requirePermission('manage_users')
  if (error) return error

  const body = await req.json()
  const { email, name, password, role } = body

  if (!email || !name || !password || !role) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }

  const password_hash = await bcrypt.hash(password, 10)
  const supabase = createServerClient()

  const { data, error: dbError } = await supabase
    .from('users')
    .insert({ email, name, password_hash, role })
    .select('id, email, name, role, is_active, created_at')
    .single()

  if (dbError) {
    if (dbError.code === '23505') {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })
    }
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
