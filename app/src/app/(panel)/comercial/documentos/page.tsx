'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Loader2,
  FileText,
  Upload,
  X,
  Download,
  Pencil,
  Trash2,
  AlertTriangle,
  FileUp,
  GripVertical,
} from 'lucide-react';
import { PdfThumbnail } from '@/components/pdf-thumbnail';
import { useDragReorder } from '@/hooks/useDragReorder';

interface Document {
  id: string;
  created_at: string;
  updated_at: string | null;
  name: string;
  file_path: string;
  file_url: string;
  file_size: number;
  thumbnail_url: string | null;
  uploaded_by: string | null;
  mime_type: string | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '--';
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--';
  }
}

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const resp = await fetch('/api/comercial/documentos');
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
        throw new Error(body.error || `HTTP ${resp.status}`);
      }
      const json = await resp.json();
      setDocuments(json.documents ?? []);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // ── Upload handler ──
  const handleUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Apenas arquivos PDF sao aceitos');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('Arquivo excede o limite de 50MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const resp = await fetch('/api/comercial/documentos', {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
        throw new Error(body.error || `HTTP ${resp.status}`);
      }

      const json = await resp.json();
      setDocuments((prev) => [json.document, ...prev]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro no upload';
      setError(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Rename handler ──
  const handleRename = async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }

    try {
      const resp = await fetch('/api/comercial/documentos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: trimmed }),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
        throw new Error(body.error || `HTTP ${resp.status}`);
      }

      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, name: trimmed } : d))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao renomear';
      setError(message);
    } finally {
      setEditingId(null);
    }
  };

  // ── Delete handler ──
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setConfirmDeleteId(null);

    try {
      const resp = await fetch(`/api/comercial/documentos?id=${id}`, {
        method: 'DELETE',
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
        throw new Error(body.error || `HTTP ${resp.status}`);
      }

      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar';
      setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Drag reorder ──
  const { getDragProps, isOver, isDragging } = useDragReorder({
    items: documents,
    onReorder: setDocuments,
    apiEndpoint: '/api/comercial/documentos',
  });

  // ── Drag & drop upload ──
  const [dragOver, setDragOver] = useState(false);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin text-lime-400 mx-auto mb-4" />
          <p className="text-sm text-zinc-500">Carregando documentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        // Only show file drop overlay for external file drags
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
          setDragOver(true);
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleFileDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-white">Documentos</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Gerencie os documentos comerciais da equipe
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-lime-400/10 text-lime-400 border border-lime-400/15">
            {documents.length} {documents.length === 1 ? 'documento' : 'documentos'}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-400/10 border border-lime-400/20 text-sm font-bold text-lime-400 hover:bg-lime-400/15 transition-colors cursor-pointer disabled:opacity-40"
          >
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            Subir documento
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/15">
          <AlertTriangle size={16} />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Drag overlay */}
      {dragOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
          <div className="rounded-2xl border-2 border-dashed border-lime-400/40 bg-[#111111]/90 p-12 text-center">
            <FileUp size={48} className="text-lime-400 mx-auto mb-4" />
            <p className="text-lg font-bold text-white">Solte o PDF aqui</p>
            <p className="text-sm text-zinc-500 mt-1">Maximo 50MB</p>
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setConfirmDeleteId(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[#222222] bg-[#0a0a0a] shadow-2xl">
            <div className="px-6 py-5 border-b border-[#222222]">
              <h2 className="text-base font-extrabold text-white">Deletar documento</h2>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-zinc-400">
                Tem certeza que deseja deletar este documento? Esta acao nao pode ser desfeita.
              </p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#222222]">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-zinc-500 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-sm font-bold text-red-400 hover:bg-red-500/15 cursor-pointer"
              >
                <Trash2 size={14} />
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {documents.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-[#222222] bg-[#111111]/50">
          <div className="w-16 h-16 rounded-2xl bg-lime-400/5 border border-lime-400/10 flex items-center justify-center mb-5">
            <FileText size={28} className="text-lime-400/40" />
          </div>
          <p className="text-base font-bold text-white mb-1">Nenhum documento ainda</p>
          <p className="text-sm text-zinc-500 mb-6">
            Suba seu primeiro PDF para comecar
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lime-400/10 border border-lime-400/20 text-sm font-bold text-lime-400 hover:bg-lime-400/15 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Upload size={16} />
            Subir documento
          </button>
        </div>
      )}

      {/* Document grid */}
      {documents.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {documents.map((doc, index) => {
            const isEditing = editingId === doc.id;
            const isDeleting = deletingId === doc.id;
            const dragging = isDragging(index);
            const over = isOver(index);

            return (
              <div
                key={doc.id}
                {...getDragProps(index)}
                className={`group relative rounded-xl border bg-[#111111] transition-all duration-200 hover:border-[#333333] hover:bg-[#141414] ${
                  isDeleting ? 'opacity-50 pointer-events-none' : ''
                } ${dragging ? 'opacity-40 scale-[0.97] border-lime-400/30' : 'border-[#222222]'} ${
                  over ? 'border-lime-400/60 ring-2 ring-lime-400/20 bg-lime-400/[0.03]' : ''
                }`}
                style={{ cursor: 'grab' }}
              >
                {/* Drag handle */}
                <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-60 hover:!opacity-100 p-1 rounded text-zinc-500 transition-opacity">
                  <GripVertical size={14} />
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDeleteId(doc.id);
                  }}
                  className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-[#111111]/90 border border-[#333333] text-zinc-500 hover:text-red-400 hover:border-red-400/20 transition-all cursor-pointer"
                  title="Deletar"
                >
                  <X size={12} />
                </button>

                {/* Thumbnail / icon area — click to open PDF */}
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <PdfThumbnail
                    url={doc.file_url}
                    className="h-36 rounded-t-xl border-b border-[#1e1e1e]"
                  />
                </a>

                {/* Info area */}
                <div className="p-3">
                  {/* Editable name */}
                  {isEditing ? (
                    <input
                      ref={editInputRef}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(doc.id, editName);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onBlur={() => handleRename(doc.id, editName)}
                      className="w-full bg-transparent border border-lime-400/30 rounded-lg px-2 py-1 text-sm font-semibold text-white outline-none"
                    />
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(doc.id);
                        setEditName(doc.name);
                      }}
                      className="group/name flex items-center gap-1.5 w-full text-left cursor-pointer"
                      title="Clique para editar o nome"
                    >
                      <p className="text-sm font-semibold text-white truncate flex-1">
                        {doc.name}
                      </p>
                      <Pencil
                        size={11}
                        className="text-zinc-700 opacity-0 group-hover/name:opacity-100 transition-opacity flex-shrink-0"
                      />
                    </button>
                  )}

                  {/* Meta info */}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-zinc-600">{formatDate(doc.created_at)}</p>
                    <p className="text-xs text-zinc-600">{formatFileSize(doc.file_size)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-transparent hover:border-[#333333] transition-all"
                    >
                      <FileText size={12} />
                      Abrir
                    </a>
                    <a
                      href={doc.file_url}
                      download={`${doc.name}.pdf`}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-transparent hover:border-[#333333] transition-all"
                    >
                      <Download size={12} />
                      Baixar
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
