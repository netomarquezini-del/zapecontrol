import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/permissions'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('manage_goals')
  if (error) return error

  const body = await req.json()
  const supabase = createServerClient()

  const { data, error: dbError } = await supabase
    .from('goals')
    .update(body)
    .eq('id', params.id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}
