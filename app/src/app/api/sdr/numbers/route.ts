import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ── GET: list all numbers from sdr_numbers ─────────────────
export async function GET() {
  try {
    const supabase = getServiceSupabase()
    const { data, error } = await supabase
      .from('sdr_numbers')
      .select('*')
      .order('ddd', { ascending: true })
      .order('number', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ numbers: data ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ── POST: add number to pool ───────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { number, ddd, friendly_name, twilio_sid } = body

    if (!number || !ddd) {
      return NextResponse.json(
        { error: 'Campos obrigatorios: number, ddd' },
        { status: 400 }
      )
    }

    // Validate number format: must be digits only, optionally with leading +
    const cleanNumber = String(number).replace(/\D/g, '')
    if (cleanNumber.length < 10 || cleanNumber.length > 13) {
      return NextResponse.json(
        { error: 'Numero invalido. Deve ter entre 10 e 13 digitos.' },
        { status: 400 }
      )
    }

    // Validate DDD: 2 digits
    const cleanDDD = String(ddd).replace(/\D/g, '')
    if (cleanDDD.length !== 2) {
      return NextResponse.json(
        { error: 'DDD invalido. Deve ter exatamente 2 digitos.' },
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()

    const { data, error } = await supabase
      .from('sdr_numbers')
      .insert({
        number: cleanNumber,
        ddd: cleanDDD,
        friendly_name: friendly_name || null,
        twilio_sid: twilio_sid || null,
        status: 'ativo',
        call_count: 0,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Este numero ja esta cadastrado.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ number: data }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
