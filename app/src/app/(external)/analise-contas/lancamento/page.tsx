'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, DragEvent } from 'react';
import {
  ClipboardCheck,
  Loader2,
  Check,
  ArrowLeft,
  Plus,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  X,
  Pencil,
  RefreshCw,
  ArrowUpDown,
  FilterX,
} from 'lucide-react';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────
interface AnaliseRecord {
  id: string;
  nome_cliente: string;
  data_agendamento: string | null;
  data_analise: string | null;
  consultor: string | null;
  status: string | null;
  closer: string | null;
  data_call_fechamento: string | null;
  fechou: string | null;
  mes_referencia: string | null;
  observacoes: string | null;
  data_finalizacao: string | null;
}

// ── Constants ──────────────────────────────────────────────────
const CONSULTORES = ['Camily', 'Renata', 'Ettore', 'Isabela', 'Izadora', 'Heitor', 'Ana Carolina', 'Maria Eduarda', 'Eduardo', 'Vinicius', 'Duda'];
const STATUS_OPTIONS = ['Agendado', 'Concluído (Closer)', 'Finalizado (Sem interesse)', 'NoShow'] as const;
const CLOSERS_LIST = ['João', 'Luan', 'Neto'];

type StatusKey = typeof STATUS_OPTIONS[number];

const COLUMN_CONFIG: Record<StatusKey, { label: string; color: string; headerBg: string; headerBorder: string }> = {
  'Agendado': { label: 'Agendado', color: 'text-zinc-400', headerBg: 'bg-zinc-500/10', headerBorder: 'border-zinc-500/20' },
  'Concluído (Closer)': { label: 'Concluido (Closer)', color: 'text-green-500', headerBg: 'bg-green-500/10', headerBorder: 'border-green-500/20' },
  'Finalizado (Sem interesse)': { label: 'Sem Interesse', color: 'text-red-500', headerBg: 'bg-red-500/10', headerBorder: 'border-red-500/20' },
  'NoShow': { label: 'NoShow', color: 'text-yellow-500', headerBg: 'bg-yellow-500/10', headerBorder: 'border-yellow-500/20' },
};

// ── Helpers ────────────────────────────────────────────────────
function formatDateBR(iso: string | null): string {
  if (!iso) return '--';
  try {
    const [y, m, d] = iso.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  } catch {
    return '--';
  }
}

function statusBadge(status: string | null) {
  const s = (status || '').toLowerCase();
  if (s.includes('conclu')) return 'bg-green-500/10 text-green-500 border-green-500/15';
  if (s.includes('sem interesse') || s.includes('finalizado')) return 'bg-red-500/10 text-red-500 border-red-500/15';
  if (s.includes('noshow') || s.includes('no show')) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/15';
  return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/15';
}

function getMonthLabel(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function getRecordStatus(r: AnaliseRecord): StatusKey {
  const s = r.status || '';
  if (s.includes('Conclu')) return 'Concluído (Closer)';
  if (s.toLowerCase().includes('sem interesse') || s.toLowerCase().includes('finalizado')) return 'Finalizado (Sem interesse)';
  if (s.toLowerCase().includes('noshow') || s.toLowerCase().includes('no show')) return 'NoShow';
  return 'Agendado';
}

// ── Main Component ─────────────────────────────────────────────
export default function LancamentoAnalisePage() {
  // Data
  const [allRecords, setAllRecords] = useState<AnaliseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & View
  const [filterMes, setFilterMes] = useState<string>('');
  const [filterConsultor, setFilterConsultor] = useState<string>('');
  const [filterCloser, setFilterCloser] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Sort
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Form
  const [formOpen, setFormOpen] = useState(false);
  const [nomeCliente, setNomeCliente] = useState('');
  const [dataAgendamento, setDataAgendamento] = useState('');
  const [dataAnalise, setDataAnalise] = useState('');
  const [consultor, setConsultor] = useState('');
  const [formStatus, setFormStatus] = useState<string>('Agendado');
  const [formCloser, setFormCloser] = useState('');
  const [dataCallFechamento, setDataCallFechamento] = useState('');
  const [fechou, setFechou] = useState('');
  const [mesReferencia, setMesReferencia] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Closer modal (on drag to Concluido)
  const [closerModal, setCloserModal] = useState<{ id: string; nome: string } | null>(null);
  const [modalCloser, setModalCloser] = useState('');
  const [modalDataCall, setModalDataCall] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  // Edit modal
  const [editRecord, setEditRecord] = useState<AnaliseRecord | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // Drag state
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/comercial/analise-contas');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      setAllRecords(json.records ?? []);
    } catch (err) {
      console.error('[AnaliseContas] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived ──────────────────────────────────────────────────
  const uniqueMeses = [...new Set(allRecords.map(r => getMonthLabel(r.data_agendamento)).filter(Boolean))].sort() as string[];
  const uniqueConsultores = [...new Set(allRecords.map(r => r.consultor).filter(Boolean))].sort() as string[];
  const uniqueClosers = [...new Set(allRecords.map(r => r.closer).filter(Boolean))].sort() as string[];
  const uniqueStatuses = [...new Set(allRecords.map(r => r.status).filter(Boolean))].sort() as string[];

  const hasActiveFilters = !!(filterMes || filterConsultor || filterCloser || filterStatus);

  const clearAllFilters = () => {
    setFilterMes('');
    setFilterConsultor('');
    setFilterCloser('');
    setFilterStatus('');
  };

  const records = allRecords.filter(r => {
    if (filterMes && getMonthLabel(r.data_agendamento) !== filterMes) return false;
    if (filterConsultor && r.consultor !== filterConsultor) return false;
    if (filterCloser && r.closer !== filterCloser) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  // ── Sort ──────────────────────────────────────────────────
  function handleSort(column: string) {
    if (sortColumn === column) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else { setSortColumn(null); setSortDirection('asc'); }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }

  const sortedRecords = [...records].sort((a, b) => {
    if (!sortColumn) return 0;
    const dir = sortDirection === 'asc' ? 1 : -1;
    const fieldMap: Record<string, (r: AnaliseRecord) => string> = {
      nome_cliente: r => (r.nome_cliente || '').toLowerCase(),
      data_agendamento: r => r.data_agendamento || '',
      data_analise: r => r.data_analise || '',
      consultor: r => (r.consultor || '').toLowerCase(),
      status: r => (r.status || '').toLowerCase(),
      closer: r => (r.closer || '').toLowerCase(),
      data_call_fechamento: r => r.data_call_fechamento || '',
      fechou: r => (r.fechou || '').toLowerCase(),
      data_finalizacao: r => r.data_finalizacao || '',
    };
    const getter = fieldMap[sortColumn];
    if (!getter) return 0;
    const valA = getter(a);
    const valB = getter(b);
    if (valA < valB) return -1 * dir;
    if (valA > valB) return 1 * dir;
    return 0;
  });

  const columns: Record<StatusKey, AnaliseRecord[]> = {
    'Agendado': [],
    'Concluído (Closer)': [],
    'Finalizado (Sem interesse)': [],
    'NoShow': [],
  };
  records.forEach(r => {
    const key = getRecordStatus(r);
    columns[key].push(r);
  });

  // ── Form submit ──────────────────────────────────────────────
  const isConcluido = formStatus.includes('Conclu');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCliente.trim()) { setToast({ type: 'error', msg: 'Nome do cliente e obrigatorio' }); return; }
    if (!dataAgendamento) { setToast({ type: 'error', msg: 'Data do agendamento e obrigatoria' }); return; }

    setSaving(true);
    setToast(null);
    try {
      const resp = await fetch('/api/comercial/analise-contas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_cliente: nomeCliente.trim(),
          data_agendamento: dataAgendamento || null,
          data_analise: dataAnalise || null,
          consultor: consultor || null,
          status: formStatus || 'Agendado',
          closer: isConcluido ? (formCloser || null) : null,
          data_call_fechamento: isConcluido ? (dataCallFechamento || null) : null,
          fechou: isConcluido && formCloser ? (fechou || null) : null,
          mes_referencia: mesReferencia || null,
          observacoes: observacoes || null,
        }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
        throw new Error(data.error || `Erro ${resp.status}`);
      }
      setToast({ type: 'success', msg: 'Analise salva com sucesso!' });
      setNomeCliente(''); setDataAgendamento(''); setDataAnalise(''); setConsultor('');
      setFormStatus('Agendado'); setFormCloser(''); setDataCallFechamento(''); setFechou('');
      setObservacoes('');
      setFormOpen(false);
      fetchData();
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setToast({ type: 'error', msg: message });
    } finally {
      setSaving(false);
    }
  };

  // ── PATCH status (drag & drop) ───────────────────────────────
  const patchStatus = async (id: string, newStatus: string, extra?: { closer?: string; data_call_fechamento?: string }) => {
    try {
      const body: Record<string, string | null> = { id, status: newStatus };
      if (extra?.closer) body.closer = extra.closer;
      if (extra?.data_call_fechamento) body.data_call_fechamento = extra.data_call_fechamento;
      // Auto-set data_finalizacao based on status
      if (newStatus === 'Agendado') {
        body.data_finalizacao = null;
      } else {
        const record = allRecords.find(r => r.id === id);
        if (!record?.data_finalizacao) {
          body.data_finalizacao = getTodayISO();
        }
      }
      const resp = await fetch('/api/comercial/analise-contas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (resp.ok) fetchData();
    } catch (err) {
      console.error('[AnaliseContas] patch error:', err);
    }
  };

  // ── Drag handlers ────────────────────────────────────────────
  const handleDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, col: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(col);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetStatus: StatusKey) => {
    e.preventDefault();
    setDragOverCol(null);
    const id = e.dataTransfer.getData('text/plain') || dragId;
    if (!id) return;
    setDragId(null);

    const record = allRecords.find(r => r.id === id);
    if (!record) return;
    const currentStatus = getRecordStatus(record);
    if (currentStatus === targetStatus) return;

    // If moving to "Concluido (Closer)", open modal for closer + data_call
    if (targetStatus === 'Concluído (Closer)') {
      setCloserModal({ id, nome: record.nome_cliente });
      setModalCloser('');
      setModalDataCall('');
      return;
    }

    patchStatus(id, targetStatus);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setDragOverCol(null);
  };

  // ── Closer modal submit ──────────────────────────────────────
  const handleCloserModalSubmit = async () => {
    if (!closerModal) return;
    if (!modalCloser) return;
    setModalSaving(true);
    await patchStatus(closerModal.id, 'Concluído (Closer)', {
      closer: modalCloser,
      data_call_fechamento: modalDataCall || undefined,
    });
    setModalSaving(false);
    setCloserModal(null);
  };

  // ── Edit modal submit ────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editRecord) return;
    setEditSaving(true);
    // Auto-set data_finalizacao based on status
    let dataFinalizacao = editRecord.data_finalizacao;
    if (editRecord.status === 'Agendado') {
      dataFinalizacao = null;
    } else if (!dataFinalizacao) {
      dataFinalizacao = getTodayISO();
    }
    try {
      const resp = await fetch('/api/comercial/analise-contas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editRecord.id,
          nome_cliente: editRecord.nome_cliente,
          data_agendamento: editRecord.data_agendamento,
          data_analise: editRecord.data_analise,
          consultor: editRecord.consultor,
          status: editRecord.status,
          closer: editRecord.closer,
          data_call_fechamento: editRecord.data_call_fechamento,
          fechou: editRecord.fechou,
          observacoes: editRecord.observacoes,
          data_finalizacao: dataFinalizacao,
        }),
      });
      if (resp.ok) {
        setEditRecord(null);
        fetchData();
      }
    } catch (err) {
      console.error('[AnaliseContas] save error:', err);
    } finally {
      setEditSaving(false);
    }
  };

  // ── Styles ───────────────────────────────────────────────────
  const inputCls = 'w-full rounded-xl border border-[#222222] bg-[#111111] px-4 py-3 text-[13px] font-semibold text-white placeholder-zinc-700 outline-none focus:border-lime-400/30 transition-colors';
  const selectCls = `${inputCls} [color-scheme:dark] cursor-pointer`;
  const labelCls = 'text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-1.5';
  const th = 'py-3 px-4 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-600';
  const td = 'py-3 px-4 text-[13px]';

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[#222222] bg-black/90 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-zape.png" alt="Zape" className="h-8 w-auto" />
            <span className="text-sm font-thin text-zinc-600 tracking-tight">control</span>
            <span className="text-[10px] font-bold text-zinc-700 ml-1 uppercase tracking-[0.1em]">Analise de Contas</span>
          </div>
          <Link
            href="/comercial/analise-contas"
            className="flex items-center gap-2 text-[12px] font-bold text-zinc-500 hover:text-lime-400 transition-colors"
          >
            <ArrowLeft size={14} /> Voltar ao acompanhamento
          </Link>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-5 sm:px-8 py-6">
        {/* Toast */}
        {toast && (
          <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-[12px] font-semibold border ${toast.type === 'success' ? 'bg-lime-400/8 border-lime-400/15 text-lime-400' : 'bg-red-400/8 border-red-400/15 text-red-400'}`}>
            {toast.type === 'success' ? <Check size={14} /> : <ClipboardCheck size={14} />}
            {toast.msg}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap mb-4">
          {/* Month filter */}
          <select
            value={filterMes}
            onChange={e => setFilterMes(e.target.value)}
            className="rounded-xl border border-[#222222] bg-[#111111] px-3 py-2 text-[12px] font-bold text-white outline-none focus:border-lime-400/30 transition-colors [color-scheme:dark] cursor-pointer"
          >
            <option value="">Todos os meses</option>
            {uniqueMeses.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          {/* Consultor filter */}
          <select
            value={filterConsultor}
            onChange={e => setFilterConsultor(e.target.value)}
            className="rounded-xl border border-[#222222] bg-[#111111] px-3 py-2 text-[12px] font-bold text-white outline-none focus:border-lime-400/30 transition-colors [color-scheme:dark] cursor-pointer"
          >
            <option value="">Todos consultores</option>
            {uniqueConsultores.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Closer filter */}
          <select
            value={filterCloser}
            onChange={e => setFilterCloser(e.target.value)}
            className="rounded-xl border border-[#222222] bg-[#111111] px-3 py-2 text-[12px] font-bold text-white outline-none focus:border-lime-400/30 transition-colors [color-scheme:dark] cursor-pointer"
          >
            <option value="">Todos closers</option>
            {uniqueClosers.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="rounded-xl border border-[#222222] bg-[#111111] px-3 py-2 text-[12px] font-bold text-white outline-none focus:border-lime-400/30 transition-colors [color-scheme:dark] cursor-pointer"
          >
            <option value="">Todos status</option>
            {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1.5 rounded-xl border border-[#222222] bg-[#111111] px-3 py-2 text-[12px] font-bold text-zinc-500 hover:text-red-400 hover:border-red-400/30 transition-colors cursor-pointer"
            >
              <FilterX size={13} /> Limpar
            </button>
          )}

          <div className="w-px h-6 bg-[#222222] mx-1 hidden sm:block" />

          {/* Toggle */}
          <div className="flex items-center rounded-xl border border-[#222222] bg-[#111111] overflow-hidden">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-bold transition-colors cursor-pointer ${viewMode === 'kanban' ? 'text-lime-400 bg-lime-400/10' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <LayoutGrid size={14} /> Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-bold transition-colors cursor-pointer ${viewMode === 'table' ? 'text-lime-400 bg-lime-400/10' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <List size={14} /> Tabela
            </button>
          </div>

          {/* Refresh */}
          <button onClick={fetchData} className="rounded-xl p-2.5 text-zinc-600 hover:text-lime-400 hover:bg-lime-400/5 transition-all cursor-pointer">
            <RefreshCw size={14} />
          </button>

          <div className="flex-1" />

          {/* New analysis button */}
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="flex items-center gap-2 rounded-xl bg-lime-400/10 border border-lime-400/20 px-5 py-2.5 text-[12px] font-extrabold text-lime-400 hover:bg-lime-400/15 transition-all cursor-pointer tracking-wide"
          >
            {formOpen ? <ChevronUp size={15} /> : <Plus size={15} />}
            Nova Analise
          </button>
        </div>

        {/* Record count */}
        {!loading && (
          <p className="text-[11px] font-semibold text-zinc-600 mb-4">
            Mostrando {records.length} de {allRecords.length} registros
          </p>
        )}

        {/* Collapsible Form */}
        {formOpen && (
          <div className="mb-6 rounded-2xl border border-[#222222] bg-[#0a0a0a]">
            <div className="px-6 py-4 border-b border-[#222222] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardCheck size={18} className="text-lime-400" />
                <h2 className="text-base font-extrabold text-white">Lancar Analise</h2>
              </div>
              <button onClick={() => setFormOpen(false)} className="rounded-lg p-2 text-zinc-600 hover:text-white hover:bg-white/5 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Nome do Cliente *</label>
                  <input type="text" value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} placeholder="Nome completo" className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Data Agendamento *</label>
                  <input type="date" value={dataAgendamento} onChange={e => setDataAgendamento(e.target.value)} className={`${inputCls} [color-scheme:dark]`} required />
                </div>
                <div>
                  <label className={labelCls}>Data Analise</label>
                  <input type="date" value={dataAnalise} onChange={e => setDataAnalise(e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Consultor</label>
                  <select value={consultor} onChange={e => setConsultor(e.target.value)} className={selectCls}>
                    <option value="">Selecione</option>
                    {CONSULTORES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select value={formStatus} onChange={e => { setFormStatus(e.target.value); if (!e.target.value.includes('Conclu')) { setFormCloser(''); setDataCallFechamento(''); setFechou(''); } }} className={selectCls}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {isConcluido && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Closer</label>
                    <select value={formCloser} onChange={e => setFormCloser(e.target.value)} className={selectCls}>
                      <option value="">Selecione</option>
                      {CLOSERS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Data Call Fechamento</label>
                    <input type="date" value={dataCallFechamento} onChange={e => setDataCallFechamento(e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
                  </div>
                  {formCloser && (
                    <div>
                      <label className={labelCls}>Fechou?</label>
                      <select value={fechou} onChange={e => setFechou(e.target.value)} className={selectCls}>
                        <option value="">Selecione</option>
                        <option value="Sim">Sim</option>
                        <option value="Não">Nao</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className={labelCls}>Observacoes</label>
                <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={2} placeholder="Observacoes opcionais..." className={`${inputCls} resize-none`} />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-lime-400/10 border border-lime-400/20 px-6 py-3 text-[13px] font-extrabold text-lime-400 hover:bg-lime-400/15 transition-all cursor-pointer disabled:opacity-40"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <ClipboardCheck size={16} />}
                  Salvar Analise
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 size={28} className="animate-spin text-lime-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Carregando</span>
          </div>
        ) : viewMode === 'kanban' ? (
          /* ── KANBAN VIEW ────────────────────────────────────────── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(COLUMN_CONFIG) as StatusKey[]).map(statusKey => {
              const cfg = COLUMN_CONFIG[statusKey];
              const items = columns[statusKey];
              const isOver = dragOverCol === statusKey;

              return (
                <div
                  key={statusKey}
                  className={`rounded-xl border bg-[#111111] flex flex-col min-h-[300px] transition-all ${isOver ? 'border-lime-400/40 bg-lime-400/5' : 'border-[#222222]'}`}
                  onDragOver={e => handleDragOver(e, statusKey)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, statusKey)}
                >
                  {/* Column header */}
                  <div className={`px-4 py-3 border-b border-[#222222] ${cfg.headerBg} rounded-t-xl`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-extrabold uppercase tracking-[0.08em] ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <span className={`text-[11px] font-extrabold ${cfg.color} rounded-full px-2 py-0.5 ${cfg.headerBg} border ${cfg.headerBorder}`}>
                        {items.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
                    {items.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-[11px] text-zinc-700">Nenhum item</p>
                      </div>
                    ) : (
                      items.map(r => (
                        <div
                          key={r.id}
                          draggable
                          onDragStart={e => handleDragStart(e, r.id)}
                          onDragEnd={handleDragEnd}
                          className={`rounded-lg border bg-[#1A1A1A] p-3 cursor-grab active:cursor-grabbing transition-all hover:border-lime-400/30 ${dragId === r.id ? 'opacity-40 scale-95' : 'border-[#222222]'}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[13px] font-bold text-white leading-tight">{r.nome_cliente}</p>
                            <button
                              onClick={() => setEditRecord({ ...r })}
                              className="shrink-0 rounded p-1 text-zinc-700 hover:text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              <Pencil size={11} />
                            </button>
                          </div>
                          {r.consultor && (
                            <p className="text-[11px] text-zinc-500 mt-1">{r.consultor}</p>
                          )}
                          <p className="text-[10px] text-zinc-600 mt-1">
                            Agend: {formatDateBR(r.data_agendamento)}
                          </p>
                          {statusKey === 'Concluído (Closer)' && (
                            <>
                              {r.closer && <p className="text-[10px] text-green-500/70 mt-1">Closer: {r.closer}</p>}
                              {r.data_call_fechamento && <p className="text-[10px] text-zinc-600 mt-0.5">Call: {formatDateBR(r.data_call_fechamento)}</p>}
                              {r.fechou && (
                                <p className={`text-[10px] font-bold mt-0.5 ${r.fechou.toLowerCase() === 'sim' ? 'text-green-500' : 'text-red-500'}`}>
                                  Fechou: {r.fechou}
                                </p>
                              )}
                            </>
                          )}
                          {r.data_finalizacao && (
                            <p className="text-[10px] text-zinc-500 mt-1">Finalizado em: {formatDateBR(r.data_finalizacao)}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── TABLE VIEW ─────────────────────────────────────────── */
          <div className="rounded-xl border border-[#222222] bg-[#111111] overflow-hidden">
            {records.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-[13px] font-semibold text-zinc-600">Nenhuma analise encontrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #222222' }}>
                      {([
                        { key: 'nome_cliente', label: 'Nome Cliente', align: 'text-left' },
                        { key: 'data_agendamento', label: 'Agendamento', align: 'text-center' },
                        { key: 'data_analise', label: 'Analise', align: 'text-center' },
                        { key: 'consultor', label: 'Consultor', align: 'text-left' },
                        { key: 'status', label: 'Status', align: 'text-center' },
                        { key: 'closer', label: 'Closer', align: 'text-left' },
                        { key: 'data_call_fechamento', label: 'Data Call', align: 'text-center' },
                        { key: 'fechou', label: 'Fechou?', align: 'text-center' },
                        { key: 'data_finalizacao', label: 'Finalizacao', align: 'text-center' },
                      ] as const).map(col => {
                        const isActive = sortColumn === col.key;
                        return (
                          <th
                            key={col.key}
                            onClick={() => handleSort(col.key)}
                            className={`${col.align} ${th} cursor-pointer select-none group transition-colors ${isActive ? 'text-lime-400' : ''}`}
                          >
                            <span className="inline-flex items-center gap-1">
                              {col.label}
                              <span className={`transition-all ${isActive ? 'text-lime-400' : 'text-zinc-700 opacity-0 group-hover:opacity-100'}`}>
                                {isActive && sortDirection === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                              </span>
                            </span>
                          </th>
                        );
                      })}
                      <th className={`text-center ${th}`}>Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRecords.map(r => (
                      <tr
                        key={r.id}
                        style={{ borderBottom: '1px solid #222222' }}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className={`${td} font-bold text-white`}>{r.nome_cliente}</td>
                        <td className={`${td} text-center text-zinc-400`}>{formatDateBR(r.data_agendamento)}</td>
                        <td className={`${td} text-center text-zinc-400`}>{formatDateBR(r.data_analise)}</td>
                        <td className={`${td} font-semibold text-zinc-300`}>{r.consultor || '--'}</td>
                        <td className={`${td} text-center`}>
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusBadge(r.status)}`}>
                            {r.status || 'Agendado'}
                          </span>
                        </td>
                        <td className={`${td} font-semibold text-zinc-300`}>{r.closer || '--'}</td>
                        <td className={`${td} text-center text-zinc-400`}>{formatDateBR(r.data_call_fechamento)}</td>
                        <td className={`${td} text-center font-bold ${(r.fechou || '').toLowerCase() === 'sim' ? 'text-green-500' : (r.fechou || '').toLowerCase() === 'não' || (r.fechou || '').toLowerCase() === 'nao' ? 'text-red-500' : 'text-zinc-500'}`}>
                          {r.fechou || '--'}
                        </td>
                        <td className={`${td} text-center text-zinc-400`}>{formatDateBR(r.data_finalizacao)}</td>
                        <td className={td}>
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => setEditRecord({ ...r })}
                              className="rounded-lg p-1.5 text-zinc-600 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              <Pencil size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Closer Modal (on drag to Concluido) ───────────────── */}
      {closerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setCloserModal(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-2xl border border-[#222222] bg-[#111111]" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[#222222] flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Mover para Concluido</h2>
              <button onClick={() => setCloserModal(null)} className="rounded-lg p-2 text-zinc-600 hover:text-white hover:bg-white/5 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-[13px] text-zinc-400">
                Cliente: <span className="text-white font-bold">{closerModal.nome}</span>
              </p>
              <div>
                <label className={labelCls}>Closer *</label>
                <select value={modalCloser} onChange={e => setModalCloser(e.target.value)} className={selectCls}>
                  <option value="">Selecione o closer</option>
                  {CLOSERS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Data Call Fechamento</label>
                <input
                  type="date"
                  value={modalDataCall}
                  onChange={e => setModalDataCall(e.target.value)}
                  className={`${inputCls} [color-scheme:dark]`}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#222222]">
              <button onClick={() => setCloserModal(null)} className="px-4 py-2 rounded-xl text-[12px] font-bold text-zinc-500 hover:text-white cursor-pointer">
                Cancelar
              </button>
              <button
                onClick={handleCloserModalSubmit}
                disabled={!modalCloser || modalSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-[12px] font-extrabold text-green-500 hover:bg-green-500/15 cursor-pointer disabled:opacity-40 transition-all"
              >
                {modalSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ────────────────────────────────────────── */}
      {editRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditRecord(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-[#222222] bg-[#111111]"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#222222] flex items-center justify-between sticky top-0 z-10 bg-[#111111]">
              <h2 className="text-lg font-bold text-white">Editar Analise</h2>
              <button onClick={() => setEditRecord(null)} className="rounded-lg p-2 text-zinc-600 hover:text-white hover:bg-white/5 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={labelCls}>Nome Cliente</label>
                <input
                  type="text"
                  value={editRecord.nome_cliente}
                  onChange={e => setEditRecord({ ...editRecord, nome_cliente: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Data Agendamento</label>
                  <input
                    type="date"
                    value={editRecord.data_agendamento?.split('T')[0] || ''}
                    onChange={e => setEditRecord({ ...editRecord, data_agendamento: e.target.value || null })}
                    className={`${inputCls} [color-scheme:dark]`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Data Analise</label>
                  <input
                    type="date"
                    value={editRecord.data_analise?.split('T')[0] || ''}
                    onChange={e => setEditRecord({ ...editRecord, data_analise: e.target.value || null })}
                    className={`${inputCls} [color-scheme:dark]`}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Consultor</label>
                <select
                  value={editRecord.consultor || ''}
                  onChange={e => setEditRecord({ ...editRecord, consultor: e.target.value || null })}
                  className={selectCls}
                >
                  <option value="">Selecione</option>
                  {CONSULTORES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select
                  value={editRecord.status || ''}
                  onChange={e => setEditRecord({ ...editRecord, status: e.target.value || null })}
                  className={selectCls}
                >
                  <option value="">Selecione</option>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {(editRecord.status || '').includes('Conclu') && (
                <>
                  <div>
                    <label className={labelCls}>Closer</label>
                    <select
                      value={editRecord.closer || ''}
                      onChange={e => setEditRecord({ ...editRecord, closer: e.target.value || null })}
                      className={selectCls}
                    >
                      <option value="">Selecione</option>
                      {CLOSERS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Data Call Fechamento</label>
                    <input
                      type="date"
                      value={editRecord.data_call_fechamento?.split('T')[0] || ''}
                      onChange={e => setEditRecord({ ...editRecord, data_call_fechamento: e.target.value || null })}
                      className={`${inputCls} [color-scheme:dark]`}
                    />
                  </div>
                  {editRecord.closer && (
                    <div>
                      <label className={labelCls}>Fechou?</label>
                      <select
                        value={editRecord.fechou || ''}
                        onChange={e => setEditRecord({ ...editRecord, fechou: e.target.value || null })}
                        className={selectCls}
                      >
                        <option value="">Selecione</option>
                        <option value="Sim">Sim</option>
                        <option value="Não">Nao</option>
                      </select>
                    </div>
                  )}
                </>
              )}
              <div>
                <label className={labelCls}>Observacoes</label>
                <textarea
                  value={editRecord.observacoes || ''}
                  onChange={e => setEditRecord({ ...editRecord, observacoes: e.target.value || null })}
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div>
                <label className={labelCls}>Data Finalizacao</label>
                <input
                  type="date"
                  value={editRecord.data_finalizacao?.split('T')[0] || ''}
                  onChange={e => setEditRecord({ ...editRecord, data_finalizacao: e.target.value || null })}
                  className={`${inputCls} [color-scheme:dark]`}
                />
                <p className="text-[10px] text-zinc-600 mt-1">Preenchida automaticamente ao mudar status</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#222222]">
              <button onClick={() => setEditRecord(null)} className="px-4 py-2 rounded-xl text-[12px] font-bold text-zinc-500 hover:text-white cursor-pointer">
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lime-400/10 border border-lime-400/20 text-[12px] font-extrabold text-lime-400 hover:bg-lime-400/15 cursor-pointer disabled:opacity-40 transition-all"
              >
                {editSaving ? <Loader2 size={14} className="animate-spin" /> : <ClipboardCheck size={14} />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
