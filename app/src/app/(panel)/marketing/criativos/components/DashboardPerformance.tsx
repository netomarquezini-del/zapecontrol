'use client';

import { useState, useEffect } from 'react';
import type { Creative } from '../types';
import { CPA_TARGET, FREQUENCY_SATURATION } from '../types';

// ── Helpers ──────────────────────────────────────────────────
function fmt(n: number, decimals = 0): string {
  return n.toFixed(decimals);
}

function parseNum(v: unknown): number {
  return parseFloat(String(v ?? 0)) || 0;
}

// ── Skeleton ─────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-[#333] ${className}`}
    />
  );
}

function KPICardSkeleton() {
  return (
    <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-4">
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-7 w-24" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-4 space-y-3">
      <Skeleton className="h-4 w-40 mb-4" />
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────
function KPICard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#A3E635]">{value}</p>
    </div>
  );
}

function AlertCard({
  emoji,
  title,
  count,
  borderColor,
}: {
  emoji: string;
  title: string;
  count: number;
  borderColor: string;
}) {
  return (
    <div
      className="bg-[#1A1A1A] rounded-lg p-4"
      style={{ border: `1px solid ${borderColor}` }}
    >
      <p className="text-lg font-bold text-[#F5F5F5]">
        {emoji} {count}
      </p>
      <p className="text-xs text-gray-400 mt-1">{title}</p>
      <button className="text-xs mt-2 underline" style={{ color: borderColor }}>
        Ver detalhes
      </button>
    </div>
  );
}

function AnguloLabel({ angulo }: { angulo: string }) {
  const labels: Record<string, string> = {
    dor: 'Dor',
    desejo: 'Desejo',
    prova_social: 'Prova Social',
    autoridade: 'Autoridade',
    urgencia: 'Urgencia',
    curiosidade: 'Curiosidade',
    contraste: 'Contraste',
    identificacao: 'Identificacao',
    educativo: 'Educativo',
    controverso: 'Controverso',
  };
  return (
    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-[#A3E635]/10 text-[#A3E635]">
      {labels[angulo] || angulo}
    </span>
  );
}

function TopTable({
  title,
  criativos,
  metric,
}: {
  title: string;
  criativos: Creative[];
  metric: 'cpa' | 'roas';
}) {
  return (
    <div className="bg-[#1A1A1A] border border-[#333] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[#333]">
        <h3 className="text-sm font-semibold text-[#F5F5F5]">{title}</h3>
      </div>
      {criativos.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-6">Sem dados</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#333]">
              <th className="text-left p-3 font-medium text-gray-500">Nome</th>
              <th className="text-left p-3 font-medium text-gray-500">Angulo</th>
              <th className="text-right p-3 font-medium text-gray-500">CPA</th>
              <th className="text-right p-3 font-medium text-gray-500">ROAS</th>
              <th className="text-right p-3 font-medium text-gray-500">Impr.</th>
            </tr>
          </thead>
          <tbody>
            {criativos.map((c) => (
              <tr key={c.id} className="border-b border-[#333] last:border-0">
                <td className="p-3 text-[#F5F5F5] font-medium truncate max-w-[180px]">
                  {c.nome}
                </td>
                <td className="p-3">
                  <AnguloLabel angulo={c.angulo} />
                </td>
                <td
                  className="p-3 text-right font-bold"
                  style={{
                    color:
                      metric === 'cpa'
                        ? '#A3E635'
                        : parseNum(c.cpa_atual) <= CPA_TARGET
                          ? '#A3E635'
                          : '#EF4444',
                  }}
                >
                  {c.cpa_atual != null ? `R$${fmt(parseNum(c.cpa_atual), 2)}` : '-'}
                </td>
                <td className="p-3 text-right text-[#F5F5F5]">
                  {c.roas_atual != null ? fmt(parseNum(c.roas_atual), 2) : '-'}
                </td>
                <td className="p-3 text-right text-gray-400">
                  {c.total_impressions?.toLocaleString('pt-BR') ?? '0'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── CPA Chart (14 days) ──────────────────────────────────────
function CPAChart({ criativos }: { criativos: Creative[] }) {
  // Build last 14 days from criativos data (aggregated by created_at date)
  // Since we don't have daily metrics endpoint yet, show placeholder
  const hasData = criativos.length > 0;

  if (!hasData) {
    return (
      <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-6">
        <h3 className="text-sm font-semibold text-[#F5F5F5] mb-4">
          CPA Ultimos 14 dias
        </h3>
        <p className="text-xs text-gray-500 text-center py-8">
          Dados disponiveis apos sync de metricas
        </p>
      </div>
    );
  }

  // Generate 14 day labels + simulated bars from active criativos avg CPA
  const today = new Date();
  const days: { label: string; cpa: number | null }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    days.push({ label: `${dd}/${mm}`, cpa: null });
  }

  // Fill today with current avg CPA if available
  const activeCpas = criativos
    .filter((c) => c.cpa_atual != null && parseNum(c.cpa_atual) > 0)
    .map((c) => parseNum(c.cpa_atual));
  if (activeCpas.length > 0) {
    const avg = activeCpas.reduce((a, b) => a + b, 0) / activeCpas.length;
    days[days.length - 1].cpa = avg;
  }

  const validCpas = days.filter((d) => d.cpa !== null).map((d) => d.cpa!);
  const maxCpa = validCpas.length > 0 ? Math.max(...validCpas) : 100;

  return (
    <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-6">
      <h3 className="text-sm font-semibold text-[#F5F5F5] mb-4">
        CPA Ultimos 14 dias
      </h3>
      <div className="flex items-end gap-1 h-40">
        {days.map((day, i) => {
          if (day.cpa === null) {
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end">
                <div className="w-full bg-[#333] rounded-t" style={{ height: '4px' }} />
                <span className="text-[9px] text-gray-600 mt-1 whitespace-nowrap">
                  {day.label}
                </span>
              </div>
            );
          }
          const height = Math.max((day.cpa / (maxCpa * 1.2)) * 100, 8);
          const color = day.cpa <= CPA_TARGET ? '#A3E635' : '#EF4444';
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end">
              <span className="text-[9px] font-bold mb-1" style={{ color }}>
                {fmt(day.cpa, 0)}
              </span>
              <div
                className="w-full rounded-t transition-all"
                style={{ height: `${height}%`, backgroundColor: color }}
              />
              <span className="text-[9px] text-gray-500 mt-1 whitespace-nowrap">
                {day.label}
              </span>
            </div>
          );
        })}
      </div>
      {validCpas.length < 14 && (
        <p className="text-[10px] text-gray-600 mt-3 text-center">
          Historico completo disponivel apos sync diario de metricas
        </p>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function DashboardPerformance() {
  const [criativos, setCriativos] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/criativos?status=em_teste,winner,escala&sort=cpa&order=asc&limit=5'),
      fetch('/api/criativos?status=em_teste,winner,escala&sort=roas&order=desc&limit=5'),
      fetch('/api/criativos?status=em_teste,winner,escala&limit=200'),
    ])
      .then(async ([resCpa, resRoas, resAll]) => {
        if (!resCpa.ok || !resRoas.ok || !resAll.ok) throw new Error('Falha ao carregar dados');
        const [dataCpa, dataRoas, dataAll] = await Promise.all([
          resCpa.json(),
          resRoas.json(),
          resAll.json(),
        ]);
        return { topCpa: dataCpa.data || [], topRoas: dataRoas.data || [], all: dataAll.data || [] };
      })
      .then(({ topCpa, topRoas, all }) => {
        // Merge all unique criativos
        const map = new Map<string, Creative>();
        [...all, ...topCpa, ...topRoas].forEach((c: Creative) => map.set(c.id, c));
        setCriativos(Array.from(map.values()));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <KPICardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <TableSkeleton />
          <TableSkeleton />
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="bg-[#1A1A1A] border border-red-900 rounded-lg p-6 text-center">
        <p className="text-red-400 text-sm font-semibold">Erro ao carregar dashboard</p>
        <p className="text-xs text-gray-500 mt-1">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-xs text-[#A3E635] underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // ── Computations ──
  const active = criativos.filter((c) =>
    ['em_teste', 'winner', 'escala'].includes(c.status),
  );
  const totalSpend = active.reduce((s, c) => s + parseNum(c.total_spend), 0);
  const totalPurchases = active.reduce((s, c) => s + (c.total_purchases || 0), 0);
  const totalRevenue = active.reduce((s, c) => s + parseNum(c.total_revenue), 0);
  const avgCpa = totalPurchases > 0 ? totalSpend / totalPurchases : 0;
  const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  const topByCpa = [...active]
    .filter((c) => c.total_purchases > 0 && c.cpa_atual != null)
    .sort((a, b) => parseNum(a.cpa_atual) - parseNum(b.cpa_atual))
    .slice(0, 5);

  const topByRoas = [...active]
    .filter((c) => c.roas_atual != null)
    .sort((a, b) => parseNum(b.roas_atual) - parseNum(a.roas_atual))
    .slice(0, 5);

  // Alerts
  const winnersCount = active.filter((c) => c.is_winner).length;
  const saturatingCount = active.filter(
    (c) => parseNum(c.frequency_atual) > FREQUENCY_SATURATION,
  ).length;
  const killCount = active.filter(
    (c) => parseNum(c.total_spend) >= 90 && (c.total_purchases || 0) === 0,
  ).length;

  return (
    <div className="space-y-6">
      {/* ── KPIs Bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPICard
          label="Total Investido Hoje"
          value={`R$${fmt(totalSpend)}`}
        />
        <KPICard
          label="CPA Medio"
          value={avgCpa > 0 ? `R$${fmt(avgCpa, 2)}` : '-'}
        />
        <KPICard
          label="ROAS Medio"
          value={avgRoas > 0 ? fmt(avgRoas, 2) : '-'}
        />
        <KPICard
          label="Conversoes Hoje"
          value={String(totalPurchases)}
        />
        <KPICard
          label="Criativos Ativos"
          value={String(active.length)}
        />
      </div>

      {/* ── Top 5 Tables ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TopTable title="Top 5 por CPA" criativos={topByCpa} metric="cpa" />
        <TopTable title="Top 5 por ROAS" criativos={topByRoas} metric="roas" />
      </div>

      {/* ── Alertas ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <AlertCard
          emoji="\uD83C\uDFC6"
          title="Winners pra multiplicar"
          count={winnersCount}
          borderColor="#A3E635"
        />
        <AlertCard
          emoji="\u26A0\uFE0F"
          title="Saturando (freq > 3.5)"
          count={saturatingCount}
          borderColor="#F59E0B"
        />
        <AlertCard
          emoji="\u26D4"
          title="Kill Rule"
          count={killCount}
          borderColor="#EF4444"
        />
      </div>

      {/* ── CPA Chart 14 days ── */}
      <CPAChart criativos={active} />
    </div>
  );
}
