'use client';

import { useState, useEffect } from 'react';
import { ANGULO_LABELS, ANGULO_COLORS, FORMATO_LABELS } from '@/lib/types-criativos';

interface RankingItem {
  key: string;
  count: number;
  avg_roas: number;
  avg_cpa: number | null;
  total_spend: number;
  total_revenue: number;
  winners: number;
  win_rate: number;
}

interface IntelData {
  rankings: {
    by_angulo: RankingItem[];
    by_formato: RankingItem[];
    by_combo: RankingItem[];
  };
  top_roas: Array<{ id: string; nome: string; roas_atual: number }>;
  top_cpa: Array<{ id: string; nome: string; cpa_atual: number }>;
  insights: string[];
}

interface SugestaoData {
  gap_suggestions: Array<{
    angulo: string;
    angulo_label: string;
    formato: string;
    formato_label: string;
    ice_score: number;
    description: string;
  }>;
  conceito_suggestions: Array<{
    conceito_nome: string;
    ice_score: number;
    description: string;
  }>;
  coverage_pct: string;
  total_gaps: number;
}

export function InteligenciaDashboard() {
  const [data, setData] = useState<IntelData | null>(null);
  const [sugestoes, setSugestoes] = useState<SugestaoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/inteligencia').then((r) => r.json()),
      fetch('/api/inteligencia/sugestoes').then((r) => r.json()),
    ])
      .then(([intel, sug]) => {
        setData(intel);
        setSugestoes(sug);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const rankings = data?.rankings;

  return (
    <div className="space-y-8">
      {/* Insights */}
      {data?.insights && data.insights.length > 0 && (
        <div className="rounded-xl border p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--accent)' }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--accent)' }}>Insights Automaticos</h2>
          <ul className="space-y-2">
            {data.insights.map((insight, i) => (
              <li key={i} className="text-sm" style={{ color: 'var(--text-primary)' }}>{insight}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Rankings Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* By Angulo */}
        <RankingChart
          title="Ranking por Angulo"
          items={(rankings?.by_angulo || []).map((r) => ({
            label: ANGULO_LABELS[r.key as keyof typeof ANGULO_LABELS] || r.key,
            value: r.avg_roas,
            color: ANGULO_COLORS[r.key as keyof typeof ANGULO_COLORS] || '#666',
            count: r.count,
            winRate: r.win_rate,
          }))}
          metric="ROAS"
        />

        {/* By Formato */}
        <RankingChart
          title="Ranking por Formato"
          items={(rankings?.by_formato || []).map((r) => ({
            label: FORMATO_LABELS[r.key as keyof typeof FORMATO_LABELS] || r.key,
            value: r.avg_roas,
            color: '#3B82F6',
            count: r.count,
            winRate: r.win_rate,
          }))}
          metric="ROAS"
        />
      </div>

      {/* Combinations */}
      {rankings?.by_combo && rankings.by_combo.length > 0 && (
        <div className="rounded-xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="text-sm font-semibold">Top Combinacoes Angulo x Formato</h3>
          </div>
          <div className="p-4 space-y-2">
            {rankings.by_combo.slice(0, 10).map((r, i) => {
              const [angulo, formato] = r.key.split('|');
              return (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded" style={{ backgroundColor: 'var(--bg-card)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold w-5" style={{ color: 'var(--text-muted)' }}>#{i + 1}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${ANGULO_COLORS[angulo as keyof typeof ANGULO_COLORS] || '#666'}20`, color: ANGULO_COLORS[angulo as keyof typeof ANGULO_COLORS] || '#666' }}>
                      {ANGULO_LABELS[angulo as keyof typeof ANGULO_LABELS] || angulo}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>x</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>
                      {FORMATO_LABELS[formato as keyof typeof FORMATO_LABELS] || formato}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span style={{ color: 'var(--text-muted)' }}>{r.count} criativos</span>
                    <span className="font-bold" style={{ color: 'var(--accent)' }}>ROAS {r.avg_roas.toFixed(2)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{r.win_rate.toFixed(0)}% win rate</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {sugestoes && (
        <div className="rounded-xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="text-sm font-semibold">Sugestoes de Proximos Criativos</h3>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(163,230,53,0.1)', color: 'var(--accent)' }}>
              {sugestoes.total_gaps} gaps | {sugestoes.coverage_pct}% coberto
            </span>
          </div>
          <div className="p-4 space-y-2">
            {sugestoes.gap_suggestions.slice(0, 10).map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 rounded" style={{ backgroundColor: 'var(--bg-card)' }}>
                <div className="flex-1">
                  <p className="text-xs">{s.description}</p>
                </div>
                <span className="text-xs font-bold ml-3" style={{ color: 'var(--accent)' }}>ICE {s.ice_score}</span>
              </div>
            ))}
            {sugestoes.conceito_suggestions.length > 0 && (
              <>
                <h4 className="text-xs font-semibold mt-4 mb-2" style={{ color: 'var(--text-muted)' }}>Conceitos Nunca Produzidos</h4>
                {sugestoes.conceito_suggestions.slice(0, 5).map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded" style={{ backgroundColor: 'var(--bg-card)' }}>
                    <p className="text-xs">{s.description}</p>
                    <span className="text-xs font-bold ml-3" style={{ color: 'var(--accent)' }}>ICE {s.ice_score}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!rankings?.by_angulo?.length && !rankings?.by_formato?.length && (
        <div className="text-center py-20 rounded-xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <p className="text-lg font-bold mb-2">Sem dados de inteligencia ainda</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Os rankings serao gerados automaticamente quando criativos tiverem metricas de performance.
          </p>
        </div>
      )}
    </div>
  );
}

function RankingChart({ title, items, metric }: {
  title: string;
  items: Array<{ label: string; value: number; color: string; count: number; winRate: number }>;
  metric: string;
}) {
  const maxValue = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="rounded-xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="p-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>Sem dados</p>
        ) : (
          items.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{item.label}</span>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>{item.count} ads</span>
                  <span className="font-bold" style={{ color: item.color }}>{metric} {item.value.toFixed(2)}</span>
                </div>
              </div>
              <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--bg-card)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color,
                    opacity: 0.7,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
