import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const productId = searchParams.get('product_id')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const supabase = createServerClient()
  let query = supabase
    .from('production_entries')
    .select(`
      *,
      product:products(id, sku, name, type, photo_url),
      user:users!created_by(id, name)
    `, { count: 'exact' })
    .order('production_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (date) query = query.eq('production_date', date)
  if (productId) query = query.eq('product_id', productId)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, total: count, page, limit })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const { entries } = body as { entries: { product_id: string; quantity: number; production_date: string }[] }

  if (!entries?.length) {
    return NextResponse.json({ error: 'Nenhum lançamento informado' }, { status: 400 })
  }

  const supabase = createServerClient()
  const records = entries.map((e) => ({
    product_id: e.product_id,
    quantity: e.quantity,
    production_date: e.production_date,
    created_by: user.id,
  }))

  const { data, error } = await supabase
    .from('production_entries')
    .insert(records)
    .select(`
      *,
      product:products(id, sku, name, type, photo_url)
    `)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
