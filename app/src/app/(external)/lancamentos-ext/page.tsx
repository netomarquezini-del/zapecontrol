"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Plus, RefreshCw, Loader2, Zap, Pencil, Trash2, Download, Filter } from "lucide-react";
import DatePicker from "@/components/date-picker";
import MovementForm from "@/components/lancamentos/movement-form";

interface SdrMetric { sdr_id: number; quantidade: number }
interface Ganho { valor: number; sdr_id: number; sdr_name: string; origem_id: number; origem_name: string; sub_origem: string; servico_id: number; servico_name: string }
interface Movement {
  id: number; data: string; data_raw: string; closer_id: number; closer_name?: string;
  agendamentos: SdrMetric[]; reunioes: SdrMetric[]; reagendamentos: SdrMetric[]; noshows: SdrMetric[]; ganhos: Ganho[];
}
interface Closer { id: number; name: string }
interface Sdr { id: number; name: string }

const fmtBRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const sumQtd = (items: SdrMetric[] | null) => (items ?? []).reduce((s, i) => s + (i.quantidade || 0), 0);
const sumVal = (ganhos: Ganho[] | null) => (ganhos ?? []).reduce((s, g) => s + (g.valor || 0), 0);

function exportCSV(headers: string[], rows: string[][], filename: string) {
  const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function getMonthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return {
    start: `${y}-${String(m + 1).padStart(2, '0')}-01`,
    end: `${y}-${String(m + 1).padStart(2, '0')}-${String(new Date(y, m + 1, 0).getDate()).padStart(2, '0')}`,
  };
}

export default function LancamentosExtPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [startDate, setStartDate] = useState(getMonthRange().start);
  const [endDate, setEndDate] = useState(getMonthRange().end);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [closers, setClosers] = useState<Closer[]>([]);
  const [sdrs, setSdrs] = useState<Sdr[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [filterCloser, setFilterCloser] = useState<number | "all">("all");
  const [filterSdr, setFilterSdr] = useState<number | "all">("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabase();
    const [movRes, closersRes, sdrsRes] = await Promise.all([
      supabase.from("movements").select("*").gte("data_raw", startDate).lte("data_raw", endDate).order("data_raw", { ascending: false }),
      supabase.from("closers").select("id, name").order("name"),
      supabase.from("sdrs").select("id, name").order("name"),
    ]);
    const cls = (closersRes.data ?? []) as Closer[];
    const sds = (sdrsRes.data ?? []) as Sdr[];
    setClosers(cls); setSdrs(sds);
    const closerMap = new Map(cls.map((c) => [c.id, c.name]));
    setMovements(((movRes.data ?? []) as Movement[]).map((mv) => ({
      ...mv, closer_name: closerMap.get(mv.closer_id) ?? `Closer #${mv.closer_id}`,
      agendamentos: mv.agendamentos ?? [], reunioes: mv.reunioes ?? [],
      reagendamentos: mv.reagendamentos ?? [], noshows: mv.noshows ?? [], ganhos: mv.ganhos ?? [],
    })));
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: number) => {
    const supabase = getSupabase();
    if (confirmId !== id) { setConfirmId(id); setTimeout(() => setConfirmId(null), 3000); return; }
    setDeletingId(id);
    await supabase.from("movements").delete().eq("id", id);
    setDeletingId(null); setConfirmId(null);
    fetchData();
  };

  // Apply filters
  let filtered = movements;
  if (filterCloser !== "all") filtered = filtered.filter((m) => m.closer_id === filterCloser);
  if (filterSdr !== "all") {
    filtered = filtered.filter((m) => {
      const sdrId = filterSdr as number;
      const hasInAgend = (m.agendamentos ?? []).some((a) => a.sdr_id === sdrId && a.quantidade > 0);
      const hasInReun = (m.reunioes ?? []).some((r) => r.sdr_id === sdrId && r.quantidade > 0);
      const hasInReag = (m.reagendamentos ?? []).some((r) => r.sdr_id === sdrId && r.quantidade > 0);
      const hasInNs = (m.noshows ?? []).some((n) => n.sdr_id === sdrId && n.quantidade > 0);
      const hasInGanhos = (m.ganhos ?? []).some((g) => g.sdr_id === sdrId);
      return hasInAgend || hasInReun || hasInReag || hasInNs || hasInGanhos;
    });
  }

  // When SDR is filtered, extract only that SDR's data from each movement
  const sdrId = filterSdr !== "all" ? (filterSdr as number) : null;

  const sumQtdFiltered = (items: SdrMetric[] | null) => {
    if (!items) return 0;
    if (sdrId !== null) return items.filter((i) => i.sdr_id === sdrId).reduce((s, i) => s + (i.quantidade || 0), 0);
    return items.reduce((s, i) => s + (i.quantidade || 0), 0);
  };
  const sumValFiltered = (ganhos: Ganho[] | null) => {
    if (!ganhos) return 0;
    if (sdrId !== null) return ganhos.filter((g) => g.sdr_id === sdrId).reduce((s, g) => s + (g.valor || 0), 0);
    return ganhos.reduce((s, g) => s + (g.valor || 0), 0);
  };
  const countVendasFiltered = (ganhos: Ganho[] | null) => {
    if (!ganhos) return 0;
    if (sdrId !== null) return ganhos.filter((g) => g.sdr_id === sdrId).length;
    return ganhos.length;
  };

  // Computed KPIs — using SDR-filtered values
  const t = {
    vendas: filtered.reduce((s, m) => s + sumValFiltered(m.ganhos), 0),
    numVendas: filtered.reduce((s, m) => s + countVendasFiltered(m.ganhos), 0),
    agend: filtered.reduce((s, m) => s + sumQtdFiltered(m.agendamentos), 0),
    reun: filtered.reduce((s, m) => s + sumQtdFiltered(m.reunioes), 0),
    reag: filtered.reduce((s, m) => s + sumQtdFiltered(m.reagendamentos), 0),
    noshow: filtered.reduce((s, m) => s + sumQtdFiltered(m.noshows), 0),
  };
  const taxaConversao = t.reun > 0 ? (t.numVendas / t.reun) * 100 : 0;
  const ticketMedio = t.numVendas > 0 ? t.vendas / t.numVendas : 0;
  const taxaReag = t.agend > 0 ? (t.reag / t.agend) * 100 : 0;
  const taxaNoshow = t.agend > 0 ? (t.noshow / t.agend) * 100 : 0;

  // SDR table
  const sdrMap = new Map(sdrs.map((s) => [s.id, s.name]));
  const sdrStats: Record<number, { agend: number; reun: number; reag: number; noshow: number; vendas: number; numVendas: number }> = {};
  filtered.forEach((m) => {
    const init = () => ({ agend: 0, reun: 0, reag: 0, noshow: 0, vendas: 0, numVendas: 0 });
    (m.agendamentos ?? []).forEach((a) => { if (!sdrStats[a.sdr_id]) sdrStats[a.sdr_id] = init(); sdrStats[a.sdr_id].agend += a.quantidade; });
    (m.reunioes ?? []).forEach((r) => { if (!sdrStats[r.sdr_id]) sdrStats[r.sdr_id] = init(); sdrStats[r.sdr_id].reun += r.quantidade; });
    (m.reagendamentos ?? []).forEach((r) => { if (!sdrStats[r.sdr_id]) sdrStats[r.sdr_id] = init(); sdrStats[r.sdr_id].reag += r.quantidade; });
    (m.noshows ?? []).forEach((n) => { if (!sdrStats[n.sdr_id]) sdrStats[n.sdr_id] = init(); sdrStats[n.sdr_id].noshow += n.quantidade; });
    (m.ganhos ?? []).forEach((g) => { if (!sdrStats[g.sdr_id]) sdrStats[g.sdr_id] = init(); sdrStats[g.sdr_id].vendas += g.valor; sdrStats[g.sdr_id].numVendas += 1; });
  });
  const sdrRows = Object.entries(sdrStats).map(([id, s]) => ({ id: Number(id), name: sdrMap.get(Number(id)) || `SDR #${id}`, ...s })).sort((a, b) => b.vendas - a.vendas);
  const sdrTotals = sdrRows.reduce((a, r) => ({ agend: a.agend + r.agend, reun: a.reun + r.reun, reag: a.reag + r.reag, noshow: a.noshow + r.noshow, vendas: a.vendas + r.vendas, numVendas: a.numVendas + r.numVendas }), { agend: 0, reun: 0, reag: 0, noshow: 0, vendas: 0, numVendas: 0 });

  // Export
  const exportCloserTable = () => {
    exportCSV(
      ["Data", "Closer", "Agend", "Reunioes", "Reag", "No-Show", "Vendas", "Valor"],
      filtered.map((m) => [m.data, m.closer_name || "", String(sumQtd(m.agendamentos)), String(sumQtd(m.reunioes)), String(sumQtd(m.reagendamentos)), String(sumQtd(m.noshows)), String(m.ganhos?.length || 0), String(sumVal(m.ganhos))]),
      `lancamentos-closer-${startDate.substring(0, 7)}.csv`
    );
  };
  const exportSdrTable = () => {
    exportCSV(
      ["SDR", "Agend", "Reunioes", "Reag", "No-Show", "Vendas", "Valor"],
      sdrRows.map((r) => [r.name, String(r.agend), String(r.reun), String(r.reag), String(r.noshow), String(r.numVendas), String(r.vendas)]),
      `lancamentos-sdr-${startDate.substring(0, 7)}.csv`
    );
  };

  const th = "py-3.5 px-4 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-600";
  const td = "py-3 px-4 text-[13px]";
  const selectCls = "rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2 text-[12px] font-bold text-white outline-none focus:border-lime-400/30 transition-colors [color-scheme:dark] cursor-pointer";

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[#1a1a1a] bg-black/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-400/8 border border-lime-400/15">
              <Zap size={16} className="text-lime-400" />
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-extrabold text-white tracking-tight">ZAPE</span>
              <span className="text-sm font-thin text-zinc-600 tracking-tight">control</span>
            </div>
            <span className="text-[10px] font-bold text-zinc-700 ml-1 uppercase tracking-[0.1em]">Lancamentos</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <DatePicker startDate={startDate} endDate={endDate} onChange={(s, e) => { setStartDate(s); setEndDate(e); }} />

            <div className="flex items-center gap-1.5">
              <Filter size={12} className="text-zinc-700" />
              <select value={filterCloser} onChange={(e) => setFilterCloser(e.target.value === "all" ? "all" : Number(e.target.value))} className={selectCls}>
                <option value="all">Todos Closers</option>
                {closers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <Filter size={12} className="text-zinc-700" />
              <select value={filterSdr} onChange={(e) => setFilterSdr(e.target.value === "all" ? "all" : Number(e.target.value))} className={selectCls}>
                <option value="all">Todos SDRs</option>
                {sdrs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <button onClick={fetchData} className="rounded-xl p-2.5 text-zinc-600 hover:text-lime-400 hover:bg-lime-400/5 transition-all cursor-pointer">
              <RefreshCw size={14} />
            </button>
            <button onClick={() => { setEditingMovement(null); setShowForm(true); }} className="flex items-center gap-2 rounded-xl bg-lime-400/10 border border-lime-400/20 px-5 py-2.5 text-[12px] font-extrabold text-lime-400 hover:bg-lime-400/15 transition-all cursor-pointer tracking-wide">
              <Plus size={15} /> Novo Lancamento
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-8 space-y-8">
        {/* ROW 1: Vendas > Total > Conversao > Ticket */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-3">Vendas</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card p-4 text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-1">Vendas</p>
              <p className="text-xl font-extrabold text-lime-400">{t.numVendas}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-1">Total R$</p>
              <p className="text-xl font-extrabold text-lime-400">{fmtBRL(t.vendas)}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-1">Taxa Conversao</p>
              <p className="text-xl font-extrabold text-white">{taxaConversao.toFixed(1)}%</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-1">Ticket Medio</p>
              <p className="text-xl font-extrabold text-white">{fmtBRL(ticketMedio)}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 size={28} className="animate-spin text-lime-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Carregando</span>
          </div>
        ) : (
          <>
            {/* CLOSER TABLE */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Lancamentos por Closer</p>
                <button onClick={exportCloserTable} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-zinc-600 hover:text-lime-400 hover:bg-lime-400/5 border border-transparent hover:border-lime-400/15 transition-all cursor-pointer">
                  <Download size={12} /> Exportar CSV
                </button>
              </div>
              {filtered.length === 0 ? (
                <div className="card p-12 text-center"><p className="text-[13px] font-semibold text-zinc-600">Nenhum lancamento encontrado</p></div>
              ) : (
                <div className="card overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                        <th className={`text-left ${th}`}>Data</th>
                        <th className={`text-left ${th}`}>Closer</th>
                        <th className={`text-center ${th}`}>Agend.</th>
                        <th className={`text-center ${th}`}>Reunioes</th>
                        <th className={`text-center ${th}`}>Reag.</th>
                        <th className={`text-center ${th}`}>No-Show</th>
                        <th className={`text-center ${th}`}>Vendas</th>
                        <th className={`text-right ${th}`}>Valor</th>
                        <th className={`text-center ${th}`}>Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((m) => (
                        <tr key={m.id} style={{ borderBottom: "1px solid #1a1a1a" }} className="hover:bg-white/[0.02] transition-colors">
                          <td className={`${td} font-semibold text-zinc-500`}>{m.data}</td>
                          <td className={`${td} font-extrabold text-white`}>{m.closer_name}</td>
                          <td className={`${td} text-center font-semibold text-zinc-300`}>{sumQtdFiltered(m.agendamentos)}</td>
                          <td className={`${td} text-center font-semibold text-zinc-300`}>{sumQtdFiltered(m.reunioes)}</td>
                          <td className={`${td} text-center font-semibold text-zinc-300`}>{sumQtdFiltered(m.reagendamentos)}</td>
                          <td className={`${td} text-center font-semibold text-zinc-300`}>{sumQtdFiltered(m.noshows)}</td>
                          <td className={`${td} text-center font-bold text-zinc-300`}>{countVendasFiltered(m.ganhos)}</td>
                          <td className={`${td} text-right font-extrabold text-lime-400`}>{fmtBRL(sumValFiltered(m.ganhos))}</td>
                          <td className={td}>
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => { setEditingMovement(m); setShowForm(true); }} className="rounded-lg p-1.5 text-zinc-600 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"><Pencil size={13} /></button>
                              <button onClick={() => handleDelete(m.id)} disabled={deletingId === m.id} className={`rounded-lg p-1.5 transition-colors cursor-pointer ${confirmId === m.id ? "text-red-400 bg-red-400/10" : "text-zinc-600 hover:text-red-400 hover:bg-red-400/5"}`}>
                                {deletingId === m.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#080808]" style={{ borderTop: "2px solid #1a1a1a" }}>
                        <td className={`${td} font-extrabold text-white text-[10px] uppercase tracking-[0.1em]`} colSpan={2}>Total</td>
                        <td className={`${td} text-center font-extrabold text-white`}>{t.agend}</td>
                        <td className={`${td} text-center font-extrabold text-white`}>{t.reun}</td>
                        <td className={`${td} text-center font-extrabold text-white`}>{t.reag}</td>
                        <td className={`${td} text-center font-extrabold text-white`}>{t.noshow}</td>
                        <td className={`${td} text-center font-extrabold text-white`}>{t.numVendas}</td>
                        <td className={`${td} text-right font-extrabold text-lime-400 text-[15px]`}>{fmtBRL(t.vendas)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* REUNIOES CARDS — above SDR table */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-3">Reunioes</p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                <div className="card p-4 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-1">Agendamentos</p>
                  <p className="text-xl font-extrabold text-white">{t.agend}</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-1">Reunioes</p>
                  <p className="text-xl font-extrabold text-white">{t.reun}</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-1">Reagendamentos</p>
                  <p className="text-xl font-extrabold text-white">{t.reag}</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-1">Taxa Reag.</p>
                  <p className="text-xl font-extrabold text-white">{taxaReag.toFixed(1)}%</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-1">No-Show</p>
                  <p className="text-xl font-extrabold text-white">{t.noshow}</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-1">Taxa No-Show</p>
                  <p className="text-xl font-extrabold text-white">{taxaNoshow.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* SDR TABLE */}
            {sdrRows.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Acompanhamento por SDR</p>
                  <button onClick={exportSdrTable} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-zinc-600 hover:text-lime-400 hover:bg-lime-400/5 border border-transparent hover:border-lime-400/15 transition-all cursor-pointer">
                    <Download size={12} /> Exportar CSV
                  </button>
                </div>
                <div className="card overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                        <th className={`text-left ${th}`}>SDR</th>
                        <th className={`text-center ${th}`}>Agend.</th>
                        <th className={`text-center ${th}`}>Reunioes</th>
                        <th className={`text-center ${th}`}>Reag.</th>
                        <th className={`text-center ${th}`}>No-Show</th>
                        <th className={`text-center ${th}`}>Vendas</th>
                        <th className={`text-right ${th}`}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sdrRows.map((r) => (
                        <tr key={r.id} style={{ borderBottom: "1px solid #1a1a1a" }} className="hover:bg-white/[0.02] transition-colors">
                          <td className={`${td} font-extrabold text-white`}>{r.name}</td>
                          <td className={`${td} text-center font-semibold text-zinc-300`}>{r.agend}</td>
                          <td className={`${td} text-center font-semibold text-zinc-300`}>{r.reun}</td>
                          <td className={`${td} text-center font-semibold text-zinc-300`}>{r.reag}</td>
                          <td className={`${td} text-center font-semibold text-zinc-300`}>{r.noshow}</td>
                          <td className={`${td} text-center font-bold text-zinc-300`}>{r.numVendas}</td>
                          <td className={`${td} text-right font-extrabold text-lime-400`}>{fmtBRL(r.vendas)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#080808]" style={{ borderTop: "2px solid #1a1a1a" }}>
                        <td className={`${td} font-extrabold text-white text-[10px] uppercase tracking-[0.1em]`}>Total</td>
                        <td className={`${td} text-center font-extrabold text-white`}>{sdrTotals.agend}</td>
                        <td className={`${td} text-center font-extrabold text-white`}>{sdrTotals.reun}</td>
                        <td className={`${td} text-center font-extrabold text-white`}>{sdrTotals.reag}</td>
                        <td className={`${td} text-center font-extrabold text-white`}>{sdrTotals.noshow}</td>
                        <td className={`${td} text-center font-extrabold text-white`}>{sdrTotals.numVendas}</td>
                        <td className={`${td} text-right font-extrabold text-lime-400 text-[15px]`}>{fmtBRL(sdrTotals.vendas)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {showForm && (
        <MovementForm
          selectedDate={today}
          editingMovement={editingMovement}
          onClose={() => { setShowForm(false); setEditingMovement(null); }}
          onSaved={() => { fetchData(); setShowForm(false); setEditingMovement(null); }}
        />
      )}
    </div>
  );
}
