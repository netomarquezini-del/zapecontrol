'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Criativo, CreativeStatus, CreativeAngulo, CreativeFormato, CreativePersona } from '@/lib/types-criativos';
import {
  STATUS_LABELS, STATUS_COLORS, STATUS_TRANSITIONS,
  ANGULO_LABELS, ANGULO_COLORS, FORMATO_LABELS, PERSONA_LABELS,
  ALL_ANGULOS, ALL_FORMATOS, ALL_PERSONAS,
} from '@/lib/types-criativos';
import { CreativeCard } from './CreativeCard';
import { CriativoDetailModal } from './CriativoDetailModal';

// Kanban columns with merged statuses for display
interface KanbanColumn {
  id: string;
  label: string;
  statuses: CreativeStatus[];
  color: string;
  dropTarget: CreativeStatus; // which status to assign on drop
}

const COLUMNS: KanbanColumn[] = [
  { id: 'ideia', label: 'Ideia', statuses: ['ideia'], color: STATUS_COLORS.ideia, dropTarget: 'ideia' },
  { id: 'producao', label: 'Producao', statuses: ['em_producao'], color: STATUS_COLORS.em_producao, dropTarget: 'em_producao' },
  { id: 'revisao', label: 'Revisao', statuses: ['revisao'], color: STATUS_COLORS.revisao, dropTarget: 'revisao' },
  { id: 'aprovado', label: 'Aprovado', statuses: ['aprovado'], color: STATUS_COLORS.aprovado, dropTarget: 'aprovado' },
  { id: 'pronto', label: 'Pronto', statuses: ['pronto'], color: STATUS_COLORS.pronto, dropTarget: 'pronto' },
  { id: 'ao_vivo', label: 'Ao Vivo', statuses: ['em_teste', 'winner', 'escala'], color: STATUS_COLORS.em_teste, dropTarget: 'em_teste' },
  { id: 'pausado', label: 'Pausado', statuses: ['saturado', 'pausado'], color: STATUS_COLORS.pausado, dropTarget: 'pausado' },
  { id: 'morto', label: 'Morto', statuses: ['morto'], color: STATUS_COLORS.morto, dropTarget: 'morto' },
];

export function KanbanBoard() {
  const [criativos, setCriativos] = useState<Criativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCriativo, setSelectedCriativo] = useState<Criativo | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [filterAngulo, setFilterAngulo] = useState<CreativeAngulo | ''>('');
  const [filterFormato, setFilterFormato] = useState<CreativeFormato | ''>('');
  const [filterPersona, setFilterPersona] = useState<CreativePersona | ''>('');
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCriativos = useCallback(async () => {
    try {
      const res = await fetch('/api/criativos?limit=500');
      const json = await res.json();
      setCriativos(json.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch criativos:', err);
      setError('Falha ao carregar criativos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCriativos(); }, [fetchCriativos]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, column: KanbanColumn) => {
    e.preventDefault();
    setDragOverColumn(null);
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;

    const criativo = criativos.find((c) => c.id === id);
    if (!criativo) {
      setDraggedId(null);
      return;
    }

    // If already in this column, do nothing
    if (column.statuses.includes(criativo.status)) {
      setDraggedId(null);
      return;
    }

    const targetStatus = column.dropTarget;

    // Validate transition
    const valid = STATUS_TRANSITIONS[criativo.status];
    if (!valid.includes(targetStatus)) {
      showToast(`Transicao invalida: ${STATUS_LABELS[criativo.status]} -> ${STATUS_LABELS[targetStatus]}`);
      setDraggedId(null);
      return;
    }

    // Optimistic update
    const previousStatus = criativo.status;
    setCriativos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: targetStatus } : c)),
    );

    try {
      const res = await fetch(`/api/criativos/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        showToast(json.error || `Erro ao mover criativo para ${STATUS_LABELS[targetStatus]}`);
        // Revert
        setCriativos((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: previousStatus } : c)),
        );
      } else {
        showToast(`Movido para ${STATUS_LABELS[targetStatus]}`, 'success');
      }
    } catch {
      setCriativos((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: previousStatus } : c)),
      );
      showToast('Erro de conexao ao mover criativo');
    }
    setDraggedId(null);
  };

  const filteredCriativos = criativos.filter((c) => {
    if (filterAngulo && c.angulo !== filterAngulo) return false;
    if (filterFormato && c.formato !== filterFormato) return false;
    if (filterPersona && c.persona !== filterPersona) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
        <button
          onClick={() => { setLoading(true); fetchCriativos(); }}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-[100] px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg transition-all"
          style={{
            backgroundColor: toast.type === 'error' ? '#991B1B' : '#166534',
            color: '#FFFFFF',
            border: `1px solid ${toast.type === 'error' ? '#EF4444' : '#22C55E'}`,
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={filterAngulo}
          onChange={(e) => setFilterAngulo(e.target.value as CreativeAngulo | '')}
          className="px-3 py-1.5 rounded-lg text-sm border outline-none"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          <option value="">Todos angulos</option>
          {ALL_ANGULOS.map((a) => <option key={a} value={a}>{ANGULO_LABELS[a]}</option>)}
        </select>
        <select
          value={filterFormato}
          onChange={(e) => setFilterFormato(e.target.value as CreativeFormato | '')}
          className="px-3 py-1.5 rounded-lg text-sm border outline-none"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          <option value="">Todos formatos</option>
          {ALL_FORMATOS.map((f) => <option key={f} value={f}>{FORMATO_LABELS[f]}</option>)}
        </select>
        <select
          value={filterPersona}
          onChange={(e) => setFilterPersona(e.target.value as CreativePersona | '')}
          className="px-3 py-1.5 rounded-lg text-sm border outline-none"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          <option value="">Todas personas</option>
          {ALL_PERSONAS.map((p) => <option key={p} value={p}>{PERSONA_LABELS[p]}</option>)}
        </select>

        <div className="flex-1" />

        <span className="text-xs self-center" style={{ color: 'var(--text-muted)' }}>
          {filteredCriativos.length} criativo{filteredCriativos.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Board */}
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
        {COLUMNS.map((col) => {
          const cards = filteredCriativos.filter((c) => col.statuses.includes(c.status));
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              className="flex-shrink-0 rounded-xl border flex flex-col transition-colors"
              style={{
                width: 280,
                backgroundColor: isOver ? 'rgba(163, 230, 53, 0.03)' : 'var(--bg-secondary)',
                borderColor: isOver ? 'var(--accent)' : 'var(--border-color)',
              }}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col)}
            >
              {/* Column Header */}
              <div className="px-3 py-2.5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-sm font-semibold">{col.label}</span>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)' }}
                >
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 48px)' }}>
                {cards.length === 0 && (
                  <div className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>
                    Nenhum criativo
                  </div>
                )}
                {cards.map((c) => (
                  <CreativeCard
                    key={c.id}
                    criativo={c}
                    isDragging={draggedId === c.id}
                    onDragStart={handleDragStart}
                    onClick={() => setSelectedCriativo(c)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selectedCriativo && (
        <CriativoDetailModal
          criativo={selectedCriativo}
          onClose={() => setSelectedCriativo(null)}
          onUpdate={fetchCriativos}
        />
      )}
    </div>
  );
}
