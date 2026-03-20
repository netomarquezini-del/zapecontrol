"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import { Target, Plus, Pencil, Loader2, X, Save, Calculator, Check, AlertCircle } from "lucide-react";
import { MonthPicker } from "@/components/date-picker";

const NIVEIS = ["minima", "super", "ultra", "black"] as const;
type Nivel = (typeof NIVEIS)[number];
const NIVEL_LABEL: Record<Nivel, string> = { minima: "Minima", super: "Super", ultra: "Ultra", black: "Black" };

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function getBusinessDays(month: string): number {
  const [year, mon] = month.split("-").map(Number);
  const days = new Date(year, mon, 0).getDate();
  let count = 0;
  for (let d = 1; d <= days; d++) { const dow = new Date(year, mon - 1, d).getDay(); if (dow >= 1 && dow <= 5) count++; }
  return count;
}

function getCurrentMonth(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}

interface MetaMensal { id: number; mes: string; nivel: string; meta_mensal_vendas: number; meta_diaria_vendas: number }
interface Closer { id: number; name: string }
interface Sdr { id: number; name: string }
interface CloserMeta { id: number; mes_id: number; closer_id: number; meta_mensal: number; meta_diaria: number }
interface SdrMeta { id: number; mes_id: number; sdr_id: number; meta_mensal: number; meta_diaria: number; meta_reunioes_mensal: number; meta_reunioes_diaria: number }

// ============================================================
// MODAL
// ============================================================
function MetaModal({
  selectedMonth, onClose, onSaved, closers, sdrs,
  initialGerais, initialClosers, initialSdrs, initialSdrsReun,
  existingMesIds, existingCloserIds, existingSdrIds,
}: {
  selectedMonth: string; onClose: () => void; onSaved: () => void;
  closers: Closer[]; sdrs: Sdr[];
  initialGerais: Record<Nivel, number>;
  initialClosers: Record<number, Record<Nivel, number>>;
  initialSdrs: Record<number, Record<Nivel, number>>;
  initialSdrsReun: Record<number, Record<Nivel, number>>;
  existingMesIds: Record<string, number>;
  existingCloserIds: Record<number, Record<string, number>>;
  existingSdrIds: Record<number, Record<string, number>>;
}) {
  const [modalMonth, setModalMonth] = useState(selectedMonth);
  const bd = getBusinessDays(modalMonth);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [gerais, setGerais] = useState(initialGerais);
  const [mc, setMc] = useState(initialClosers);
  const [ms, setMs] = useState(initialSdrs);
  const [msReun, setMsReun] = useState(initialSdrsReun);

  const handleSave = async () => {
    const supabase = getSupabase();
    setSaving(true);
    try {
      // 1. Upsert metas_mensais — no id field, rely on onConflict
      const payload = NIVEIS.map((n) => ({
        mes: modalMonth, nivel: n,
        meta_mensal_vendas: gerais[n],
        meta_diaria_vendas: bd > 0 ? Math.round((gerais[n] / bd) * 100) / 100 : 0,
      }));
      const { data: upserted, error: e1 } = await supabase.from("metas_mensais").upsert(payload, { onConflict: "mes,nivel" }).select("id, nivel");
      if (e1) { setFeedback({ type: "error", msg: "Erro metas gerais: " + e1.message }); setSaving(false); return; }

      const mesIdsByNivel: Record<string, number> = {};
      (upserted ?? []).forEach((r: { id: number; nivel: string }) => { mesIdsByNivel[r.nivel] = r.id; });

      // 2. Upsert metas_closers (4 rows per closer) — no id field, rely on onConflict
      const cp = closers.flatMap((c) =>
        NIVEIS.filter((n) => mesIdsByNivel[n]).map((n) => ({
          mes_id: mesIdsByNivel[n], closer_id: c.id,
          meta_mensal: mc[c.id]?.[n] ?? 0,
          meta_diaria: bd > 0 ? Math.round(((mc[c.id]?.[n] ?? 0) / bd) * 100) / 100 : 0,
        }))
      );
      const { error: e2 } = await supabase.from("metas_closers").upsert(cp, { onConflict: "mes_id,closer_id" });
      if (e2) { setFeedback({ type: "error", msg: "Erro closers: " + e2.message }); setSaving(false); return; }

      // 3. Upsert metas_sdrs (4 rows per SDR) — no id field, rely on onConflict
      const sp = sdrs.flatMap((s) =>
        NIVEIS.filter((n) => mesIdsByNivel[n]).map((n) => ({
          mes_id: mesIdsByNivel[n], sdr_id: s.id,
          meta_mensal: Math.round(ms[s.id]?.[n] ?? 0),
          meta_diaria: bd > 0 ? Math.round((ms[s.id]?.[n] ?? 0) / bd) : 0,
          meta_reunioes_mensal: Math.round(msReun[s.id]?.[n] ?? 0),
          meta_reunioes_diaria: bd > 0 ? Math.round((msReun[s.id]?.[n] ?? 0) / bd) : 0,
        }))
      );
      const { error: e3 } = await supabase.from("metas_sdrs").upsert(sp, { onConflict: "mes_id,sdr_id" });
      if (e3) { setFeedback({ type: "error", msg: "Erro SDRs: " + e3.message }); setSaving(false); return; }

      onSaved(); onClose();
    } catch { setFeedback({ type: "error", msg: "Erro inesperado." }); }
    setSaving(false);
  };

  const inputCls = "w-full rounded-lg border border-[#222222] bg-[#0a0a0a] pl-9 pr-3 py-2 text-sm font-bold text-white outline-none focus:border-lime-400/30 transition-colors";
  const numCls = "w-full rounded-lg border border-[#222222] bg-[#0a0a0a] px-3 py-2 text-sm font-bold text-white outline-none focus:border-lime-400/30 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full max-w-5xl rounded-2xl border border-[#222222] bg-[#0a0a0a] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#222222]">
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">Lancar / Editar Metas</h2>
            <div className="flex items-center gap-3 mt-2">
              <MonthPicker value={modalMonth} onChange={setModalMonth} />
              <div className="flex items-center gap-1.5">
                <Calculator size={13} className="text-lime-400" />
                <span className="text-[11px] font-semibold text-zinc-500">
                  <span className="text-lime-400 font-bold">{bd}</span> dias uteis
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-zinc-600 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"><X size={18} /></button>
        </div>

        <div className="px-6 py-6 space-y-8 max-h-[75vh] overflow-y-auto">
          {feedback && (
            <div className={`rounded-xl px-4 py-3 text-[13px] font-semibold border flex items-center gap-2 ${feedback.type === "success" ? "bg-lime-400/8 border-lime-400/15 text-lime-400" : "bg-red-400/8 border-red-400/15 text-red-400"}`}>
              {feedback.type === "success" ? <Check size={15} /> : <AlertCircle size={15} />}
              {feedback.msg}
            </div>
          )}

          {/* Metas Gerais */}
          <div>
            <p className="text-label mb-3">Metas Gerais de Vendas (R$)</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {NIVEIS.map((n) => (
                <div key={n} className="rounded-xl border border-[#222222] bg-[#111111] p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{NIVEL_LABEL[n]}</span>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-zinc-600">R$</span>
                    <input type="number" value={gerais[n] || ""} onChange={(e) => setGerais((p) => ({ ...p, [n]: Number(e.target.value) }))} placeholder="0" className={inputCls} />
                  </div>
                  <div className="mt-2 text-[10px] font-semibold text-zinc-600">Diaria: <span className="text-zinc-300">{formatCurrency(bd > 0 ? gerais[n] / bd : 0)}</span></div>
                </div>
              ))}
            </div>
          </div>

          {/* Metas Closers */}
          {closers.length > 0 && (
            <div>
              <p className="text-label mb-3">Metas por Closer (R$)</p>
              <div className="overflow-x-auto rounded-xl border border-[#222222]">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-[#111111]" style={{ borderBottom: "1px solid #222222" }}>
                      <th className="text-left py-3 px-4 text-label">Closer</th>
                      {NIVEIS.map((n) => <th key={n} className="text-center py-3 px-2 text-label">{NIVEL_LABEL[n]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {closers.map((c) => (
                      <tr key={c.id} style={{ borderBottom: "1px solid #222222" }}>
                        <td className="py-3 px-4 font-bold text-white text-[13px]">{c.name}</td>
                        {NIVEIS.map((n) => (
                          <td key={n} className="py-2 px-2">
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-zinc-700">R$</span>
                              <input
                                type="number" value={mc[c.id]?.[n] || ""} placeholder="0"
                                onChange={(e) => setMc((p) => ({ ...p, [c.id]: { ...p[c.id], [n]: Number(e.target.value) } }))}
                                className="w-28 rounded-lg border border-[#222222] bg-[#0a0a0a] pl-8 pr-2 py-1.5 text-[12px] font-bold text-white outline-none focus:border-lime-400/30"
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Metas SDRs */}
          {sdrs.length > 0 && (
            <div>
              <p className="text-label mb-3">Metas por SDR (agendamentos + reunioes)</p>
              <div className="overflow-x-auto rounded-xl border border-[#222222]">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-[#111111]" style={{ borderBottom: "1px solid #222222" }}>
                      <th className="text-left py-3 px-4 text-label">SDR</th>
                      {NIVEIS.map((n) => (
                        <th key={n} className="text-center py-3 px-2 text-label">
                          <div>{NIVEL_LABEL[n]}</div>
                          <div className="flex gap-1 justify-center mt-1 text-[9px] text-zinc-600">
                            <span>Agend</span><span>/</span><span>Reun</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sdrs.map((s) => (
                      <tr key={s.id} style={{ borderBottom: "1px solid #222222" }}>
                        <td className="py-3 px-4 font-bold text-white text-[13px]">{s.name}</td>
                        {NIVEIS.map((n) => (
                          <td key={n} className="py-2 px-2">
                            <div className="flex flex-col gap-1">
                              <input
                                type="number" min={0} step={1} value={ms[s.id]?.[n] || ""} placeholder="Agend"
                                onChange={(e) => setMs((p) => ({ ...p, [s.id]: { ...p[s.id], [n]: Number(e.target.value) } }))}
                                className={`w-24 ${numCls} text-center text-[12px]`}
                              />
                              <input
                                type="number" min={0} step={1} value={msReun[s.id]?.[n] || ""} placeholder="Reun"
                                onChange={(e) => setMsReun((p) => ({ ...p, [s.id]: { ...p[s.id], [n]: Number(e.target.value) } }))}
                                className={`w-24 ${numCls} text-center text-[12px] border-blue-400/20 focus:border-blue-400/40`}
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-5 border-t border-[#222222]">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-zinc-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lime-400/10 border border-lime-400/20 text-[13px] font-bold text-lime-400 hover:bg-lime-400/15 transition-all cursor-pointer disabled:opacity-40">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Salvar Metas
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PAGE
// ============================================================
export default function MetasPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [metasMensais, setMetasMensais] = useState<MetaMensal[]>([]);
  const [closers, setClosers] = useState<Closer[]>([]);
  const [sdrs, setSdrs] = useState<Sdr[]>([]);
  const [closerMetas, setCloserMetas] = useState<CloserMeta[]>([]);
  const [sdrMetas, setSdrMetas] = useState<SdrMeta[]>([]);

  const bd = getBusinessDays(selectedMonth);

  const fetchAll = useCallback(async () => {
    const supabase = getSupabase();
    setLoading(true);

    const [mRes, cRes, sRes] = await Promise.all([
      supabase.from("metas_mensais").select("*").eq("mes", selectedMonth),
      supabase.from("closers").select("id, name").order("name"),
      supabase.from("sdrs").select("id, name").order("name"),
    ]);

    const metas = (mRes.data ?? []) as MetaMensal[];
    const cls = (cRes.data ?? []) as Closer[];
    const sds = (sRes.data ?? []) as Sdr[];
    setMetasMensais(metas);
    setClosers(cls);
    setSdrs(sds);

    const mesIds = metas.map((m) => m.id);
    if (mesIds.length > 0) {
      const [cmRes, smRes] = await Promise.all([
        supabase.from("metas_closers").select("*").in("mes_id", mesIds),
        supabase.from("metas_sdrs").select("*").in("mes_id", mesIds),
      ]);
      setCloserMetas((cmRes.data ?? []) as CloserMeta[]);
      setSdrMetas((smRes.data ?? []) as SdrMeta[]);
    } else {
      setCloserMetas([]); setSdrMetas([]);
    }
    setLoading(false);
  }, [selectedMonth]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const hasMetas = metasMensais.length > 0;

  // Build nivel lookup: mesId -> nivel
  const mesIdToNivel: Record<number, string> = {};
  metasMensais.forEach((m) => { mesIdToNivel[m.id] = m.nivel; });

  // Build modal initial data
  const buildModalData = () => {
    const gerais: Record<Nivel, number> = { minima: 0, super: 0, ultra: 0, black: 0 };
    const existingMesIds: Record<string, number> = {};
    metasMensais.forEach((m) => { const n = m.nivel as Nivel; if (NIVEIS.includes(n)) { gerais[n] = m.meta_mensal_vendas; existingMesIds[n] = m.id; } });

    const ic: Record<number, Record<Nivel, number>> = {};
    const icIds: Record<number, Record<string, number>> = {};
    closers.forEach((c) => { ic[c.id] = { minima: 0, super: 0, ultra: 0, black: 0 }; icIds[c.id] = {}; });
    closerMetas.forEach((cm) => {
      const n = mesIdToNivel[cm.mes_id] as Nivel;
      if (n && ic[cm.closer_id]) { ic[cm.closer_id][n] = cm.meta_mensal; icIds[cm.closer_id][n] = cm.id; }
    });

    const is: Record<number, Record<Nivel, number>> = {};
    const isReun: Record<number, Record<Nivel, number>> = {};
    const isIds: Record<number, Record<string, number>> = {};
    sdrs.forEach((s) => { is[s.id] = { minima: 0, super: 0, ultra: 0, black: 0 }; isReun[s.id] = { minima: 0, super: 0, ultra: 0, black: 0 }; isIds[s.id] = {}; });
    sdrMetas.forEach((sm) => {
      const n = mesIdToNivel[sm.mes_id] as Nivel;
      if (n && is[sm.sdr_id]) { is[sm.sdr_id][n] = sm.meta_mensal; isReun[sm.sdr_id][n] = (sm as SdrMeta).meta_reunioes_mensal || 0; isIds[sm.sdr_id][n] = sm.id; }
    });

    return { gerais, ic, is, isReun, existingMesIds, icIds, isIds };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/8 border border-lime-400/15">
            <Target size={18} className="text-lime-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Metas</h1>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">{bd} dias uteis</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
          {hasMetas && (
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl border border-[#222222] bg-[#111111] px-5 py-2.5 text-[13px] font-bold text-zinc-400 hover:text-white hover:border-lime-400/20 transition-all cursor-pointer">
              <Pencil size={15} /> Editar Metas
            </button>
          )}
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-lime-400/10 border border-lime-400/20 px-5 py-2.5 text-[13px] font-bold text-lime-400 hover:bg-lime-400/15 transition-all cursor-pointer">
            <Plus size={15} /> Lancar Meta
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 size={28} className="animate-spin text-lime-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Carregando metas</span>
        </div>
      ) : !hasMetas ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Target size={32} className="text-zinc-700" />
          <p className="text-zinc-500 font-semibold">Nenhuma meta definida para este mes</p>
          <p className="text-zinc-700 text-sm">Clique em &quot;Lancar Meta&quot; para comecar</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Metas Gerais */}
          <div>
            <p className="text-label mb-4">Metas Gerais de Vendas</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {NIVEIS.map((n) => {
                const meta = metasMensais.find((m) => m.nivel === n);
                if (!meta) return null;
                return (
                  <div key={n} className="rounded-xl border border-[#222222] bg-[#111111] p-5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">{NIVEL_LABEL[n]}</span>
                    <p className="text-2xl font-extrabold mt-2 text-white">{formatCurrency(meta.meta_mensal_vendas)}</p>
                    <div className="flex items-center justify-between mt-3 rounded-lg bg-black/30 px-3 py-2">
                      <span className="text-[10px] font-semibold text-zinc-600 uppercase">Diaria</span>
                      <span className="text-sm font-extrabold text-zinc-300">{formatCurrency(meta.meta_diaria_vendas)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Metas Closers */}
          {closerMetas.length > 0 && (
            <div>
              <p className="text-label mb-4">Metas por Closer (R$)</p>
              <div className="card overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <th className="text-left py-3 px-5 text-label">Closer</th>
                      {NIVEIS.map((n) => <th key={n} className="text-right py-3 px-4 text-label">{NIVEL_LABEL[n]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {closers.map((c) => {
                      const row = NIVEIS.map((n) => {
                        const mesId = metasMensais.find((m) => m.nivel === n)?.id;
                        return closerMetas.find((cm) => cm.closer_id === c.id && cm.mes_id === mesId);
                      });
                      if (row.every((r) => !r)) return null;
                      return (
                        <tr key={c.id} style={{ borderBottom: "1px solid var(--border-color)" }} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-5 font-bold text-white">{c.name}</td>
                          {row.map((r, i) => (
                            <td key={NIVEIS[i]} className="py-3 px-4 text-right font-extrabold text-zinc-300">
                              {r ? formatCurrency(r.meta_mensal) : "—"}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Metas SDRs */}
          {sdrMetas.length > 0 && (
            <div>
              <p className="text-label mb-4">Metas por SDR (agendamentos + reunioes)</p>
              <div className="card overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <th className="text-left py-3 px-5 text-label">SDR</th>
                      {NIVEIS.map((n) => (
                        <th key={n} className="text-center py-3 px-4 text-label">
                          <div>{NIVEL_LABEL[n]}</div>
                          <div className="flex gap-2 justify-center mt-1 text-[9px] text-zinc-600">
                            <span>Agend</span><span>Reun</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sdrs.map((s) => {
                      const row = NIVEIS.map((n) => {
                        const mesId = metasMensais.find((m) => m.nivel === n)?.id;
                        return sdrMetas.find((sm) => sm.sdr_id === s.id && sm.mes_id === mesId);
                      });
                      if (row.every((r) => !r)) return null;
                      return (
                        <tr key={s.id} style={{ borderBottom: "1px solid var(--border-color)" }} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-5 font-bold text-white">{s.name}</td>
                          {row.map((r, i) => (
                            <td key={NIVEIS[i]} className="py-3 px-4 text-center">
                              <div className="flex gap-3 justify-center">
                                <span className="font-extrabold text-zinc-300">{r ? r.meta_mensal : "—"}</span>
                                <span className="font-extrabold text-blue-400">{r ? (r.meta_reunioes_mensal || 0) : "—"}</span>
                              </div>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (() => {
        const d = buildModalData();
        return (
          <MetaModal
            selectedMonth={selectedMonth} onClose={() => setShowModal(false)} onSaved={fetchAll}
            closers={closers} sdrs={sdrs}
            initialGerais={d.gerais} initialClosers={d.ic} initialSdrs={d.is} initialSdrsReun={d.isReun}
            existingMesIds={d.existingMesIds} existingCloserIds={d.icIds} existingSdrIds={d.isIds}
          />
        );
      })()}
    </div>
  );
}
