import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { password } = await req.json()

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter no minimo 6 caracteres' }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    // Get auth_id from app_users
    const { data: user } = await supabase.from('app_users').select('auth_id').eq('id', id).single()
    if (!user?.auth_id) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 })
    }

    // Reset password via admin API
    const { error } = await supabase.auth.admin.updateUserById(user.auth_id, { password })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
