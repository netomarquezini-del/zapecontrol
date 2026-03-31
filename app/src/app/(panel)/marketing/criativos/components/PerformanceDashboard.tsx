'use client';

import { useState, useEffect } from 'react';
import type { Criativo } from '@/lib/types-criativos';
import {
  ANGULO_LABELS, ANGULO_COLORS, FORMATO_LABELS, STATUS_LABELS, STATUS_COLORS,
  CPA_TARGET, FREQUENCY_SATURATION,
} from '@/lib/types-criativos';

export function PerformanceDashboard() {
  const [criativos, setCriativos] = useState<Criativo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/criativos?status=em_teste,winner,escala&limit=100')
      .then((r) => r.json())
      .then((json) => setCriativos(json.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const active = criativos.filter((c) => ['em_teste', 'winner', 'escala'].includes(c.status));
  const totalSpend = active.reduce((sum, c) => sum + parseFloat(String(c.total_spend || 0)), 0);
  const totalPurchases = active.reduce((sum, c) => sum + (c.total_purchases || 0), 0);
  const totalRevenue = active.reduce((sum, c) => sum + parseFloat(String(c.total_revenue || 0)), 0);
  const avgCpa = totalPurchases > 0 ? totalSpend / totalPurchases : 0;
  const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  const topByCpa = [...active]
    .filter((c) => c.total_purchases && c.total_purchases > 0)
    .sort((a, b) => parseFloat(String(a.cpa_atual || Infinity)) - parseFloat(String(b.cpa_atual || Infinity)))
    .slice(0, 5);

  const topByRoas = [...active]
    .filter((c) => c.roas_atual != null)
    .sort((a, b) => parseFloat(String(b.roas_atual || 0)) - parseFloat(String(a.roas_atual || 0)))
    .slice(0, 5);

  // Alerts
  const saturating = active.filter((c) => parseFloat(String(c.frequency_atual || 0)) > FREQUENCY_SATURATION);
  const killCandidates = active.filter((c) => {
    const cpa = parseFloat(String(c.cpa_atual || 0));
    return cpa > CPA_TARGET * 2 && (c.total_purchases || 0) === 0 && (c.total_impressions || 0) >= 1000;
  });
  const winners = active.filter((c) => c.is_winner);

  return (
    <div className="space-y-6">
      {/* KPIs Bar */}
      <div className="grid grid-cols-5 gap-3">
        <KPICard label="Investido Total" value={`R$${totalSpend.toFixed(0)}`} />
        <KPICard label="CPA Medio" value={avgCpa > 0 ? `R$${avgCpa.toFixed(2)}` : '-'} highlight={avgCpa > 0 && avgCpa <= CPA_TARGET} />
        <KPICard label="ROAS Medio" value={avgRoas > 0 ? avgRoas.toFixed(2) : '-'} highlight={avgRoas > 1.0} />
        <KPICard label="Conversoes" value={String(totalPurchases)} />
        <KPICard label="Criativos Ativos" value={String(active.length)} />
      </div>

      {/* Alerts */}
      {(saturating.length > 0 || killCandidates.length > 0 || winners.length > 0) && (
        <div className="grid grid-cols-3 gap-3">
          {saturating.length > 0 && (
            <AlertCard
              title={`Saturando (${saturating.length})`}
              color="#F59E0B"
              items={saturating.map((c) => `${c.nome} (freq ${parseFloat(String(c.frequency_atual || 0)).toFixed(1)})`)}
            />
          )}
          {killCandidates.length > 0 && (
            <AlertCard
              title={`Kill Rule (${killCandidates.length})`}
              color="#EF4444"
              items={killCandidates.map((c) => `${c.nome} (CPA R$${parseFloat(String(c.cpa_atual || 0)).toFixed(0)})`)}
            />
          )}
          {winners.length > 0 && (
            <AlertCard
              title={`Winners (${winners.length})`}
              color="#A3E635"
              items={winners.map((c) => `${c.nome} (ROAS ${parseFloat(String(c.roas_atual || 0)).toFixed(1)})`)}
            />
          )}
        </div>
      )}

      {/* Top 5 tables */}
      <div className="grid grid-cols-2 gap-6">
        <TopTable title="Top 5 por CPA (melhor)" criativos={topByCpa} metric="cpa" />
        <TopTable title="Top 5 por ROAS" criativos={topByRoas} metric="roas" />
      </div>

      {/* All active criativos table */}
      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="text-sm font-semibold">Todos os Criativos Ativos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-card)' }}>
                <th className="text-left p-3 font-medium" style={{ color: 'var(--text-muted)' }}>Nome</th>
                <th className="text-left p-3 font-medium" style={{ color: 'var(--text-muted)' }}>Status</th>
                <th className="text-left p-3 font-medium" style={{ color: 'var(--text-muted)' }}>Angulo</th>
                <th className="text-right p-3 font-medium" style={{ color: 'var(--text-muted)' }}>Spend</th>
                <th className="text-right p-3 font-medium" style={{ color: 'var(--text-muted)' }}>CPA</th>
                <th className="text-right p-3 font-medium" style={{ color: 'var(--text-muted)' }}>ROAS</th>
                <th className="text-right p-3 font-medium" style={{ color: 'var(--text-muted)' }}>Conv.</th>
                <th className="text-right p-3 font-medium" style={{ color: 'var(--text-muted)' }}>Freq.</th>
                <th className="text-right p-3 font-medium" style={{ color: 'var(--text-muted)' }}>Dias</th>
              </tr>
            </thead>
            <tbody>
              {active.map((c) => (
                <tr key={c.id} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="p-3 font-medium">{c.nome}</td>
                  <td className="p-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${STATUS_COLORS[c.status]}20`, color: STATUS_COLORS[c.status] }}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${ANGULO_COLORS[c.angulo]}20`, color: ANGULO_COLORS[c.angulo] }}>
                      {ANGULO_LABELS[c.angulo]}
                    </span>
                  </td>
                  <td className="p-3 text-right">R${parseFloat(String(c.total_spend || 0)).toFixed(0)}</td>
                  <td className="p-3 text-right" style={{ color: parseFloat(String(c.cpa_atual || 0)) <= CPA_TARGET ? '#A3E635' : '#EF4444' }}>
                    {c.cpa_atual ? `R$${parseFloat(String(c.cpa_atual)).toFixed(2)}` : '-'}
                  </td>
                  <td className="p-3 text-right" style={{ color: parseFloat(String(c.roas_atual || 0)) >= 1.0 ? '#A3E635' : '#EF4444' }}>
                    {c.roas_atual ? parseFloat(String(c.roas_atual)).toFixed(2) : '-'}
                  </td>
                  <td className="p-3 text-right">{c.total_purchases || 0}</td>
                  <td className="p-3 text-right" style={{ color: parseFloat(String(c.frequency_atual || 0)) > FREQUENCY_SATURATION ? '#F59E0B' : 'var(--text-primary)' }}>
                    {c.frequency_atual ? parseFloat(String(c.frequency_atual)).toFixed(1) : '-'}
                  </td>
                  <td className="p-3 text-right">{c.dias_ativo || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: highlight ? 'var(--accent)' : 'var(--border-color)' }}>
      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-xl font-bold" style={{ color: highlight ? 'var(--accent)' : 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

function AlertCard({ title, color, items }: { title: string; color: string; items: string[] }) {
  return (
    <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: `${color}40` }}>
      <h3 className="text-sm font-semibold mb-2" style={{ color }}>{title}</h3>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function TopTable({ title, criativos, metric }: { title: string; criativos: Criativo[]; metric: 'cpa' | 'roas' }) {
  return (
    <div className="rounded-xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="p-3 space-y-2">
        {criativos.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>Sem dados</p>
        ) : (
          criativos.map((c, i) => (
            <div key={c.id} className="flex items-center justify-between py-1.5 px-2 rounded" style={{ backgroundColor: 'var(--bg-card)' }}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold w-5" style={{ color: 'var(--text-muted)' }}>#{i + 1}</span>
                <span className="text-xs font-medium truncate max-w-[180px]">{c.nome}</span>
              </div>
              <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                {metric === 'cpa'
                  ? `R$${parseFloat(String(c.cpa_atual || 0)).toFixed(2)}`
                  : parseFloat(String(c.roas_atual || 0)).toFixed(2)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
