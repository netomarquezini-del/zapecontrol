import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, permissions } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nome, email e senha sao obrigatorios' }, { status: 400 })
    }

    const supabase = getAdminClient()

    // Create auth user via admin API (no rate limit, no email confirmation)
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: role || 'viewer' },
    })

    if (authErr) {
      return NextResponse.json({ error: authErr.message }, { status: 400 })
    }

    const authId = authData.user?.id
    if (!authId) {
      return NextResponse.json({ error: 'User ID nao retornado' }, { status: 500 })
    }

    // Create app_users row
    const { error: dbErr } = await supabase.from('app_users').insert({
      auth_id: authId,
      email,
      name,
      role: role || 'viewer',
      permissions: permissions || ['dashboard'],
      active: true,
    })

    if (dbErr) {
      return NextResponse.json({ error: dbErr.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, authId })
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
