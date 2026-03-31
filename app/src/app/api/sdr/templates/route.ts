import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    const url = request.nextUrl
    const channel = url.searchParams.get('channel')

    let query = supabase
      .from('sdr_message_templates')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (channel) {
      query = query.eq('channel', channel)
    }

    const { data, error } = await query

    if (error) {
      console.error('[api/sdr/templates] GET error:', error.message)
      return NextResponse.json({ error: 'Erro ao buscar templates' }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/templates] GET unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    const body = await request.json()
    const { name, channel, content, variables, created_by } = body

    if (!name || !channel || !content) {
      return NextResponse.json(
        { error: 'name, channel e content sao obrigatorios' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('sdr_message_templates')
      .insert({
        name,
        channel,
        content,
        variables: variables || [],
        is_active: true,
        usage_count: 0,
        created_by: created_by || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[api/sdr/templates] POST error:', error.message)
      return NextResponse.json({ error: 'Erro ao criar template' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/templates] POST unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    const body = await request.json()
    const { id, ...updateFields } = body

    if (!id) {
      return NextResponse.json({ error: 'id e obrigatorio' }, { status: 400 })
    }

    const allowedFields = ['name', 'channel', 'content', 'variables', 'is_active']
    const updateData: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in updateFields) {
        updateData[key] = updateFields[key]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('sdr_message_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[api/sdr/templates] PUT error:', error.message)
      return NextResponse.json({ error: 'Erro ao atualizar template' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/templates] PUT unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    const url = request.nextUrl
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id e obrigatorio' }, { status: 400 })
    }

    // Soft delete
    const { error } = await supabase
      .from('sdr_message_templates')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('[api/sdr/templates] DELETE error:', error.message)
      return NextResponse.json({ error: 'Erro ao desativar template' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/templates] DELETE unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
