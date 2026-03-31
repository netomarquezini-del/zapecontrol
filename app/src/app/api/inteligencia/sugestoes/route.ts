import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { ALL_ANGULOS, ALL_FORMATOS, ANGULO_LABELS, FORMATO_LABELS } from '@/lib/types-criativos';

export const dynamic = 'force-dynamic';

// GET /api/inteligencia/sugestoes — suggest next criativos to produce
export async function GET() {
  const sb = getServiceSupabase();

  // 1. Get coverage matrix
  const { data: matriz } = await sb.from('matriz_cobertura').select('*');

  // 2. Get conceitos with high ICE not yet used
  const { data: conceitos } = await sb
    .from('conceitos')
    .select('*')
    .eq('ativo', true)
    .eq('vezes_usado', 0)
    .order('ice_score', { ascending: false })
    .limit(10);

  // 3. Get performance data by angulo and formato
  const { data: criativos } = await sb
    .from('criativos')
    .select('angulo, formato, cpa_atual, roas_atual, is_winner')
    .in('status', ['em_teste', 'winner', 'escala'])
    .gt('total_spend', 0);

  // Build coverage map
  const covered = new Set<string>();
  if (matriz) {
    for (const m of matriz) {
      if (m.total_criativos > 0) {
        covered.add(`${m.angulo}|${m.formato}`);
      }
    }
  }

  // Find gaps
  const gaps: Array<{ angulo: string; formato: string; reason: string }> = [];
  for (const a of ALL_ANGULOS) {
    for (const f of ALL_FORMATOS) {
      if (!covered.has(`${a}|${f}`)) {
        gaps.push({ angulo: a, formato: f, reason: 'Gap na matriz de cobertura' });
      }
    }
  }

  // Calculate avg CPA by angulo and formato
  const anguloPerf: Record<string, { totalSpend: number; totalPurchases: number }> = {};
  const formatoPerf: Record<string, { totalSpend: number; totalPurchases: number }> = {};

  if (criativos) {
    for (const c of criativos) {
      const cpa = parseFloat(String(c.cpa_atual || 0));
      if (cpa <= 0) continue;

      if (!anguloPerf[c.angulo]) anguloPerf[c.angulo] = { totalSpend: 0, totalPurchases: 0 };
      anguloPerf[c.angulo].totalSpend += cpa;
      anguloPerf[c.angulo].totalPurchases++;

      if (!formatoPerf[c.formato]) formatoPerf[c.formato] = { totalSpend: 0, totalPurchases: 0 };
      formatoPerf[c.formato].totalSpend += cpa;
      formatoPerf[c.formato].totalPurchases++;
    }
  }

  // Score gaps using ICE-like approach
  const suggestions = gaps.slice(0, 30).map((gap) => {
    const anguloAvgCpa = anguloPerf[gap.angulo]
      ? anguloPerf[gap.angulo].totalSpend / anguloPerf[gap.angulo].totalPurchases
      : null;
    const formatoAvgCpa = formatoPerf[gap.formato]
      ? formatoPerf[gap.formato].totalSpend / formatoPerf[gap.formato].totalPurchases
      : null;

    // ICE-like score: lower CPA = higher impact
    const impact = anguloAvgCpa ? Math.max(1, 10 - (anguloAvgCpa / 10)) : 5;
    const confidence = anguloAvgCpa && formatoAvgCpa ? 7 : 3;
    const ease = 6;
    const score = (impact + confidence + ease) / 3;

    return {
      angulo: gap.angulo,
      angulo_label: ANGULO_LABELS[gap.angulo as keyof typeof ANGULO_LABELS] || gap.angulo,
      formato: gap.formato,
      formato_label: FORMATO_LABELS[gap.formato as keyof typeof FORMATO_LABELS] || gap.formato,
      reason: gap.reason,
      angulo_avg_cpa: anguloAvgCpa,
      formato_avg_cpa: formatoAvgCpa,
      ice_score: parseFloat(score.toFixed(1)),
      description: `Produzir: ${ANGULO_LABELS[gap.angulo as keyof typeof ANGULO_LABELS] || gap.angulo} em formato ${FORMATO_LABELS[gap.formato as keyof typeof FORMATO_LABELS] || gap.formato}. ICE ${score.toFixed(1)}.${anguloAvgCpa ? ` CPA medio angulo: R$${anguloAvgCpa.toFixed(2)}.` : ' Sem dados de CPA.'}`,
    };
  });

  // Sort by ICE score
  suggestions.sort((a, b) => b.ice_score - a.ice_score);

  // Add high-ICE unused conceitos
  const conceitoSuggestions = (conceitos || []).map((c) => ({
    type: 'conceito_novo',
    conceito_id: c.id,
    conceito_nome: c.nome,
    conceito_descricao: c.descricao,
    ice_score: parseFloat(String(c.ice_score)),
    angulo: c.angulo,
    description: `Conceito novo: "${c.nome}" (ICE ${c.ice_score}). Nunca produzido.`,
  }));

  return NextResponse.json({
    gap_suggestions: suggestions.slice(0, 15),
    conceito_suggestions: conceitoSuggestions,
    total_gaps: gaps.length,
    total_combinations: ALL_ANGULOS.length * ALL_FORMATOS.length,
    coverage_pct: ((1 - gaps.length / (ALL_ANGULOS.length * ALL_FORMATOS.length)) * 100).toFixed(1),
  });
}
