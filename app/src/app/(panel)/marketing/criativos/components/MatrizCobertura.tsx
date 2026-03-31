'use client';

import { useState, useEffect, useMemo } from 'react';
import type { MatrizCobertura as MatrizData, CreativeAngulo, CreativeFormato } from '@/lib/types-criativos';
import { ALL_ANGULOS, ALL_FORMATOS, ANGULO_LABELS } from '@/lib/types-criativos';

// Abbreviated column headers matching the 16 formatos
const FORMATO_ABBREV: Record<CreativeFormato, string> = {
  video_talking_head: 'TH',
  video_motion_graphics: 'MG',
  video_depoimento: 'DP',
  video_screen_recording: 'SC',
  video_misto: 'MX',
  estatico_single: 'EST',
  estatico_carrossel: 'CAR',
  estatico_antes_depois: 'BA',
  estatico_lista: 'LST',
  estatico_prova_social: 'PSO',
  estatico_quote: 'QTE',
  estatico_comparacao: 'CMP',
  estatico_numero: 'NUM',
  estatico_headline_bold: 'HDB',
  story_vertical: 'STV',
  reel_vertical: 'RLV',
};

const FORMATO_FULL: Record<CreativeFormato, string> = {
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
  story_vertical: 'Story Vertical',
  reel_vertical: 'Reel Vertical',
};

interface CellSummary {
  total: number;
  ao_vivo: number;
  em_producao: number;
  winners: number;
}

export function MatrizCobertura() {
  const [data, setData] = useState<MatrizData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ angulo: string; formato: string } | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    fetch('/api/matriz')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => setData(json.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Build a lookup map for O(1) cell access
  const cellMap = useMemo(() => {
    const map = new Map<string, CellSummary>();
    for (const angulo of ALL_ANGULOS) {
      for (const formato of ALL_FORMATOS) {
        const key = `${angulo}::${formato}`;
        const matches = data.filter((m) => m.angulo === angulo && m.formato === formato);
        const total = matches.reduce((s, c) => s + c.total_criativos, 0);
        const ao_vivo = matches.reduce((s, c) => s + c.total_em_teste, 0);
        const em_producao = total - ao_vivo - matches.reduce((s, c) => s + c.total_mortos, 0);
        const winners = matches.reduce((s, c) => s + c.total_winners, 0);
        map.set(key, { total, ao_vivo: ao_vivo, em_producao: Math.max(0, em_producao), winners });
      }
    }
    return map;
  }, [data]);

  const getCell = (angulo: CreativeAngulo, formato: CreativeFormato): CellSummary => {
    return cellMap.get(`${angulo}::${formato}`) || { total: 0, ao_vivo: 0, em_producao: 0, winners: 0 };
  };

  const getCellBg = (cell: CellSummary): string => {
    if (cell.ao_vivo > 0) return 'rgba(34, 197, 94, 0.25)';
    if (cell.em_producao > 0) return 'rgba(250, 204, 21, 0.18)';
    return 'var(--bg-card)';
  };

  // Row totals
  const getRowTotal = (angulo: CreativeAngulo): number => {
    return ALL_FORMATOS.reduce((sum, f) => sum + getCell(angulo, f).total, 0);
  };

  // Column totals
  const getColTotal = (formato: CreativeFormato): number => {
    return ALL_ANGULOS.reduce((sum, a) => sum + getCell(a, formato).total, 0);
  };

  // Coverage
  const totalSlots = ALL_ANGULOS.length * ALL_FORMATOS.length;
  const filledSlots = useMemo(() => {
    let count = 0;
    for (const a of ALL_ANGULOS) {
      for (const f of ALL_FORMATOS) {
        if (getCell(a, f).total > 0) count++;
      }
    }
    return count;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellMap]);
  const coveragePct = totalSlots > 0 ? ((filledSlots / totalSlots) * 100).toFixed(1) : '0';

  const handleCellClick = (angulo: CreativeAngulo, formato: CreativeFormato) => {
    const cell = getCell(angulo, formato);
    if (cell.total === 0) {
      // Navigate to briefing tab with pre-selected params
      const params = new URLSearchParams({ angulo, formato });
      window.location.href = `/marketing/criativos/briefing?${params.toString()}`;
    }
  };

  const handleMouseEnter = (e: React.MouseEvent, angulo: string, formato: string) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
    setHoveredCell({ angulo, formato });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-sm mb-2">Erro ao carregar matriz</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Coverage Score Header */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="px-5 py-3 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Cobertura: </span>
          <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{coveragePct}%</span>
          <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>({filledSlots}/{totalSlots} slots preenchidos)</span>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.25)', border: '1px solid rgba(34, 197, 94, 0.4)' }} />
            Ao Vivo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(250, 204, 21, 0.18)', border: '1px solid rgba(250, 204, 21, 0.3)' }} />
            Em Producao
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} />
            Vazio
          </span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: 'var(--border-color)' }}>
        <table className="w-full border-collapse text-xs" style={{ minWidth: 900 }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-card)' }}>
              <th
                className="p-3 text-left font-semibold sticky left-0 z-10"
                style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', minWidth: 120 }}
              >
                Angulo
              </th>
              {ALL_FORMATOS.map((f) => (
                <th
                  key={f}
                  className="p-1 text-center font-medium"
                  style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', minWidth: 48 }}
                  title={FORMATO_FULL[f]}
                >
                  <span
                    className="inline-block"
                    style={{
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                      maxHeight: 70,
                      fontSize: 10,
                      letterSpacing: '0.5px',
                    }}
                  >
                    {FORMATO_ABBREV[f]}
                  </span>
                </th>
              ))}
              <th
                className="p-2 text-center font-semibold"
                style={{ color: 'var(--accent)', borderBottom: '1px solid var(--border-color)', minWidth: 50 }}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {ALL_ANGULOS.map((angulo, rowIdx) => {
              const rowTotal = getRowTotal(angulo);
              return (
                <tr
                  key={angulo}
                  className="transition-colors"
                  style={{ backgroundColor: rowIdx % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)' }}
                >
                  <td
                    className="p-3 font-medium sticky left-0 z-10"
                    style={{
                      backgroundColor: rowIdx % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    {ANGULO_LABELS[angulo]}
                  </td>
                  {ALL_FORMATOS.map((formato) => {
                    const cell = getCell(angulo, formato);
                    const isHovered = hoveredCell?.angulo === angulo && hoveredCell?.formato === formato;
                    return (
                      <td
                        key={formato}
                        className="p-1 text-center cursor-pointer transition-all relative group"
                        style={{
                          backgroundColor: getCellBg(cell),
                          borderBottom: '1px solid var(--border-color)',
                          borderRight: '1px solid var(--bg-card)',
                          outline: isHovered ? '2px solid var(--accent)' : 'none',
                          outlineOffset: -1,
                        }}
                        onClick={() => handleCellClick(angulo, formato)}
                        onMouseEnter={(e) => handleMouseEnter(e, angulo, formato)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {cell.total > 0 ? (
                          <span
                            className="font-bold text-sm"
                            style={{
                              color: cell.winners > 0 ? 'var(--accent)' : cell.ao_vivo > 0 ? '#22C55E' : '#FACC15',
                            }}
                          >
                            {cell.total}
                          </span>
                        ) : (
                          <span
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-lg font-light"
                            style={{ color: '#555' }}
                          >
                            +
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td
                    className="p-2 text-center font-bold text-sm"
                    style={{ color: rowTotal > 0 ? 'var(--text-primary)' : '#555', borderBottom: '1px solid var(--border-color)' }}
                  >
                    {rowTotal}
                  </td>
                </tr>
              );
            })}
            {/* Column totals row */}
            <tr style={{ backgroundColor: 'var(--bg-card)' }}>
              <td
                className="p-3 font-semibold sticky left-0 z-10"
                style={{ backgroundColor: 'var(--bg-card)', color: 'var(--accent)', borderTop: '2px solid var(--border-color)' }}
              >
                Total
              </td>
              {ALL_FORMATOS.map((f) => {
                const colTotal = getColTotal(f);
                return (
                  <td
                    key={f}
                    className="p-1 text-center font-bold text-sm"
                    style={{
                      color: colTotal > 0 ? 'var(--text-primary)' : '#555',
                      borderTop: '2px solid var(--border-color)',
                    }}
                  >
                    {colTotal}
                  </td>
                );
              })}
              <td
                className="p-2 text-center font-bold text-sm"
                style={{ color: 'var(--accent)', borderTop: '2px solid var(--border-color)' }}
              >
                {ALL_ANGULOS.reduce((s, a) => s + getRowTotal(a), 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tooltip */}
      {hoveredCell && (() => {
        const cell = getCell(hoveredCell.angulo as CreativeAngulo, hoveredCell.formato as CreativeFormato);
        return (
          <div
            className="fixed z-50 px-3 py-2 rounded-lg text-xs shadow-xl pointer-events-none"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: 'translate(-50%, -100%)',
              backgroundColor: 'var(--bg-card-hover)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <p className="font-semibold mb-1">
              {ANGULO_LABELS[hoveredCell.angulo as CreativeAngulo]} x {FORMATO_FULL[hoveredCell.formato as CreativeFormato]}
            </p>
            <p>
              <span style={{ color: '#22C55E' }}>{cell.ao_vivo}</span> ao vivo,{' '}
              <span style={{ color: '#FACC15' }}>{cell.em_producao}</span> em producao,{' '}
              <span style={{ color: 'var(--accent)' }}>{cell.winners}</span> winners
            </p>
          </div>
        );
      })()}
    </div>
  );
}
