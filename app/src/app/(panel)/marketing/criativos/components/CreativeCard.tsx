'use client';

import type { Criativo, CreativeFormato } from '@/lib/types-criativos';
import { ANGULO_LABELS, ANGULO_COLORS, FORMATO_LABELS, CPA_TARGET } from '@/lib/types-criativos';

const FORMAT_ICONS: Partial<Record<CreativeFormato, string>> = {
  video_talking_head: '🎙️',
  video_motion_graphics: '🎬',
  video_depoimento: '🗣️',
  video_screen_recording: '🖥️',
  video_misto: '🎞️',
  estatico_single: '🖼️',
  estatico_carrossel: '📑',
  estatico_antes_depois: '↔️',
  estatico_lista: '📋',
  estatico_prova_social: '⭐',
  estatico_quote: '💬',
  estatico_comparacao: '⚖️',
  estatico_numero: '🔢',
  estatico_headline_bold: '🔤',
  story_vertical: '📱',
  reel_vertical: '📱',
};

function FormatIcon({ formato }: { formato: CreativeFormato }) {
  return (
    <span className="text-xl">{FORMAT_ICONS[formato] || '📄'}</span>
  );
}

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
        <div
          className="w-[60px] h-[60px] rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center relative"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          {criativo.arquivo_principal && criativo.mime_type?.startsWith('image/') ? (
            <img
              src={criativo.arquivo_principal}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : criativo.arquivo_principal && criativo.mime_type?.startsWith('video/') ? (
            <>
              <video
                src={criativo.arquivo_principal}
                muted
                preload="metadata"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            </>
          ) : (
            <FormatIcon formato={criativo.formato} />
          )}
        </div>

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
