import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { STATUS_TRANSITIONS, STATUS_TO_GERACAO_RESULTADO, type CreativeStatus, validateCopy } from '@/lib/types-criativos';

export const dynamic = 'force-dynamic';

// PATCH /api/criativos/[id]/status — status transition with validation
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = getServiceSupabase();
  const body = await req.json();

  const newStatus = body.status as CreativeStatus;
  const motivo = body.motivo || 'Manual transition';
  const executado_por = body.executado_por || 'manual';

  if (!newStatus) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 });
  }

  // Get current criativo
  const { data: criativo, error: fetchError } = await sb
    .from('criativos')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !criativo) {
    return NextResponse.json({ error: 'Criativo not found' }, { status: 404 });
  }

  const currentStatus = criativo.status as CreativeStatus;

  // Validate transition
  const validTransitions = STATUS_TRANSITIONS[currentStatus];
  if (!validTransitions || !validTransitions.includes(newStatus)) {
    return NextResponse.json(
      {
        error: `Invalid status transition: ${currentStatus} -> ${newStatus}`,
        valid_transitions: validTransitions,
      },
      { status: 400 },
    );
  }

  // If transitioning to "pronto", validate copy contains required terms
  if (newStatus === 'pronto') {
    const fullCopy = [criativo.copy_primario, criativo.copy_titulo, criativo.copy_descricao]
      .filter(Boolean)
      .join(' ');

    const copyValidation = validateCopy(fullCopy);
    if (!copyValidation.valid) {
      return NextResponse.json(
        {
          error: 'Copy validation failed — cannot mark as pronto',
          details: copyValidation.errors,
        },
        { status: 400 },
      );
    }

    // Check arquivo exists
    if (!criativo.arquivo_principal) {
      return NextResponse.json(
        { error: 'Arquivo principal is required before marking as pronto' },
        { status: 400 },
      );
    }
  }

  // Update status
  const { data: updated, error: updateError } = await sb
    .from('criativos')
    .update({
      status: newStatus,
      updated_by: executado_por,
      ...(newStatus === 'winner' ? { is_winner: true, winner_at: new Date().toISOString() } : {}),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Retroalimentação: update geracoes_ia_itens if this criativo was AI-generated
  const resultado = STATUS_TO_GERACAO_RESULTADO[newStatus];
  if (resultado) {
    await sb.from('geracoes_ia_itens').update({
      resultado,
      cpa_final: criativo.cpa_atual || null,
      roas_final: criativo.roas_atual || null,
      dias_ativo_final: criativo.dias_ativo || 0,
      total_spend_final: criativo.total_spend || null,
    }).eq('criativo_id', id);
  }

  return NextResponse.json({ data: updated });
}
