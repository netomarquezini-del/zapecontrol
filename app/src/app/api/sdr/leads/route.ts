import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    const url = request.nextUrl

    const status = url.searchParams.get('status')
    const tags = url.searchParams.get('tags')
    const sdrId = url.searchParams.get('sdr_id')
    const search = url.searchParams.get('search')
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '25', 10)))
    const offset = (page - 1) * limit

    let query = supabase
      .from('sdr_leads')
      .select('*', { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }

    if (sdrId) {
      query = query.eq('sdr_user_id', sdrId)
    }

    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean)
      if (tagList.length > 0) {
        query = query.overlaps('tags', tagList)
      }
    }

    if (search) {
      query = query.or(
        `nome.ilike.%${search}%,telefone.ilike.%${search}%,email.ilike.%${search}%`
      )
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('[api/sdr/leads] GET error:', error.message)
      return NextResponse.json({ error: 'Erro ao buscar leads' }, { status: 500 })
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/leads] GET unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    const body = await request.json()

    const { nome, telefone, email, empresa, cargo, origem, tags, sdr_id } = body

    if (!nome || !telefone) {
      return NextResponse.json(
        { error: 'Nome e telefone sao obrigatorios' },
        { status: 400 }
      )
    }

    const insertData = {
      nome,
      telefone,
      email: email || null,
      empresa: empresa || null,
      cargo: cargo || null,
      origem: origem || null,
      tags: tags || [],
      sdr_user_id: sdr_id || null,
      status: 'novo' as const,
      custom_fields: {},
      total_calls: 0,
      total_messages: 0,
    }

    const { data, error } = await supabase
      .from('sdr_leads')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('[api/sdr/leads] POST error:', error.message)
      return NextResponse.json({ error: 'Erro ao criar lead' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/leads] POST unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
