import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionUser, requirePermission } from '@/lib/auth/permissions'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('scoring_rules')
    .select('*')
    .order('priority', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { error } = await requirePermission('manage_scoring_rules')
  if (error) return error

  const body = await req.json()
  const supabase = createServerClient()

  const { data, error: dbError } = await supabase
    .from('scoring_rules')
    .insert(body)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
