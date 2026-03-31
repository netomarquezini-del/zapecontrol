import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/inteligencia — rankings by angulo, formato, combination
export async function GET(req: NextRequest) {
  const sb = getServiceSupabase();
  const params = req.nextUrl.searchParams;
  const period = params.get('period') || '30'; // days

  // Get all criativos with metrics
  const { data: criativos, error } = await sb
    .from('criativos')
    .select('id, nome, angulo, formato, persona, emocao_primaria, hook, roas_atual, cpa_atual, ctr_atual, total_spend, total_purchases, total_revenue, is_winner, status')
    .in('status', ['em_teste', 'winner', 'escala', 'saturado', 'pausado'])
    .gt('total_spend', 0);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!criativos || criativos.length === 0) {
    return NextResponse.json({ rankings: {}, message: 'No data yet' });
  }

  // Rankings by angulo
  const byAngulo: Record<string, { count: number; totalSpend: number; totalRevenue: number; totalPurchases: number; winners: number }> = {};
  const byFormato: Record<string, { count: number; totalSpend: number; totalRevenue: number; totalPurchases: number; winners: number }> = {};
  const byCombo: Record<string, { count: number; totalSpend: number; totalRevenue: number; totalPurchases: number; winners: number }> = {};

  for (const c of criativos) {
    const spend = parseFloat(String(c.total_spend || 0));
    const revenue = parseFloat(String(c.total_revenue || 0));
    const purchases = c.total_purchases || 0;
    const isWinner = c.is_winner ? 1 : 0;

    // By angulo
    if (!byAngulo[c.angulo]) byAngulo[c.angulo] = { count: 0, totalSpend: 0, totalRevenue: 0, totalPurchases: 0, winners: 0 };
    byAngulo[c.angulo].count++;
    byAngulo[c.angulo].totalSpend += spend;
    byAngulo[c.angulo].totalRevenue += revenue;
    byAngulo[c.angulo].totalPurchases += purchases;
    byAngulo[c.angulo].winners += isWinner;

    // By formato
    if (!byFormato[c.formato]) byFormato[c.formato] = { count: 0, totalSpend: 0, totalRevenue: 0, totalPurchases: 0, winners: 0 };
    byFormato[c.formato].count++;
    byFormato[c.formato].totalSpend += spend;
    byFormato[c.formato].totalRevenue += revenue;
    byFormato[c.formato].totalPurchases += purchases;
    byFormato[c.formato].winners += isWinner;

    // By combo
    const key = `${c.angulo}|${c.formato}`;
    if (!byCombo[key]) byCombo[key] = { count: 0, totalSpend: 0, totalRevenue: 0, totalPurchases: 0, winners: 0 };
    byCombo[key].count++;
    byCombo[key].totalSpend += spend;
    byCombo[key].totalRevenue += revenue;
    byCombo[key].totalPurchases += purchases;
    byCombo[key].winners += isWinner;
  }

  const formatRanking = (data: Record<string, { count: number; totalSpend: number; totalRevenue: number; totalPurchases: number; winners: number }>) =>
    Object.entries(data)
      .map(([key, v]) => ({
        key,
        count: v.count,
        avg_roas: v.totalSpend > 0 ? v.totalRevenue / v.totalSpend : 0,
        avg_cpa: v.totalPurchases > 0 ? v.totalSpend / v.totalPurchases : null,
        total_spend: v.totalSpend,
        total_revenue: v.totalRevenue,
        winners: v.winners,
        win_rate: v.count > 0 ? (v.winners / v.count) * 100 : 0,
      }))
      .sort((a, b) => b.avg_roas - a.avg_roas);

  // Top 5 criativos by ROAS
  const topByRoas = [...criativos]
    .filter((c) => c.roas_atual != null)
    .sort((a, b) => (parseFloat(String(b.roas_atual)) || 0) - (parseFloat(String(a.roas_atual)) || 0))
    .slice(0, 10);

  // Top 5 by CPA (lowest)
  const topByCpa = [...criativos]
    .filter((c) => c.cpa_atual != null && c.total_purchases > 0)
    .sort((a, b) => (parseFloat(String(a.cpa_atual)) || Infinity) - (parseFloat(String(b.cpa_atual)) || Infinity))
    .slice(0, 10);

  // Generate insights
  const insights: string[] = [];
  const anguloRanking = formatRanking(byAngulo);
  const formatoRanking = formatRanking(byFormato);

  if (anguloRanking.length >= 2) {
    const best = anguloRanking[0];
    const worst = anguloRanking[anguloRanking.length - 1];
    if (best.avg_roas > 0 && worst.avg_roas > 0) {
      const ratio = best.avg_roas / worst.avg_roas;
      insights.push(`${best.key} tem ROAS ${ratio.toFixed(1)}x maior que ${worst.key}`);
    }
  }
  if (formatoRanking.length >= 2) {
    const best = formatoRanking[0];
    insights.push(`Melhor formato: ${best.key} com ROAS medio ${best.avg_roas.toFixed(2)}`);
  }

  return NextResponse.json({
    rankings: {
      by_angulo: anguloRanking,
      by_formato: formatoRanking,
      by_combo: formatRanking(byCombo).slice(0, 20),
    },
    top_roas: topByRoas,
    top_cpa: topByCpa,
    insights,
    period,
  });
}
