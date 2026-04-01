'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Criativo, HistoricoStatus } from '@/lib/types-criativos';
import type { CreativeFormato } from '@/lib/types-criativos';
import {
  STATUS_LABELS, STATUS_COLORS, STATUS_TRANSITIONS,
  ANGULO_LABELS, ANGULO_COLORS, FORMATO_LABELS, PERSONA_LABELS, EMOCAO_LABELS,
  CPA_TARGET, ALL_FORMATOS,
} from '@/lib/types-criativos';

interface Props {
  criativo: Criativo;
  onClose: () => void;
  onUpdate: () => void;
}

const COPY_LIMITS: Record<string, number | null> = {
  hook: null,
  copy_primario: 250,
  copy_titulo: 40,
  copy_descricao: 30,
  roteiro: null,
};

const COPY_FIELD_LABELS: Record<string, string> = {
  hook: 'Hook',
  copy_primario: 'Texto Primario',
  copy_titulo: 'Headline',
  copy_descricao: 'Descricao',
  roteiro: 'Roteiro',
};

export function CriativoDetailModal({ criativo, onClose, onUpdate }: Props) {
  const [detail, setDetail] = useState<Criativo & { historico?: HistoricoStatus[] }>(criativo);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/criativos/${criativo.id}`)
      .then((r) => r.json())
      .then((json) => { if (json.data) setDetail(json.data); })
      .finally(() => setLoading(false));
  }, [criativo.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingField) {
          setEditingField(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, editingField]);

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
      const VERCEL_LIMIT = 4 * 1024 * 1024; // 4MB safe limit

      if (uploadFile.size <= VERCEL_LIMIT) {
        // Small file: direct upload through API
        const formData = new FormData();
        formData.append('file', uploadFile);
        const res = await fetch(`/api/criativos/${criativo.id}/upload`, { method: 'POST', body: formData });
        if (!res.ok) {
          const json = await res.json();
          alert(json.error || 'Upload falhou');
          return;
        }
      } else {
        // Large file: signed URL upload directly to Supabase Storage
        const signRes = await fetch(`/api/criativos/${criativo.id}/upload?signed=true`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: uploadFile.name,
            fileType: uploadFile.type,
            fileSize: uploadFile.size,
          }),
        });
        if (!signRes.ok) {
          const json = await signRes.json();
          alert(json.error || 'Falha ao gerar URL de upload');
          return;
        }
        const { signedUrl, token, path, fileType } = await signRes.json();

        // Upload directly to Supabase Storage
        const uploadRes = await fetch(signedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': fileType,
            ...(token ? { 'x-upsert': 'true' } : {}),
          },
          body: uploadFile,
        });
        if (!uploadRes.ok) {
          alert('Upload direto falhou. Tente um arquivo menor.');
          return;
        }

        // Confirm upload — update criativo record
        const confirmRes = await fetch(`/api/criativos/${criativo.id}/upload`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path, fileType, fileSize: uploadFile.size }),
        });
        if (!confirmRes.ok) {
          const json = await confirmRes.json();
          alert(json.error || 'Falha ao confirmar upload');
          return;
        }
      }

      onUpdate();
      setUploadFile(null);
      const r = await fetch(`/api/criativos/${criativo.id}`);
      const json = await r.json();
      if (json.data) setDetail(json.data);
    } finally {
      setUploading(false);
    }
  };

  const startEdit = useCallback((field: string) => {
    const value = (detail as unknown as Record<string, unknown>)[field];
    setEditValue(typeof value === 'string' ? value : '');
    setEditingField(field);
  }, [detail]);

  const cancelEdit = useCallback(() => {
    setEditingField(null);
    setEditValue('');
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingField) return;
    const limit = COPY_LIMITS[editingField];
    if (limit && editValue.length > limit) {
      alert(`Maximo ${limit} caracteres`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/criativos/${criativo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [editingField]: editValue || null }),
      });
      if (res.ok) {
        setDetail((prev) => ({ ...prev, [editingField]: editValue || null }));
        setEditingField(null);
        setEditValue('');
        onUpdate();
      } else {
        const json = await res.json();
        alert(json.error || 'Falha ao salvar');
      }
    } finally {
      setSaving(false);
    }
  }, [editingField, editValue, criativo.id, onUpdate]);

  const handleDelete = useCallback(async () => {
    if (!confirm('Tem certeza que quer excluir este criativo? Essa ação não pode ser desfeita.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/criativos/${criativo.id}`, { method: 'DELETE' });
      if (res.ok) {
        onUpdate();
        onClose();
      } else {
        const json = await res.json();
        alert(json.error || 'Falha ao excluir');
      }
    } finally {
      setDeleting(false);
    }
  }, [criativo.id, onUpdate, onClose]);

  const validTransitions = STATUS_TRANSITIONS[detail.status] || [];
  const isLive = ['em_teste', 'winner', 'escala'].includes(detail.status);
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
              {/* Formato selector */}
              <FormatoSelector
                value={detail.formato}
                onChange={async (newFormato) => {
                  const res = await fetch(`/api/criativos/${criativo.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ formato: newFormato }),
                  });
                  if (res.ok) {
                    setDetail((prev) => ({ ...prev, formato: newFormato }));
                    onUpdate();
                  }
                }}
              />

              <div className="grid grid-cols-2 gap-3 mt-3">
                <InfoField label="Persona" value={PERSONA_LABELS[detail.persona]} />
                <InfoField label="Emocao" value={EMOCAO_LABELS[detail.emocao_primaria]} />
                <InfoField label="Geracao" value={String(detail.geracao)} />
                {detail.agente_produtor && <InfoField label="Agente" value={detail.agente_produtor} />}
                {detail.duracao_segundos && <InfoField label="Duracao" value={`${detail.duracao_segundos}s`} />}
              </div>

              {/* File preview + download */}
              {detail.arquivo_principal && (
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
                  <div className="p-2 flex justify-end" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <a
                      href={detail.arquivo_principal}
                      download={`${detail.nome}.${detail.mime_type?.split('/')[1] || 'mp4'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Baixar
                    </a>
                  </div>
                </div>
              )}

              {/* Upload area — always visible */}
              <div className="mt-3">
                <UploadArea
                  hasFile={!!detail.arquivo_principal}
                  uploadFile={uploadFile}
                  uploading={uploading}
                  onFileChange={(f) => setUploadFile(f)}
                  onUpload={handleUpload}
                />
              </div>
            </Section>

            {/* Copy Section — Editable */}
            <Section title="Copy">
              <EditableCopyField
                field="hook"
                detail={detail}
                editingField={editingField}
                editValue={editValue}
                saving={saving}
                onStartEdit={startEdit}
                onEditValueChange={setEditValue}
                onSave={saveEdit}
                onCancel={cancelEdit}
              />
              <EditableCopyField
                field="copy_primario"
                detail={detail}
                editingField={editingField}
                editValue={editValue}
                saving={saving}
                onStartEdit={startEdit}
                onEditValueChange={setEditValue}
                onSave={saveEdit}
                onCancel={cancelEdit}
              />
              <EditableCopyField
                field="copy_titulo"
                detail={detail}
                editingField={editingField}
                editValue={editValue}
                saving={saving}
                onStartEdit={startEdit}
                onEditValueChange={setEditValue}
                onSave={saveEdit}
                onCancel={cancelEdit}
              />
              <EditableCopyField
                field="copy_descricao"
                detail={detail}
                editingField={editingField}
                editValue={editValue}
                saving={saving}
                onStartEdit={startEdit}
                onEditValueChange={setEditValue}
                onSave={saveEdit}
                onCancel={cancelEdit}
              />
              <EditableCopyField
                field="roteiro"
                detail={detail}
                editingField={editingField}
                editValue={editValue}
                saving={saving}
                onStartEdit={startEdit}
                onEditValueChange={setEditValue}
                onSave={saveEdit}
                onCancel={cancelEdit}
              />
            </Section>

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
                  <div
                    className="absolute left-[5px] top-2 bottom-2 w-px"
                    style={{ backgroundColor: 'var(--border-color)' }}
                  />
                  <div className="space-y-3">
                    {detail.historico.slice(0, 15).map((h: HistoricoStatus) => (
                      <div key={h.id} className="relative flex items-start gap-3">
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

            {/* Delete */}
            <div className="pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full px-4 py-2.5 rounded-lg text-xs font-medium border transition-all hover:opacity-80 disabled:opacity-50"
                style={{ borderColor: '#EF4444', color: '#EF4444' }}
              >
                {deleting ? 'Excluindo...' : 'Excluir criativo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Formato Selector ────────────────────────────────────────

const FORMATO_GROUPS: { label: string; formatos: CreativeFormato[] }[] = [
  {
    label: 'Video',
    formatos: ['video_talking_head', 'video_caixinha_pergunta', 'video_motion_graphics', 'video_depoimento', 'video_screen_recording', 'video_misto'],
  },
  {
    label: 'Estatico',
    formatos: ['estatico_single', 'estatico_carrossel', 'estatico_antes_depois', 'estatico_lista', 'estatico_prova_social', 'estatico_quote', 'estatico_comparacao', 'estatico_numero', 'estatico_headline_bold'],
  },
  {
    label: 'Vertical',
    formatos: ['story_vertical', 'reel_vertical'],
  },
];

function FormatoSelector({ value, onChange }: { value: CreativeFormato; onChange: (f: CreativeFormato) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <span className="text-[10px] font-medium block mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        Formato
      </span>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: open ? '2px solid var(--accent)' : '1px solid var(--border-color)',
        }}
      >
        <span>{FORMATO_LABELS[value]}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : '' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute z-20 mt-1 w-full rounded-lg border shadow-xl overflow-hidden"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <div className="max-h-[300px] overflow-y-auto">
            {FORMATO_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)' }}>
                  {group.label}
                </div>
                {group.formatos.filter((f) => ALL_FORMATOS.includes(f)).map((f) => (
                  <button
                    key={f}
                    onClick={() => { onChange(f); setOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-[var(--bg-card)]"
                    style={{
                      color: f === value ? 'var(--accent)' : 'var(--text-primary)',
                      fontWeight: f === value ? 600 : 400,
                    }}
                  >
                    {FORMATO_LABELS[f]}
                    {f === value && ' ✓'}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Upload Area ─────────────────────────────────────────────

function UploadArea({
  hasFile,
  uploadFile,
  uploading,
  onFileChange,
  onUpload,
}: {
  hasFile: boolean;
  uploadFile: File | null;
  uploading: boolean;
  onFileChange: (f: File | null) => void;
  onUpload: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileChange(file);
  };

  return (
    <div
      className={`relative rounded-lg border-2 border-dashed p-4 transition-colors ${dragOver ? 'border-solid' : ''}`}
      style={{
        borderColor: dragOver ? 'var(--accent)' : 'var(--border-color)',
        backgroundColor: dragOver ? 'var(--accent)08' : 'transparent',
      }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {uploadFile ? (
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {uploadFile.name}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {(uploadFile.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
          <button
            onClick={() => onFileChange(null)}
            className="text-xs px-2 py-1 rounded"
            style={{ color: 'var(--text-muted)' }}
          >
            Cancelar
          </button>
          <button
            onClick={onUpload}
            disabled={uploading}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
          >
            {uploading ? 'Enviando...' : hasFile ? 'Substituir' : 'Enviar'}
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center gap-1.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-muted)' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {hasFile ? 'Trocar arquivo' : 'Arraste ou clique para enviar'}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            JPG, PNG, MP4, MOV (max 100MB)
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
            onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}

// ── Editable Copy Field ─────────────────────────────────────

function EditableCopyField({
  field,
  detail,
  editingField,
  editValue,
  saving,
  onStartEdit,
  onEditValueChange,
  onSave,
  onCancel,
}: {
  field: string;
  detail: Criativo;
  editingField: string | null;
  editValue: string;
  saving: boolean;
  onStartEdit: (field: string) => void;
  onEditValueChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const value = (detail as unknown as Record<string, unknown>)[field] as string | null;
  const label = COPY_FIELD_LABELS[field] || field;
  const limit = COPY_LIMITS[field];
  const isEditing = editingField === field;
  const isMultiline = field === 'roteiro' || field === 'copy_primario' || field === 'hook';

  const charDisplay = limit
    ? `${(isEditing ? editValue : value || '').length}/${limit}`
    : null;

  const isOverLimit = limit ? (isEditing ? editValue : value || '').length > limit : false;

  return (
    <div className="mb-3 group">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {label} {charDisplay && (
            <span style={{ color: isOverLimit ? '#EF4444' : 'var(--text-muted)' }}>({charDisplay})</span>
          )}
        </span>
        {!isEditing && (
          <button
            onClick={() => onStartEdit(field)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] px-1.5 py-0.5 rounded"
            style={{ color: 'var(--accent)', backgroundColor: 'var(--accent)10' }}
          >
            Editar
          </button>
        )}
      </div>

      {isEditing ? (
        <div>
          {isMultiline ? (
            <textarea
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              rows={field === 'roteiro' ? 8 : 4}
              autoFocus
              className="w-full text-sm p-3 rounded-lg leading-relaxed resize-y outline-none"
              style={{
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: `2px solid var(--accent)`,
              }}
            />
          ) : (
            <input
              type="text"
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              autoFocus
              className="w-full text-sm p-3 rounded-lg outline-none"
              style={{
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: `2px solid var(--accent)`,
              }}
            />
          )}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={onSave}
              disabled={saving || isOverLimit}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => onStartEdit(field)}
          className="text-sm p-3 rounded-lg whitespace-pre-wrap leading-relaxed cursor-pointer transition-colors hover:border-opacity-60"
          style={{
            backgroundColor: 'var(--bg-card)',
            color: value ? 'var(--text-secondary)' : 'var(--text-muted)',
            border: '1px solid var(--border-color)',
          }}
        >
          {value || `Clique para adicionar ${label.toLowerCase()}`}
        </div>
      )}
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
  if (hook.includes('?')) return hook;
  return null;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
