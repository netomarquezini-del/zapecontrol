import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getServiceSupabase()

    const { data, error } = await supabase
      .from('sdr_leads')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead nao encontrado' }, { status: 404 })
      }
      console.error('[api/sdr/leads/[id]] GET error:', error.message)
      return NextResponse.json({ error: 'Erro ao buscar lead' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/leads/[id]] GET unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getServiceSupabase()
    const body = await request.json()

    const allowedFields = [
      'nome', 'telefone', 'email', 'empresa', 'cargo', 'origem',
      'status', 'sdr_user_id', 'cadence_id', 'tags', 'custom_fields',
      'last_contact_at', 'next_contact_at', 'notes',
    ]

    const updateData: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in body) {
        updateData[key] = body[key]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('sdr_leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead nao encontrado' }, { status: 404 })
      }
      console.error('[api/sdr/leads/[id]] PUT error:', error.message)
      return NextResponse.json({ error: 'Erro ao atualizar lead' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/leads/[id]] PUT unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getServiceSupabase()

    const { error } = await supabase
      .from('sdr_leads')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[api/sdr/leads/[id]] DELETE error:', error.message)
      return NextResponse.json({ error: 'Erro ao deletar lead' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/leads/[id]] DELETE unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
