import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/criativos/generate-context
// Returns all intelligence context needed for Max to generate copies
// Query params:
//   tipo: 'variacao_winner' | 'criativo_novo'
//   winner_id: UUID (required when tipo=variacao_winner)
//   persona: filter context by persona
//   angulo: filter context by angulo
export async function GET(req: NextRequest) {
  const sb = getServiceSupabase();
  const params = req.nextUrl.searchParams;

  const tipo = params.get('tipo') || 'criativo_novo';
  const winnerId = params.get('winner_id');
  const filterPersona = params.get('persona');
  const filterAngulo = params.get('angulo');

  // ── 1. Winner de origem (para variação) ──────────────────
  let winnerOrigem = null;
  if (tipo === 'variacao_winner') {
    if (!winnerId) {
      return NextResponse.json({ error: 'winner_id is required for variacao_winner' }, { status: 400 });
    }

    const { data: winner, error } = await sb
      .from('criativos')
      .select('id, nome, descricao, status, angulo, formato, persona, emocao_primaria, emocao_secundaria, hook, copy_primario, copy_titulo, copy_descricao, roteiro, tags, roas_atual, cpa_atual, ctr_atual, total_spend, total_purchases, total_revenue, frequency_atual, dias_ativo, dias_consecutivos_bom, conceito_id, ruminacao_id, formato_id')
      .eq('id', winnerId)
      .single();

    if (error || !winner) {
      return NextResponse.json({ error: 'Winner not found' }, { status: 404 });
    }

    winnerOrigem = winner;
  }

  // ── 2. Top Winners (by ROAS, with copy) ──────────────────
  let winnersQuery = sb
    .from('criativos')
    .select('id, nome, angulo, formato, persona, emocao_primaria, hook, copy_primario, copy_titulo, copy_descricao, roteiro, roas_atual, cpa_atual, ctr_atual, total_spend, total_purchases, total_revenue, dias_ativo, tags')
    .eq('is_winner', true)
    .order('roas_atual', { ascending: false })
    .limit(15);

  if (filterPersona) winnersQuery = winnersQuery.eq('persona', filterPersona);
  if (filterAngulo) winnersQuery = winnersQuery.eq('angulo', filterAngulo);

  const { data: topWinners } = await winnersQuery;

  // ── 3. Top Failures (morto/pausado with most spend = most data) ──
  const { data: topFalhas } = await sb
    .from('criativos')
    .select('id, nome, angulo, formato, persona, emocao_primaria, hook, copy_primario, roas_atual, cpa_atual, total_spend, total_purchases, tags')
    .in('status', ['morto', 'pausado'])
    .gt('total_spend', 0)
    .order('total_spend', { ascending: false })
    .limit(10);

  // ── 4. Best Ruminações (by CTR) ──────────────────────────
  let ruminacoesQuery = sb
    .from('ruminacoes')
    .select('id, texto, texto_variantes, trigger, emocao, angulo, persona, impacto_estimado, melhor_ctr, media_ctr, melhor_hook_rate, vezes_usado')
    .eq('ativo', true)
    .order('melhor_ctr', { ascending: false, nullsFirst: false })
    .limit(20);

  if (filterAngulo) ruminacoesQuery = ruminacoesQuery.eq('angulo', filterAngulo);

  const { data: melhoresRuminacoes } = await ruminacoesQuery;

  // ── 5. Best Conceitos (by ICE score) ─────────────────────
  let conceitosQuery = sb
    .from('conceitos')
    .select('id, nome, descricao, tipo, angulo, persona, emocao, ice_impacto, ice_confianca, ice_facilidade, ice_score, vezes_usado, melhor_roas, media_roas')
    .eq('ativo', true)
    .order('ice_score', { ascending: false })
    .limit(20);

  if (filterAngulo) conceitosQuery = conceitosQuery.eq('angulo', filterAngulo);

  const { data: melhoresConceitos } = await conceitosQuery;

  // ── 6. All Formatos (specs for adaptation) ───────────────
  const { data: formatos } = await sb
    .from('formatos')
    .select('id, nome, formato, tipo, largura, altura, aspect_ratio, duracao_min, duracao_max, tamanho_max_mb, agente_recomendado, diretrizes, media_ctr, media_roas, total_criativos, total_winners')
    .order('nome');

  // ── 7. Winning Patterns (angulo × emocao × persona combos) ──
  const { data: allWinners } = await sb
    .from('criativos')
    .select('angulo, formato, persona, emocao_primaria, roas_atual, cpa_atual, is_winner, status')
    .in('status', ['em_teste', 'winner', 'escala', 'saturado', 'pausado', 'morto'])
    .gt('total_spend', 0);

  const patterns: Record<string, { total: number; winners: number; totalRoas: number; totalCpa: number; cpaCount: number }> = {};

  for (const c of allWinners || []) {
    const key = `${c.angulo}|${c.emocao_primaria}|${c.persona}`;
    if (!patterns[key]) patterns[key] = { total: 0, winners: 0, totalRoas: 0, totalCpa: 0, cpaCount: 0 };
    patterns[key].total++;
    if (c.is_winner) patterns[key].winners++;
    if (c.roas_atual) patterns[key].totalRoas += parseFloat(String(c.roas_atual));
    if (c.cpa_atual) { patterns[key].totalCpa += parseFloat(String(c.cpa_atual)); patterns[key].cpaCount++; }
  }

  const patternsVencedores = Object.entries(patterns)
    .map(([combo, v]) => ({
      combo,
      angulo: combo.split('|')[0],
      emocao: combo.split('|')[1],
      persona: combo.split('|')[2],
      total: v.total,
      winners: v.winners,
      win_rate: v.total > 0 ? Math.round((v.winners / v.total) * 100) : 0,
      avg_roas: v.total > 0 ? Math.round((v.totalRoas / v.total) * 100) / 100 : 0,
      avg_cpa: v.cpaCount > 0 ? Math.round((v.totalCpa / v.cpaCount) * 100) / 100 : null,
    }))
    .sort((a, b) => b.win_rate - a.win_rate);

  const patternsEvitar = patternsVencedores
    .filter((p) => p.total >= 3 && p.win_rate === 0)
    .map((p) => ({ ...p, motivo: `0 winners em ${p.total} tentativas` }));

  // ── 8. Coverage Matrix Gaps ──────────────────────────────
  const { data: matriz } = await sb.from('matriz_cobertura').select('*');

  const ANGULOS = ['dor', 'desejo', 'prova_social', 'autoridade', 'urgencia', 'curiosidade', 'contraste', 'identificacao', 'educativo', 'controverso'];
  const FORMATOS = [
    'video_talking_head', 'video_motion_graphics', 'video_depoimento', 'video_screen_recording', 'video_misto',
    'estatico_single', 'estatico_carrossel', 'estatico_antes_depois', 'estatico_lista', 'estatico_prova_social',
    'estatico_quote', 'estatico_comparacao', 'estatico_numero', 'estatico_headline_bold', 'story_vertical', 'reel_vertical',
  ];

  const matrizSet = new Set((matriz || []).map((m: { angulo: string; formato: string }) => `${m.angulo}|${m.formato}`));
  const gaps = ANGULOS.flatMap((a) =>
    FORMATOS.filter((f) => !matrizSet.has(`${a}|${f}`)).map((f) => ({ angulo: a, formato: f }))
  );

  // ── 9. Existing Creatives (to avoid duplicate hooks/copies) ──
  const { data: existingCopies } = await sb
    .from('criativos')
    .select('hook, copy_primario')
    .not('hook', 'is', null)
    .limit(200);

  const hooksExistentes = (existingCopies || []).map((c: { hook: string }) => c.hook).filter(Boolean);
  const copiesExistentes = (existingCopies || []).map((c: { copy_primario: string }) => c.copy_primario).filter(Boolean);

  // ── 10. Previous AI Generations + Results ────────────────
  const { data: geracoesAnteriores } = await sb
    .from('geracoes_ia')
    .select('id, tipo, input_angulo, input_persona, input_emocao, total_criativos_gerados, total_viraram_winner, total_mortos, win_rate_geracao, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  // ── 11. Copy Validation Rules (so Max knows constraints) ──
  const validationRules = {
    copy_primario_max_chars: 250,
    copy_titulo_max_chars: 40,
    copy_descricao_max_chars: 30,
    required_terms: ['4 configurações', 'ROAS de 25'],
    prohibited_terms: ['ficar rico rapido', 'dinheiro facil', 'esquema'],
    cta_url: 'https://netomarquezini.com.br/curso-ads/',
  };

  // ── Response ─────────────────────────────────────────────
  return NextResponse.json({
    tipo,
    winner_origem: winnerOrigem,
    top_winners: topWinners || [],
    top_falhas: topFalhas || [],
    melhores_ruminacoes: melhoresRuminacoes || [],
    melhores_conceitos: melhoresConceitos || [],
    formatos: formatos || [],
    patterns_vencedores: patternsVencedores.slice(0, 15),
    patterns_evitar: patternsEvitar,
    gaps_matriz: gaps.slice(0, 30),
    total_gaps: gaps.length,
    total_combinacoes: ANGULOS.length * FORMATOS.length,
    cobertura_pct: Math.round(((ANGULOS.length * FORMATOS.length - gaps.length) / (ANGULOS.length * FORMATOS.length)) * 100),
    hooks_existentes: hooksExistentes,
    copies_existentes: copiesExistentes,
    geracoes_anteriores: geracoesAnteriores || [],
    validation_rules: validationRules,
  });
}
