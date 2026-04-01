'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Criativo, CreativeAngulo, CreativeFormato, CreativePersona, CreativeStatus } from '@/lib/types-criativos';
import {
  ANGULO_LABELS, ANGULO_COLORS, FORMATO_LABELS, PERSONA_LABELS, STATUS_LABELS, STATUS_COLORS,
  ALL_ANGULOS, ALL_FORMATOS, ALL_PERSONAS,
} from '@/lib/types-criativos';
import { CriativoDetailModal } from './CriativoDetailModal';

type SortOption = 'created_at' | 'cpa_atual' | 'roas_atual' | 'ice_score';
type StatusFilter = '' | 'ao_vivo' | 'winners' | 'pausados' | 'em_producao';

const STATUS_FILTER_MAP: Record<Exclude<StatusFilter, ''>, CreativeStatus[]> = {
  ao_vivo: ['em_teste', 'escala'],
  winners: ['winner'],
  pausados: ['pausado'],
  em_producao: ['em_producao', 'revisao', 'aprovado', 'pronto'],
};

const SORT_LABELS: Record<SortOption, string> = {
  created_at: 'Mais recente',
  cpa_atual: 'Menor CPA',
  roas_atual: 'Maior ROAS',
  ice_score: 'ICE Score',
};

const ITEMS_PER_PAGE = 24;

// Formato icons (simple SVG-like text representations)
const FORMATO_ICONS: Record<string, string> = {
  video_talking_head: '🎤',
  video_motion_graphics: '🎬',
  video_depoimento: '💬',
  video_screen_recording: '🖥',
  video_misto: '🎞',
  estatico_single: '🖼',
  estatico_carrossel: '📑',
  estatico_antes_depois: '↔',
  estatico_lista: '📋',
  estatico_prova_social: '⭐',
  estatico_quote: '❝',
  estatico_comparacao: '⚖',
  estatico_numero: '#',
  estatico_headline_bold: 'H',
  story_vertical: '📱',
  reel_vertical: '▶',
};

export function BibliotecaCriativos() {
  const [criativos, setCriativos] = useState<Criativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterAngulo, setFilterAngulo] = useState<CreativeAngulo | ''>('');
  const [filterFormato, setFilterFormato] = useState<CreativeFormato | ''>('');
  const [filterPersona, setFilterPersona] = useState<CreativePersona | ''>('');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('');
  const [sortBy, setSortBy] = useState<SortOption>('created_at');
  const [selected, setSelected] = useState<Criativo | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(ITEMS_PER_PAGE),
      sort: sortBy,
      order: sortBy === 'cpa_atual' ? 'asc' : 'desc',
    });

    if (debouncedSearch) params.set('search', debouncedSearch);
    if (filterAngulo) params.set('angulo', filterAngulo);
    if (filterFormato) params.set('formato', filterFormato);
    if (filterPersona) params.set('persona', filterPersona);

    // Map status filter to actual statuses
    if (filterStatus) {
      const statuses = STATUS_FILTER_MAP[filterStatus];
      if (statuses) {
        params.set('status', statuses.join(','));
      }
    }

    try {
      const res = await fetch(`/api/criativos?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setCriativos(json.data || []);
      setTotal(json.total || 0);
    } catch {
      setCriativos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filterAngulo, filterFormato, filterPersona, filterStatus, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const showingFrom = total > 0 ? (page - 1) * ITEMS_PER_PAGE + 1 : 0;
  const showingTo = Math.min(page * ITEMS_PER_PAGE, total);

  const getStatusBadgeStyle = (status: CreativeStatus) => {
    const color = STATUS_COLORS[status] || '#6B7280';
    return {
      backgroundColor: `${color}20`,
      color,
    };
  };

  const selectStyle = {
    backgroundColor: 'var(--bg-card)',
    borderColor: 'var(--border-color)',
    color: 'var(--text-primary)',
  };

  return (
    <div>
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2"
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nome, hook, copy..."
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border focus:outline-none transition-colors"
            style={{ ...selectStyle }}
          />
        </div>

        {/* Angulo */}
        <select
          value={filterAngulo}
          onChange={(e) => { setFilterAngulo(e.target.value as CreativeAngulo | ''); setPage(1); }}
          className="px-3 py-2 rounded-lg text-sm border"
          style={selectStyle}
        >
          <option value="">Todos Angulos</option>
          {ALL_ANGULOS.map((a) => (
            <option key={a} value={a}>{ANGULO_LABELS[a]}</option>
          ))}
        </select>

        {/* Formato */}
        <select
          value={filterFormato}
          onChange={(e) => { setFilterFormato(e.target.value as CreativeFormato | ''); setPage(1); }}
          className="px-3 py-2 rounded-lg text-sm border"
          style={selectStyle}
        >
          <option value="">Todos Formatos</option>
          {ALL_FORMATOS.map((f) => (
            <option key={f} value={f}>{FORMATO_LABELS[f]}</option>
          ))}
        </select>

        {/* Persona */}
        <select
          value={filterPersona}
          onChange={(e) => { setFilterPersona(e.target.value as CreativePersona | ''); setPage(1); }}
          className="px-3 py-2 rounded-lg text-sm border"
          style={selectStyle}
        >
          <option value="">Todas Personas</option>
          {ALL_PERSONAS.map((p) => (
            <option key={p} value={p}>{PERSONA_LABELS[p]}</option>
          ))}
        </select>

        {/* Status */}
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as StatusFilter); setPage(1); }}
          className="px-3 py-2 rounded-lg text-sm border"
          style={selectStyle}
        >
          <option value="">Todos Status</option>
          <option value="ao_vivo">Ao Vivo</option>
          <option value="winners">Winners</option>
          <option value="pausados">Pausados</option>
          <option value="em_producao">Em Producao</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value as SortOption); setPage(1); }}
          className="px-3 py-2 rounded-lg text-sm border"
          style={selectStyle}
        >
          {Object.entries(SORT_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {total > 0
            ? `Mostrando ${showingFrom}-${showingTo} de ${total}`
            : 'Nenhum resultado'
          }
        </p>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
        </div>
      ) : criativos.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="text-4xl mb-4" style={{ color: 'var(--border-color)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5" className="mx-auto">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Nenhum criativo encontrado</p>
          <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>Tente ajustar os filtros ou crie um novo criativo</p>
          <a
            href="/marketing/criativos/briefing"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
          >
            + Novo Criativo
          </a>
        </div>
      ) : (
        <>
          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {criativos.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelected(c)}
                className="rounded-2xl border overflow-hidden cursor-pointer transition-all hover:border-[var(--accent)] hover:shadow-lg group"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
              >
                {/* Thumbnail */}
                <div
                  className="w-full flex items-center justify-center relative overflow-hidden"
                  style={{ height: 200, backgroundColor: 'var(--bg-card)' }}
                >
                  {c.arquivo_principal ? (
                    c.mime_type?.startsWith('video/') ? (
                      <div className="relative w-full h-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <video
                          src={c.arquivo_principal}
                          muted
                          preload="metadata"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="none" opacity="0.9">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.arquivo_thumbnail || c.arquivo_principal}
                        alt={c.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">{FORMATO_ICONS[c.formato] || '📄'}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{FORMATO_LABELS[c.formato]}</span>
                    </div>
                  )}

                  {/* Winner badge overlay */}
                  {c.is_winner && (
                    <div
                      className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold"
                      style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
                    >
                      WINNER
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3">
                  {/* Name */}
                  <p
                    className="text-sm font-semibold mb-2 line-clamp-1"
                    style={{ color: 'var(--text-primary)' }}
                    title={c.nome}
                  >
                    {c.nome}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {/* Angulo badge (colored) */}
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: `${ANGULO_COLORS[c.angulo]}20`,
                        color: ANGULO_COLORS[c.angulo],
                      }}
                    >
                      {ANGULO_LABELS[c.angulo]}
                    </span>

                    {/* Formato badge (gray) */}
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                    >
                      {FORMATO_LABELS[c.formato]}
                    </span>

                    {/* Status badge */}
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={getStatusBadgeStyle(c.status)}
                    >
                      {STATUS_LABELS[c.status]}
                    </span>
                  </div>

                  {/* Metrics (if ao vivo) */}
                  {(c.cpa_atual !== null || c.roas_atual !== null) && (
                    <div
                      className="flex gap-3 text-[11px] pt-2 border-t"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                    >
                      {c.cpa_atual !== null && (
                        <span>
                          CPA{' '}
                          <span
                            className="font-semibold"
                            style={{ color: Number(c.cpa_atual) <= 60 ? '#22C55E' : '#EF4444' }}
                          >
                            R${Number(c.cpa_atual).toFixed(0)}
                          </span>
                        </span>
                      )}
                      {c.roas_atual !== null && (
                        <span>
                          ROAS{' '}
                          <span
                            className="font-semibold"
                            style={{ color: Number(c.roas_atual) >= 1.4 ? '#22C55E' : '#EF4444' }}
                          >
                            {Number(c.roas_atual).toFixed(1)}x
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-8">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Mostrando {showingFrom}-{showingTo} de {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg text-sm border font-medium disabled:opacity-30 transition-colors hover:border-[var(--accent)]"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                Anterior
              </button>
              <span className="text-sm px-3" style={{ color: 'var(--text-muted)' }}>
                {page} / {totalPages || 1}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded-lg text-sm border font-medium disabled:opacity-30 transition-colors hover:border-[var(--accent)]"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                Proximo
              </button>
            </div>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selected && (
        <CriativoDetailModal
          criativo={selected}
          onClose={() => setSelected(null)}
          onUpdate={fetchData}
        />
      )}
    </div>
  );
}
