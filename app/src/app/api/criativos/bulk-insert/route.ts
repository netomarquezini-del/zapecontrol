import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { validateCopyFields } from '@/lib/types-criativos';

export const dynamic = 'force-dynamic';

// POST /api/criativos/bulk-insert
// Inserts multiple criativos at once from an AI generation batch
// Creates geracao_ia record + criativos + geracoes_ia_itens links
//
// Body:
// {
//   tipo: 'variacao_winner' | 'criativo_novo',
//   winner_origem_id?: UUID (for variacao_winner),
//   input_persona?: string,
//   input_angulo?: string,
//   input_emocao?: string,
//   input_formato?: string,
//   contexto_usado: { ... },  // snapshot of context used
//   notas?: string,
//   criativos: [
//     {
//       nome: string,
//       formato: string,
//       angulo?: string,
//       persona?: string,
//       emocao_primaria?: string,
//       emocao_secundaria?: string,
//       hook?: string,
//       copy_primario?: string,
//       copy_titulo?: string,
//       copy_descricao?: string,
//       roteiro?: string,
//       conceito_id?: UUID,
//       ruminacao_id?: UUID,
//       tags?: string[],
//       notas?: string,
//       variacao_tipo?: 'hook' | 'angulo' | 'emocao' | 'copy_completa' | 'remix_total' | 'formato',
//       referencias_usadas?: { ... }
//     }
//   ]
// }
export async function POST(req: NextRequest) {
  const sb = getServiceSupabase();
  const body = await req.json();

  // Validate required fields
  if (!body.tipo) {
    return NextResponse.json({ error: 'tipo is required' }, { status: 400 });
  }
  if (!body.criativos || !Array.isArray(body.criativos) || body.criativos.length === 0) {
    return NextResponse.json({ error: 'criativos array is required and must not be empty' }, { status: 400 });
  }
  if (body.tipo === 'variacao_winner' && !body.winner_origem_id) {
    return NextResponse.json({ error: 'winner_origem_id is required for variacao_winner' }, { status: 400 });
  }

  // Validate each criativo
  const errors: string[] = [];
  for (let i = 0; i < body.criativos.length; i++) {
    const c = body.criativos[i];
    if (!c.nome) errors.push(`criativos[${i}]: nome is required`);
    if (!c.formato) errors.push(`criativos[${i}]: formato is required`);
    const copyValidation = validateCopyFields(c);
    if (!copyValidation.valid) {
      errors.push(`criativos[${i}]: ${copyValidation.errors.join(', ')}`);
    }
  }
  if (errors.length > 0) {
    return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
  }

  // ── 1. Create geracao_ia record ──────────────────────────
  const { data: geracao, error: geracaoError } = await sb
    .from('geracoes_ia')
    .insert({
      tipo: body.tipo,
      input_persona: body.input_persona || null,
      input_angulo: body.input_angulo || null,
      input_emocao: body.input_emocao || null,
      input_formato: body.input_formato || null,
      winner_origem_id: body.winner_origem_id || null,
      contexto_usado: body.contexto_usado || {},
      notas: body.notas || null,
      gerado_por: 'max',
    })
    .select()
    .single();

  if (geracaoError || !geracao) {
    return NextResponse.json({ error: 'Failed to create geracao_ia', details: geracaoError?.message }, { status: 500 });
  }

  // ── 2. Insert criativos ──────────────────────────────────
  const criativosToInsert = body.criativos.map((c: Record<string, unknown>) => ({
    nome: c.nome,
    descricao: c.descricao || null,
    status: 'ideia' as const,
    angulo: c.angulo || 'dor',
    formato: c.formato,
    persona: c.persona || 'geral',
    emocao_primaria: c.emocao_primaria || 'frustacao',
    emocao_secundaria: c.emocao_secundaria || null,
    hook: c.hook || null,
    copy_primario: c.copy_primario || null,
    copy_titulo: c.copy_titulo || null,
    copy_descricao: c.copy_descricao || null,
    roteiro: c.roteiro || null,
    conceito_id: c.conceito_id || null,
    ruminacao_id: c.ruminacao_id || null,
    variacao_de: body.winner_origem_id || null,
    geracao: body.tipo === 'variacao_winner' ? 2 : 1,
    tags: c.tags || [],
    notas: c.notas || null,
    created_by: 'max',
    updated_by: 'max',
  }));

  const { data: criativos, error: criativosError } = await sb
    .from('criativos')
    .insert(criativosToInsert)
    .select();

  if (criativosError || !criativos) {
    // Cleanup geracao if criativos fail
    await sb.from('geracoes_ia').delete().eq('id', geracao.id);
    return NextResponse.json({ error: 'Failed to insert criativos', details: criativosError?.message }, { status: 500 });
  }

  // ── 3. Create geracoes_ia_itens (link criativos to geracao) ──
  const itensToInsert = criativos.map((criativo: { id: string }, index: number) => {
    const original = body.criativos[index];
    return {
      geracao_id: geracao.id,
      criativo_id: criativo.id,
      variacao_tipo: original.variacao_tipo || null,
      referencias_usadas: original.referencias_usadas || {},
      copy_gerada: {
        hook: original.hook || null,
        copy_titulo: original.copy_titulo || null,
        copy_descricao: original.copy_descricao || null,
        copy_primario: original.copy_primario || null,
        roteiro: original.roteiro || null,
      },
    };
  });

  const { error: itensError } = await sb.from('geracoes_ia_itens').insert(itensToInsert);

  if (itensError) {
    // Criativos already created, log error but don't rollback
    console.error('Failed to create geracoes_ia_itens:', itensError.message);
  }

  // ── 4. Log historico_status for each criativo ────────────
  const historicoEntries = criativos.map((criativo: { id: string }) => ({
    criativo_id: criativo.id,
    status_anterior: null,
    status_novo: 'ideia',
    motivo: `Gerado por IA (${body.tipo})`,
    detalhes: { geracao_id: geracao.id },
    executado_por: 'max',
  }));

  await sb.from('historico_status').insert(historicoEntries);

  // ── Response ─────────────────────────────────────────────
  return NextResponse.json({
    geracao_id: geracao.id,
    total_criados: criativos.length,
    criativos: criativos.map((c: { id: string; nome: string; angulo: string; formato: string; hook: string }) => ({
      id: c.id,
      nome: c.nome,
      angulo: c.angulo,
      formato: c.formato,
      hook: c.hook,
    })),
  }, { status: 201 });
}
