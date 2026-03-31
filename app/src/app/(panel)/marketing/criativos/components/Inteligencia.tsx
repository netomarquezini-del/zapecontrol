'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SugestaoVariacao, CreativeAngulo, CreativeFormato } from '../types';

// ── Types ────────────────────────────────────────────────────
interface RankingItem {
  key: string;
  label: string;
  avg_cpa: number;
  taxa_winner: number;
  count: number;
}

interface IntelResponse {
  cpa_por_angulo: RankingItem[];
  cpa_por_formato: RankingItem[];
  taxa_winner_por_angulo: RankingItem[];
  insights: string[];
}

// ── Labels ───────────────────────────────────────────────────
const ANGULO_LABELS: Record<string, string> = {
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

const FORMATO_LABELS: Record<string, string> = {
  video_talking_head: 'Talking Head',
  video_motion_graphics: 'Motion Graphics',
  video_depoimento: 'Depoimento',
  video_screen_recording: 'Screen Recording',
  video_misto: 'Video Misto',
  estatico_single: 'Estatico Single',
  estatico_carrossel: 'Carrossel',
  estatico_antes_depois: 'Antes/Depois',
  estatico_lista: 'Lista',
  estatico_prova_social: 'Prova Social',
  estatico_quote: 'Quote',
  estatico_comparacao: 'Comparacao',
  estatico_numero: 'Numero',
  estatico_headline_bold: 'Headline Bold',
  story_vertical: 'Story',
  reel_vertical: 'Reel',
};

// ── Helpers ──────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-[#333] ${className}`} />;
}

// ── Horizontal Bar Chart (CSS) ──────────────────────────────
function HorizontalBarChart({
  title,
  items,
  metricLabel,
  metricKey,
  invertBar = false,
}: {
  title: string;
  items: RankingItem[];
  metricLabel: string;
  metricKey: 'avg_cpa' | 'taxa_winner';
  invertBar?: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-4">
        <h3 className="text-sm font-semibold text-[#F5F5F5] mb-3">{title}</h3>
        <p className="text-xs text-gray-500 text-center py-4">Sem dados</p>
      </div>
    );
  }

  const values = items.map((i) => i[metricKey]);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values);

  return (
    <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-4">
      <h3 className="text-sm font-semibold text-[#F5F5F5] mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((item) => {
          const val = item[metricKey];
          // For CPA: lower is better, so invert the bar width
          const barWidth = invertBar
            ? maxVal > 0
              ? ((maxVal - val + minVal) / maxVal) * 100
              : 0
            : (val / maxVal) * 100;

          return (
            <div key={item.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#F5F5F5] font-medium">
                  {item.label}
                </span>
                <span className="text-xs text-[#A3E635] font-bold">
                  {metricKey === 'avg_cpa'
                    ? `R$${val.toFixed(2)}`
                    : `${(val * 100).toFixed(0)}%`}
                </span>
              </div>
              <div className="h-3 rounded-full bg-[#0A0A0A] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(barWidth, 4)}%`,
                    background: 'linear-gradient(90deg, #A3E635, #65A30D)',
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-600 mt-0.5">
                {item.count} criativos
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Period Selector ──────────────────────────────────────────
function PeriodSelector({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (p: string) => void;
}) {
  const periods = ['7d', '14d', '30d', 'all'];
  const labels: Record<string, string> = {
    '7d': '7d',
    '14d': '14d',
    '30d': '30d',
    all: 'All',
  };

  return (
    <div className="flex gap-1 bg-[#0A0A0A] rounded-lg p-1">
      {periods.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            selected === p
              ? 'bg-[#A3E635] text-black'
              : 'text-gray-400 hover:text-[#F5F5F5]'
          }`}
        >
          {labels[p]}
        </button>
      ))}
    </div>
  );
}

// ── Suggestion Card ──────────────────────────────────────────
function SugestaoCard({
  sugestao,
  onAccept,
  onReject,
}: {
  sugestao: SugestaoVariacao;
  onAccept: () => void;
  onReject: () => void;
}) {
  const [acting, setActing] = useState(false);
  const formatoLabel =
    sugestao.formato_sugerido
      ? FORMATO_LABELS[sugestao.formato_sugerido] || sugestao.formato_sugerido
      : null;

  return (
    <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-4">
      <p className="text-sm text-[#F5F5F5] font-medium mb-1">
        Winner: {sugestao.criativo_origem_id.slice(0, 6).toUpperCase()}
        {formatoLabel && (
          <>
            {' \u2192 '}
            <span className="text-[#A3E635]">Formato sugerido: {formatoLabel}</span>
          </>
        )}
      </p>
      <p className="text-xs text-gray-400 mb-1">{sugestao.descricao}</p>
      {sugestao.copy_sugerido && (
        <p className="text-xs text-gray-500 italic mb-3 line-clamp-2">
          &ldquo;{sugestao.copy_sugerido}&rdquo;
        </p>
      )}
      <p className="text-[10px] text-gray-600 mb-3">
        Motivo: {sugestao.motivo} | Confianca: {(sugestao.confianca * 100).toFixed(0)}%
      </p>
      <div className="flex gap-2">
        <button
          disabled={acting}
          onClick={async () => {
            setActing(true);
            onAccept();
          }}
          className="flex-1 py-1.5 text-xs font-semibold rounded bg-[#A3E635]/20 text-[#A3E635] hover:bg-[#A3E635]/30 transition-colors disabled:opacity-50"
        >
          {'\u2713'} Aceitar
        </button>
        <button
          disabled={acting}
          onClick={async () => {
            setActing(true);
            onReject();
          }}
          className="flex-1 py-1.5 text-xs font-semibold rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
        >
          {'\u2717'} Rejeitar
        </button>
      </div>
    </div>
  );
}

// ── Insights Section ─────────────────────────────────────────
function InsightsSection({ insights }: { insights: string[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="bg-[#1A1A1A] border border-[#A3E635]/30 rounded-lg p-5">
      <h3 className="text-sm font-bold text-[#A3E635] mb-3">
        Insights Automaticos
      </h3>
      <ul className="space-y-2">
        {insights.map((insight, i) => (
          <li key={i} className="text-sm text-[#F5F5F5] flex gap-2">
            <span className="text-[#A3E635] shrink-0">{'\u25B8'}</span>
            {insight}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Generate insights from ranking data ──────────────────────
function generateInsights(data: IntelResponse): string[] {
  const insights: string[] = [];

  // Compare CPA by angulo
  const angulosSorted = [...(data.cpa_por_angulo || [])].sort(
    (a, b) => a.avg_cpa - b.avg_cpa,
  );
  if (angulosSorted.length >= 2) {
    const best = angulosSorted[0];
    const worst = angulosSorted[angulosSorted.length - 1];
    if (worst.avg_cpa > 0 && best.avg_cpa > 0) {
      const ratio = (worst.avg_cpa / best.avg_cpa).toFixed(1);
      insights.push(
        `${best.label} tem CPA ${ratio}x menor que ${worst.label}`,
      );
    }
  }

  // Compare CPA by formato
  const formatosSorted = [...(data.cpa_por_formato || [])].sort(
    (a, b) => a.avg_cpa - b.avg_cpa,
  );
  if (formatosSorted.length >= 2) {
    const best = formatosSorted[0];
    insights.push(
      `Melhor formato por CPA: ${best.label} (R$${best.avg_cpa.toFixed(2)})`,
    );
  }

  // Winner rate insights
  const winnerSorted = [...(data.taxa_winner_por_angulo || [])].sort(
    (a, b) => b.taxa_winner - a.taxa_winner,
  );
  if (winnerSorted.length >= 1 && winnerSorted[0].taxa_winner > 0) {
    insights.push(
      `${winnerSorted[0].label} tem a maior taxa de winner: ${(winnerSorted[0].taxa_winner * 100).toFixed(0)}%`,
    );
  }

  // Cross-compare: best angulo + best formato suggestion
  if (angulosSorted.length > 0 && formatosSorted.length > 0) {
    insights.push(
      `Combinacao sugerida: ${angulosSorted[0].label} + ${formatosSorted[0].label}`,
    );
  }

  // Volume insight
  const totalCriativos = (data.cpa_por_angulo || []).reduce(
    (s, i) => s + i.count,
    0,
  );
  if (totalCriativos > 0) {
    const lowVolume = (data.cpa_por_angulo || []).filter((a) => a.count < 3);
    if (lowVolume.length > 0) {
      insights.push(
        `${lowVolume.length} angulo(s) com menos de 3 criativos testados — mais volume necessario`,
      );
    }
  }

  return insights.slice(0, 5);
}

// ── Main Component ───────────────────────────────────────────
export default function Inteligencia() {
  const [periodo, setPeriodo] = useState('30d');
  const [data, setData] = useState<IntelResponse | null>(null);
  const [sugestoes, setSugestoes] = useState<SugestaoVariacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [intelRes, sugRes] = await Promise.all([
        fetch(`/api/inteligencia?periodo=${periodo}`),
        fetch('/api/sugestoes?status=pendente'),
      ]);

      if (!intelRes.ok) throw new Error('Falha ao carregar inteligencia');

      const intelData = await intelRes.json();
      setData(intelData);

      if (sugRes.ok) {
        const sugData = await sugRes.json();
        setSugestoes(sugData.data || sugData || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSugestaoAction = async (
    id: string,
    status: 'aceita' | 'rejeitada',
  ) => {
    try {
      const res = await fetch('/api/sugestoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar sugestao');
      setSugestoes((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // silently fail — could add toast here
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#1A1A1A] border border-[#333] rounded-lg p-4 space-y-3">
              <Skeleton className="h-4 w-40" />
              {[...Array(4)].map((_, j) => (
                <Skeleton key={j} className="h-8 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="bg-[#1A1A1A] border border-red-900 rounded-lg p-6 text-center">
        <p className="text-red-400 text-sm font-semibold">Erro ao carregar inteligencia</p>
        <p className="text-xs text-gray-500 mt-1">{error}</p>
        <button
          onClick={fetchData}
          className="mt-3 text-xs text-[#A3E635] underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const insights = data ? generateInsights(data) : [];

  return (
    <div className="space-y-6">
      {/* ── Period Selector ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#F5F5F5]">Inteligencia</h2>
        <PeriodSelector selected={periodo} onChange={setPeriodo} />
      </div>

      {/* ── Rankings ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <HorizontalBarChart
          title="CPA Medio por Angulo"
          items={data?.cpa_por_angulo || []}
          metricLabel="CPA"
          metricKey="avg_cpa"
          invertBar
        />
        <HorizontalBarChart
          title="CPA Medio por Formato"
          items={data?.cpa_por_formato || []}
          metricLabel="CPA"
          metricKey="avg_cpa"
          invertBar
        />
      </div>

      <HorizontalBarChart
        title="Taxa de Winner por Angulo"
        items={data?.taxa_winner_por_angulo || []}
        metricLabel="Taxa"
        metricKey="taxa_winner"
      />

      {/* ── Sugestoes de Proximos Criativos ── */}
      {sugestoes.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-[#F5F5F5] mb-3">
            Sugestoes de Proximos Criativos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sugestoes.map((s) => (
              <SugestaoCard
                key={s.id}
                sugestao={s}
                onAccept={() => handleSugestaoAction(s.id, 'aceita')}
                onReject={() => handleSugestaoAction(s.id, 'rejeitada')}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Insights Automaticos ── */}
      <InsightsSection insights={insights} />

      {/* ── Empty state ── */}
      {!data?.cpa_por_angulo?.length &&
        !data?.cpa_por_formato?.length &&
        sugestoes.length === 0 && (
          <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-12 text-center">
            <p className="text-lg font-bold text-[#F5F5F5] mb-2">
              Sem dados de inteligencia ainda
            </p>
            <p className="text-sm text-gray-500">
              Rankings serao gerados quando criativos tiverem metricas de performance.
            </p>
          </div>
        )}
    </div>
  );
}
