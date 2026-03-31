'use client';

import { useState, useEffect } from 'react';
import type { Criativo, HistoricoStatus } from '@/lib/types-criativos';
import {
  STATUS_LABELS, STATUS_COLORS, STATUS_TRANSITIONS,
  ANGULO_LABELS, ANGULO_COLORS, FORMATO_LABELS, PERSONA_LABELS, EMOCAO_LABELS,
  CPA_TARGET,
} from '@/lib/types-criativos';

interface Props {
  criativo: Criativo;
  onClose: () => void;
  onUpdate: () => void;
}

export function CriativoDetailModal({ criativo, onClose, onUpdate }: Props) {
  const [detail, setDetail] = useState<Criativo & { historico?: HistoricoStatus[] }>(criativo);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch(`/api/criativos/${criativo.id}`)
      .then((r) => r.json())
      .then((json) => { if (json.data) setDetail(json.data); })
      .finally(() => setLoading(false));
  }, [criativo.id]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleStatusChange = async (newStatus: string) => {
    setTransitioning(true);
    try {
      const res = await fetch(`/api/criativos/${criativo.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        onUpdate();
        onClose();
      } else {
        const json = await res.json();
        alert(json.error || 'Falha ao alterar status');
      }
    } finally {
      setTransitioning(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const res = await fetch(`/api/criativos/${criativo.id}/upload`, { method: 'POST', body: formData });
      if (res.ok) {
        onUpdate();
        setUploadFile(null);
        const r = await fetch(`/api/criativos/${criativo.id}`);
        const json = await r.json();
        if (json.data) setDetail(json.data);
      } else {
        const json = await res.json();
        alert(json.error || 'Upload falhou');
      }
    } finally {
      setUploading(false);
    }
  };

  const validTransitions = STATUS_TRANSITIONS[detail.status] || [];
  const isLive = ['em_teste', 'winner', 'escala'].includes(detail.status);

  // Parse PRSA from copy fields
  const prsa = parsePRSA(detail);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl h-full border-l shadow-2xl overflow-y-auto"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold truncate">{detail.nome}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${STATUS_COLORS[detail.status]}20`, color: STATUS_COLORS[detail.status] }}
              >
                {STATUS_LABELS[detail.status]}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded font-medium"
                style={{ backgroundColor: `${ANGULO_COLORS[detail.angulo]}20`, color: ANGULO_COLORS[detail.angulo] }}
              >
                {ANGULO_LABELS[detail.angulo]}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="p-10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Info Grid */}
            <Section title="Producao">
              <div className="grid grid-cols-2 gap-3">
                <InfoField label="Formato" value={FORMATO_LABELS[detail.formato]} />
                <InfoField label="Persona" value={PERSONA_LABELS[detail.persona]} />
                <InfoField label="Emocao" value={EMOCAO_LABELS[detail.emocao_primaria]} />
                <InfoField label="Geracao" value={String(detail.geracao)} />
                {detail.agente_produtor && <InfoField label="Agente" value={detail.agente_produtor} />}
                {detail.duracao_segundos && <InfoField label="Duracao" value={`${detail.duracao_segundos}s`} />}
              </div>

              {/* File preview */}
              {detail.arquivo_principal ? (
                <div className="mt-3 rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
                  {detail.mime_type?.startsWith('video/') ? (
                    <video
                      src={detail.arquivo_principal}
                      controls
                      className="w-full max-h-[300px] object-contain"
                      style={{ backgroundColor: '#000' }}
                    />
                  ) : detail.mime_type?.startsWith('image/') ? (
                    <img
                      src={detail.arquivo_principal}
                      alt={detail.nome}
                      className="w-full max-h-[300px] object-contain"
                    />
                  ) : (
                    <div className="p-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {detail.arquivo_principal} ({detail.mime_type})
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-3">
                  <div className="flex gap-2 items-center">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,video/mp4,video/quicktime"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="text-xs flex-1"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    {uploadFile && (
                      <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
                      >
                        {uploading ? 'Enviando...' : 'Upload'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </Section>

            {/* Copy Section */}
            {(detail.hook || detail.copy_primario || detail.copy_titulo || detail.copy_descricao) && (
              <Section title="Copy">
                {detail.hook && <CopyField label="Hook" value={detail.hook} />}
                {detail.copy_primario && (
                  <CopyField label={`Texto Primario (${detail.copy_primario.length}/250)`} value={detail.copy_primario} />
                )}
                {detail.copy_titulo && (
                  <CopyField label={`Headline (${detail.copy_titulo.length}/40)`} value={detail.copy_titulo} />
                )}
                {detail.copy_descricao && (
                  <CopyField label={`Descricao (${detail.copy_descricao.length}/30)`} value={detail.copy_descricao} />
                )}
                {detail.roteiro && (
                  <CopyField label="Roteiro" value={detail.roteiro} />
                )}
              </Section>
            )}

            {/* PRSA Section */}
            {(prsa.problema || prsa.resultado || prsa.solucao || prsa.acao) && (
              <Section title="PRSA">
                <div className="grid grid-cols-2 gap-3">
                  {prsa.problema && (
                    <PRSACard letter="P" label="Problema" value={prsa.problema} color="#EF4444" />
                  )}
                  {prsa.resultado && (
                    <PRSACard letter="R" label="Resultado" value={prsa.resultado} color="#A3E635" />
                  )}
                  {prsa.solucao && (
                    <PRSACard letter="S" label="Solucao" value={prsa.solucao} color="#3B82F6" />
                  )}
                  {prsa.acao && (
                    <PRSACard letter="A" label="Acao" value={prsa.acao} color="#F59E0B" />
                  )}
                </div>
              </Section>
            )}

            {/* Metrics */}
            {isLive && (
              <Section title="Metricas">
                <div className="grid grid-cols-4 gap-3">
                  <MetricBox
                    label="CPA"
                    value={detail.cpa_atual ? `R$${parseFloat(String(detail.cpa_atual)).toFixed(2)}` : '-'}
                    color={detail.cpa_atual && parseFloat(String(detail.cpa_atual)) <= CPA_TARGET ? '#A3E635' : '#EF4444'}
                  />
                  <MetricBox
                    label="ROAS"
                    value={detail.roas_atual ? `${parseFloat(String(detail.roas_atual)).toFixed(2)}x` : '-'}
                    color={detail.roas_atual && parseFloat(String(detail.roas_atual)) >= 1.4 ? '#A3E635' : '#EF4444'}
                  />
                  <MetricBox label="CTR" value={detail.ctr_atual ? `${parseFloat(String(detail.ctr_atual)).toFixed(2)}%` : '-'} />
                  <MetricBox label="Frequency" value={detail.frequency_atual ? parseFloat(String(detail.frequency_atual)).toFixed(1) : '-'} />
                </div>
                <div className="grid grid-cols-4 gap-3 mt-3">
                  <MetricBox label="Impressoes" value={formatNumber(detail.total_impressions)} />
                  <MetricBox label="Spend" value={`R$${parseFloat(String(detail.total_spend)).toFixed(0)}`} />
                  <MetricBox label="Compras" value={String(detail.total_purchases || 0)} />
                  <MetricBox label="Dias Ativo" value={String(detail.dias_ativo || 0)} />
                </div>
              </Section>
            )}

            {/* Status Transitions */}
            {validTransitions.length > 0 && (
              <Section title="Mover para">
                <div className="flex flex-wrap gap-2">
                  {validTransitions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={transitioning}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:opacity-80 disabled:opacity-50"
                      style={{ borderColor: STATUS_COLORS[s], color: STATUS_COLORS[s] }}
                    >
                      {transitioning ? '...' : STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {/* History Timeline */}
            {detail.historico && detail.historico.length > 0 && (
              <Section title="Historico">
                <div className="relative pl-4">
                  {/* Timeline line */}
                  <div
                    className="absolute left-[5px] top-2 bottom-2 w-px"
                    style={{ backgroundColor: 'var(--border-color)' }}
                  />

                  <div className="space-y-3">
                    {detail.historico.slice(0, 15).map((h: HistoricoStatus) => (
                      <div key={h.id} className="relative flex items-start gap-3">
                        {/* Dot */}
                        <div
                          className="absolute -left-[11px] top-1.5 w-2.5 h-2.5 rounded-full border-2"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            borderColor: STATUS_COLORS[h.status_novo],
                          }}
                        />

                        <div
                          className="flex-1 text-xs p-2 rounded-lg"
                          style={{ backgroundColor: 'var(--bg-card)' }}
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            {h.status_anterior && (
                              <>
                                <span style={{ color: STATUS_COLORS[h.status_anterior] }}>
                                  {STATUS_LABELS[h.status_anterior]}
                                </span>
                                <span style={{ color: 'var(--text-muted)' }}>-&gt;</span>
                              </>
                            )}
                            <span className="font-medium" style={{ color: STATUS_COLORS[h.status_novo] }}>
                              {STATUS_LABELS[h.status_novo]}
                            </span>
                            <span className="ml-auto" style={{ color: 'var(--text-muted)' }}>
                              {new Date(h.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          {h.motivo && (
                            <p style={{ color: 'var(--text-muted)' }}>{h.motivo}</p>
                          )}
                          {h.executado_por && (
                            <p style={{ color: 'var(--text-muted)' }}>por {h.executado_por}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>
            )}

            {/* Notes */}
            {detail.notas && (
              <Section title="Notas">
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{detail.notas}</p>
              </Section>
            )}

            {/* Tags */}
            {detail.tags && detail.tags.length > 0 && (
              <Section title="Tags">
                <div className="flex flex-wrap gap-1.5">
                  {detail.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helper Components ────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] font-medium block mb-0.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3">
      <span className="text-[10px] font-medium block mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <div
        className="text-sm p-3 rounded-lg whitespace-pre-wrap leading-relaxed"
        style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
      >
        {value}
      </div>
    </div>
  );
}

function PRSACard({ letter, label, value, color }: { letter: string; label: string; value: string; color: string }) {
  return (
    <div
      className="p-3 rounded-lg border"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: `${color}30` }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {letter}
        </span>
        <span className="text-xs font-medium" style={{ color }}>{label}</span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{value}</p>
    </div>
  );
}

function MetricBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="p-2.5 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <div className="text-[10px] mb-0.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-sm font-bold" style={{ color: color || 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

// ── PRSA Parser ──────────────────────────────────────────────

function parsePRSA(detail: Criativo): { problema: string | null; resultado: string | null; solucao: string | null; acao: string | null } {
  const text = detail.roteiro || detail.copy_primario || '';
  if (!text) return { problema: null, resultado: null, solucao: null, acao: null };

  // Try to extract PRSA sections from roteiro
  const problema = extractSection(text, ['PROBLEMA', 'DOR', 'P:']) || extractFromHook(detail.hook);
  const resultado = extractSection(text, ['RESULTADO', 'BENEFICIO', 'R:']);
  const solucao = extractSection(text, ['SOLUCAO', 'MECANISMO', 'S:']);
  const acao = extractSection(text, ['ACAO', 'CTA', 'A:']);

  return { problema, resultado, solucao, acao };
}

function extractSection(text: string, markers: string[]): string | null {
  for (const marker of markers) {
    const regex = new RegExp(`${marker}[:\\s]*(.+?)(?=\\n[A-Z]+[:\\s]|$)`, 'is');
    const match = text.match(regex);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return null;
}

function extractFromHook(hook: string | null): string | null {
  if (!hook) return null;
  // If hook is a question, treat it as the problem statement
  if (hook.includes('?')) return hook;
  return null;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
