import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { validateCopyFields } from '@/lib/types-criativos';

export const dynamic = 'force-dynamic';

// GET /api/criativos/[id] — detail with history
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = getServiceSupabase();

  const { data: criativo, error } = await sb
    .from('criativos')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !criativo) {
    return NextResponse.json({ error: 'Criativo not found' }, { status: 404 });
  }

  // Fetch related data
  const [historico, conceito, ruminacao, formatoData] = await Promise.all([
    sb.from('historico_status').select('*').eq('criativo_id', id).order('created_at', { ascending: false }),
    criativo.conceito_id ? sb.from('conceitos').select('*').eq('id', criativo.conceito_id).single() : null,
    criativo.ruminacao_id ? sb.from('ruminacoes').select('*').eq('id', criativo.ruminacao_id).single() : null,
    criativo.formato_id ? sb.from('formatos').select('*').eq('id', criativo.formato_id).single() : null,
  ]);

  return NextResponse.json({
    data: {
      ...criativo,
      historico: historico.data || [],
      conceito_detail: conceito?.data || null,
      ruminacao_detail: ruminacao?.data || null,
      formato_detail: formatoData?.data || null,
    },
  });
}

// PATCH /api/criativos/[id] — update fields
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = getServiceSupabase();
  const body = await req.json();

  // Validate copy field lengths if provided
  const copyValidation = validateCopyFields(body);
  if (!copyValidation.valid) {
    return NextResponse.json({ error: 'Copy validation failed', details: copyValidation.errors }, { status: 400 });
  }

  // Remove fields that shouldn't be directly updated
  const { id: _id, created_at: _ca, historico: _h, conceito_detail: _cd, ruminacao_detail: _rd, formato_detail: _fd, ...updateData } = body;

  updateData.updated_by = body.updated_by || 'manual';

  const { data, error } = await sb
    .from('criativos')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Criativo not found' }, { status: 404 });

  return NextResponse.json({ data });
}

// DELETE /api/criativos/[id] — hard delete
// Query param ?soft=true for soft delete (status → morto)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = getServiceSupabase();
  const soft = req.nextUrl.searchParams.get('soft') === 'true';

  if (soft) {
    const { data, error } = await sb
      .from('criativos')
      .update({ status: 'morto', updated_by: 'manual' })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Criativo not found' }, { status: 404 });
    return NextResponse.json({ data });
  }

  // Hard delete: remove historico first (FK), then criativo
  await sb.from('historico_status').delete().eq('criativo_id', id);
  await sb.from('geracoes_ia_itens').delete().eq('criativo_id', id);

  const { error } = await sb
    .from('criativos')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
