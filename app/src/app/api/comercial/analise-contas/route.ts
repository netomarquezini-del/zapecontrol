import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ── GET: list records with filters ─────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const consultor = searchParams.get('consultor');
    const closer = searchParams.get('closer');
    const mes = searchParams.get('mes');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const supabase = getServiceSupabase();
    let query = supabase
      .from('analise_contas')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (consultor) query = query.ilike('consultor', consultor);
    if (closer) query = query.ilike('closer', closer);
    if (mes) query = query.eq('mes_referencia', mes);
    if (from) query = query.gte('data_agendamento', from);
    if (to) query = query.lte('data_agendamento', to);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ records: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST: create new record ────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome_cliente, data_agendamento, data_analise, consultor, status, closer, data_call_fechamento, fechou, mes_referencia, observacoes, data_finalizacao } = body;

    if (!nome_cliente) {
      return NextResponse.json({ error: 'Nome do cliente e obrigatorio' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('analise_contas')
      .insert({
        nome_cliente,
        data_agendamento: data_agendamento || null,
        data_analise: data_analise || null,
        consultor: consultor || null,
        status: status || 'Agendado',
        closer: closer || null,
        data_call_fechamento: data_call_fechamento || null,
        fechou: fechou || null,
        mes_referencia: mes_referencia || null,
        observacoes: observacoes || null,
        data_finalizacao: data_finalizacao || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ record: data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── PATCH: update record ───────────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID e obrigatorio' }, { status: 400 });
    }

    // Auto-set data_finalizacao based on status change
    if (updates.status !== undefined) {
      if (updates.status === 'Agendado') {
        updates.data_finalizacao = null;
      } else if (updates.data_finalizacao === undefined) {
        // Only auto-set if not explicitly provided and status is not Agendado
        // Check if record already has data_finalizacao
        const supabaseCheck = getServiceSupabase();
        const { data: existing } = await supabaseCheck
          .from('analise_contas')
          .select('data_finalizacao')
          .eq('id', id)
          .single();
        if (!existing?.data_finalizacao) {
          updates.data_finalizacao = new Date().toISOString().split('T')[0];
        }
      }
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('analise_contas')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ record: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── DELETE: remove record ──────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID e obrigatorio' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('analise_contas')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
