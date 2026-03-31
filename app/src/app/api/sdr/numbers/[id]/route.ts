import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// ── PUT: update number ─────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const allowedFields = ['status', 'ddd', 'friendly_name', 'twilio_sid']
    const updates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo valido para atualizar.' },
        { status: 400 }
      )
    }

    // Validate status if provided
    if (updates.status && !['ativo', 'pausado', 'bloqueado'].includes(updates.status as string)) {
      return NextResponse.json(
        { error: 'Status invalido. Use: ativo, pausado, bloqueado.' },
        { status: 400 }
      )
    }

    // Validate DDD if provided
    if (updates.ddd) {
      const cleanDDD = String(updates.ddd).replace(/\D/g, '')
      if (cleanDDD.length !== 2) {
        return NextResponse.json(
          { error: 'DDD invalido. Deve ter exatamente 2 digitos.' },
          { status: 400 }
        )
      }
      updates.ddd = cleanDDD
    }

    const supabase = getServiceSupabase()

    const { data, error } = await supabase
      .from('sdr_numbers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Numero nao encontrado.' }, { status: 404 })
    }

    return NextResponse.json({ number: data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ── DELETE: remove number from pool ────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getServiceSupabase()

    const { error } = await supabase
      .from('sdr_numbers')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
