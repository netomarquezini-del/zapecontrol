'use client';

import type { Criativo } from '@/lib/types-criativos';
import { ANGULO_LABELS, ANGULO_COLORS, FORMATO_LABELS, CPA_TARGET } from '@/lib/types-criativos';

interface Props {
  criativo: Criativo;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onClick: () => void;
}

export function CreativeCard({ criativo, isDragging, onDragStart, onClick }: Props) {
  const cpaValue = criativo.cpa_atual ? parseFloat(String(criativo.cpa_atual)) : null;
  const roasValue = criativo.roas_atual ? parseFloat(String(criativo.roas_atual)) : null;
  const cpaColor = cpaValue !== null ? (cpaValue <= CPA_TARGET ? '#A3E635' : '#EF4444') : 'var(--text-muted)';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, criativo.id)}
      onClick={onClick}
      className="rounded-lg border p-3 cursor-pointer transition-all hover:border-[var(--accent)]"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: isDragging ? 'var(--accent)' : 'var(--border-color)',
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <div className="flex gap-2.5">
        {/* Thumbnail */}
        {criativo.arquivo_thumbnail && (
          <div
            className="w-[60px] h-[60px] rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            {criativo.mime_type?.startsWith('video/') ? (
              <div className="w-full h-full flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name */}
          <p className="text-sm font-semibold mb-1.5 truncate">{criativo.nome}</p>

          {/* Badges */}
          <div className="flex flex-wrap gap-1 mb-1.5">
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{ backgroundColor: `${ANGULO_COLORS[criativo.angulo]}20`, color: ANGULO_COLORS[criativo.angulo] }}
            >
              {ANGULO_LABELS[criativo.angulo]}
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{ backgroundColor: 'rgba(107,114,128,0.15)', color: 'var(--text-secondary)' }}
            >
              {FORMATO_LABELS[criativo.formato]}
            </span>
          </div>

          {/* Metrics */}
          {(cpaValue !== null || roasValue !== null) && (
            <div className="flex gap-3 text-[11px]">
              {cpaValue !== null && (
                <span style={{ color: cpaColor }} className="font-medium">
                  CPA R${cpaValue.toFixed(0)}
                </span>
              )}
              {roasValue !== null && (
                <span style={{ color: 'var(--text-secondary)' }} className="font-medium">
                  ROAS {roasValue.toFixed(1)}x
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
