"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import {
  Users,
  UserPlus,
  Loader2,
  Pencil,
  Trash2,
  Save,
  X,
  Phone,
  Headphones,
  Building,
} from "lucide-react";

const supabase = getSupabase();

const tabs = [
  { id: "closers", label: "Closers", icon: Phone },
  { id: "sdrs", label: "SDRs", icon: Headphones },
  { id: "origens", label: "Origens", icon: Building },
] as const;

type TabId = (typeof tabs)[number]["id"];

interface EntityRow {
  id: number;
  name: string;
  editing?: boolean;
  editName?: string;
}

function EntityManager({
  table,
  label,
}: {
  table: string;
  label: string;
}) {
  const [rows, setRows] = useState<EntityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  };

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(table)
      .select("id, name")
      .order("name");

    if (error) {
      showFeedback("error", `Erro ao carregar ${label}`);
      setRows([]);
    } else {
      setRows((data ?? []).map((r) => ({ ...r, editing: false, editName: r.name })));
    }
    setLoading(false);
  }, [table, label]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);

    const { error } = await supabase.from(table).insert({ name: newName.trim() });

    if (error) {
      showFeedback("error", `Erro ao adicionar: ${error.message}`);
    } else {
      showFeedback("success", `${label} adicionado com sucesso`);
      setNewName("");
      fetchRows();
    }
    setSaving(false);
  };

  const handleEdit = (id: number) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, editing: true, editName: r.name } : r))
    );
  };

  const handleCancelEdit = (id: number) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, editing: false, editName: r.name } : r))
    );
  };

  const handleSaveEdit = async (id: number) => {
    const row = rows.find((r) => r.id === id);
    if (!row || !row.editName?.trim()) return;

    const { error } = await supabase
      .from(table)
      .update({ name: row.editName.trim() })
      .eq("id", id);

    if (error) {
      showFeedback("error", `Erro ao editar: ${error.message}`);
    } else {
      showFeedback("success", "Atualizado com sucesso");
      fetchRows();
    }
  };

  const handleDelete = async (id: number) => {
    if (deleting === id) {
      const { error } = await supabase.from(table).delete().eq("id", id);

      if (error) {
        showFeedback("error", `Erro ao excluir: ${error.message}`);
      } else {
        showFeedback("success", "Excluido com sucesso");
        fetchRows();
      }
      setDeleting(null);
    } else {
      setDeleting(id);
      setTimeout(() => setDeleting(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={28} className="animate-spin text-lime-400" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
          Carregando {label}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feedback */}
      {feedback && (
        <div
          className={`rounded-xl px-4 py-3 text-[13px] font-semibold border ${
            feedback.type === "success"
              ? "bg-lime-400/8 border-lime-400/15 text-lime-400"
              : "bg-red-400/8 border-red-400/15 text-red-400"
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {/* Add new */}
      <div className="card p-5">
        <h3 className="text-label mb-4">Adicionar {label}</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={`Nome do ${label}`}
            className="flex-1 rounded-xl border border-[#1a1a1a] bg-[#050505] px-4 py-2.5 text-sm font-semibold text-white placeholder-zinc-700 outline-none focus:border-lime-400/30 transition-colors"
          />
          <button
            onClick={handleAdd}
            disabled={saving || !newName.trim()}
            className="flex items-center gap-2 rounded-xl bg-lime-400/10 border border-lime-400/20 px-5 py-2.5 text-[13px] font-bold text-lime-400 hover:bg-lime-400/15 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
            Adicionar
          </button>
        </div>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
              <th className="text-left py-3.5 px-5 text-label">ID</th>
              <th className="text-left py-3.5 px-5 text-label">Nome</th>
              <th className="text-right py-3.5 px-5 text-label">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="transition-all duration-200"
                style={{ borderBottom: "1px solid var(--border-color)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td className="py-3.5 px-5 font-semibold text-zinc-600">#{row.id}</td>
                <td className="py-3.5 px-5">
                  {row.editing ? (
                    <input
                      type="text"
                      value={row.editName}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r) =>
                            r.id === row.id ? { ...r, editName: e.target.value } : r
                          )
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(row.id);
                        if (e.key === "Escape") handleCancelEdit(row.id);
                      }}
                      autoFocus
                      className="w-full rounded-lg border border-lime-400/30 bg-[#050505] px-3 py-1.5 text-sm font-semibold text-white outline-none"
                    />
                  ) : (
                    <span className="font-bold text-white">{row.name}</span>
                  )}
                </td>
                <td className="py-3.5 px-5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {row.editing ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(row.id)}
                          className="rounded-lg p-2 text-lime-400 hover:bg-lime-400/10 transition-colors cursor-pointer"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={() => handleCancelEdit(row.id)}
                          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(row.id)}
                          className="rounded-lg p-2 text-zinc-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          className={`rounded-lg p-2 transition-colors cursor-pointer ${
                            deleting === row.id
                              ? "text-red-400 bg-red-400/10"
                              : "text-zinc-500 hover:text-red-400 hover:bg-red-400/5"
                          }`}
                          title={deleting === row.id ? "Clique novamente para confirmar" : "Excluir"}
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="py-12 text-center text-sm font-semibold text-zinc-600">
                  Nenhum {label} cadastrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] font-semibold text-zinc-700">
        {rows.length} {label}{rows.length !== 1 ? "s" : ""} cadastrado{rows.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ============================================================
// ORIGEM MANAGER — with sub-origens
// ============================================================
function OrigemManager() {
  interface OrigemRow {
    id: number; name: string; sub_origem: string[] ;
    editing: boolean; editName: string; editSubs: string[];
  }

  const [rows, setRows] = useState<OrigemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newSubs, setNewSubs] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showFb = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg }); setTimeout(() => setFeedback(null), 3000);
  };

  const parseSubs = (raw: string | string[] | null): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { const p = JSON.parse(raw as string); return Array.isArray(p) ? p : []; } catch { return []; }
  };

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabase();
    const { data, error } = await supabase.from("origens").select("*").order("name");
    if (error) { showFb("error", "Erro ao carregar origens"); setRows([]); }
    else {
      setRows((data ?? []).map((r: { id: number; name: string; sub_origem: string | string[] | null }) => ({
        id: r.id, name: r.name, sub_origem: parseSubs(r.sub_origem),
        editing: false, editName: r.name, editSubs: parseSubs(r.sub_origem),
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const supabase = getSupabase();
    const subsArray = newSubs.split(",").map((s) => s.trim()).filter(Boolean);
    const { error } = await supabase.from("origens").insert({
      name: newName.trim(),
      sub_origem: subsArray.length > 0 ? JSON.stringify(subsArray) : null,
    });
    if (error) showFb("error", "Erro: " + error.message);
    else { showFb("success", "Origem adicionada"); setNewName(""); setNewSubs(""); fetchRows(); }
    setSaving(false);
  };

  const handleEdit = (id: number) => {
    setRows((p) => p.map((r) => r.id === id ? { ...r, editing: true, editName: r.name, editSubs: [...r.sub_origem] } : r));
  };

  const handleCancelEdit = (id: number) => {
    setRows((p) => p.map((r) => r.id === id ? { ...r, editing: false } : r));
  };

  const handleSaveEdit = async (id: number) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    const supabase = getSupabase();
    const { error } = await supabase.from("origens").update({
      name: row.editName.trim(),
      sub_origem: row.editSubs.length > 0 ? JSON.stringify(row.editSubs) : null,
    }).eq("id", id);
    if (error) showFb("error", "Erro: " + error.message);
    else { showFb("success", "Origem atualizada"); fetchRows(); }
  };

  const handleDelete = async (id: number) => {
    if (deleting === id) {
      const supabase = getSupabase();
      const { error } = await supabase.from("origens").delete().eq("id", id);
      if (error) showFb("error", "Erro: " + error.message);
      else { showFb("success", "Origem excluida"); fetchRows(); }
      setDeleting(null);
    } else { setDeleting(id); setTimeout(() => setDeleting(null), 3000); }
  };

  const addEditSub = (id: number, value: string) => {
    if (!value.trim()) return;
    setRows((p) => p.map((r) => r.id === id ? { ...r, editSubs: [...r.editSubs, value.trim()] } : r));
  };

  const removeEditSub = (id: number, idx: number) => {
    setRows((p) => p.map((r) => r.id === id ? { ...r, editSubs: r.editSubs.filter((_, i) => i !== idx) } : r));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={28} className="animate-spin text-lime-400" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Carregando origens</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <div className={`rounded-xl px-4 py-3 text-[13px] font-semibold border ${feedback.type === "success" ? "bg-lime-400/8 border-lime-400/15 text-lime-400" : "bg-red-400/8 border-red-400/15 text-red-400"}`}>
          {feedback.msg}
        </div>
      )}

      {/* Add new */}
      <div className="card p-5">
        <h3 className="text-label mb-4">Adicionar Origem</h3>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome da origem"
              className="flex-1 rounded-xl border border-[#1a1a1a] bg-[#050505] px-4 py-2.5 text-sm font-semibold text-white placeholder-zinc-700 outline-none focus:border-lime-400/30 transition-colors" />
            <button onClick={handleAdd} disabled={saving || !newName.trim()}
              className="flex items-center gap-2 rounded-xl bg-lime-400/10 border border-lime-400/20 px-5 py-2.5 text-[13px] font-bold text-lime-400 hover:bg-lime-400/15 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />} Adicionar
            </button>
          </div>
          <input type="text" value={newSubs} onChange={(e) => setNewSubs(e.target.value)} placeholder="Sub-origens (separadas por virgula)" onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="rounded-xl border border-[#1a1a1a] bg-[#050505] px-4 py-2.5 text-sm font-semibold text-white placeholder-zinc-700 outline-none focus:border-lime-400/30 transition-colors" />
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="card p-5">
            <div className="flex items-center justify-between mb-2">
              {row.editing ? (
                <input type="text" value={row.editName}
                  onChange={(e) => setRows((p) => p.map((r) => r.id === row.id ? { ...r, editName: e.target.value } : r))}
                  className="rounded-lg border border-lime-400/30 bg-[#050505] px-3 py-1.5 text-sm font-bold text-white outline-none flex-1 mr-3" />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-extrabold text-white">{row.name}</span>
                  <span className="text-[10px] font-bold text-zinc-700">#{row.id}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                {row.editing ? (
                  <>
                    <button onClick={() => handleSaveEdit(row.id)} className="rounded-lg p-2 text-lime-400 hover:bg-lime-400/10 transition-colors cursor-pointer"><Save size={14} /></button>
                    <button onClick={() => handleCancelEdit(row.id)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 transition-colors cursor-pointer"><X size={14} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEdit(row.id)} className="rounded-lg p-2 text-zinc-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(row.id)} className={`rounded-lg p-2 transition-colors cursor-pointer ${deleting === row.id ? "text-red-400 bg-red-400/10" : "text-zinc-500 hover:text-red-400 hover:bg-red-400/5"}`}><Trash2 size={14} /></button>
                  </>
                )}
              </div>
            </div>

            {/* Sub-origens display/edit */}
            {row.editing ? (
              <div className="mt-3 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Sub-origens</p>
                <div className="flex flex-wrap gap-2">
                  {row.editSubs.map((sub, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] px-3 py-1.5 text-[12px] font-semibold text-zinc-300">
                      {sub}
                      <button onClick={() => removeEditSub(row.id, idx)} className="text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"><X size={12} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text" placeholder="Nova sub-origem" id={`sub-input-${row.id}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addEditSub(row.id, (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                    className="flex-1 rounded-lg border border-[#1a1a1a] bg-[#050505] px-3 py-1.5 text-[12px] font-semibold text-white placeholder-zinc-700 outline-none focus:border-lime-400/30" />
                  <button
                    onClick={() => {
                      const input = document.getElementById(`sub-input-${row.id}`) as HTMLInputElement;
                      if (input) { addEditSub(row.id, input.value); input.value = ""; }
                    }}
                    className="rounded-lg bg-lime-400/10 border border-lime-400/20 px-3 py-1.5 text-[11px] font-bold text-lime-400 hover:bg-lime-400/15 cursor-pointer">
                    + Adicionar
                  </button>
                </div>
              </div>
            ) : row.sub_origem.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {row.sub_origem.map((sub, idx) => (
                  <span key={idx} className="rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] px-2.5 py-1 text-[11px] font-semibold text-zinc-400">
                    {sub}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-zinc-700 mt-1">Sem sub-origens</p>
            )}
          </div>
        ))}
        {rows.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-[13px] font-semibold text-zinc-600">Nenhuma origem cadastrada</p>
          </div>
        )}
      </div>

      <p className="text-[11px] font-semibold text-zinc-700">
        {rows.length} origem{rows.length !== 1 ? "s" : ""} cadastrada{rows.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export default function CadastrosPage() {
  const [activeTab, setActiveTab] = useState<TabId>("closers");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/8 border border-lime-400/15">
          <Users size={18} className="text-lime-400" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Cadastros</h1>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
            Closers, SDRs e origens
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-[#1a1a1a]">
        <nav className="flex gap-1" aria-label="Tabs">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-[13px] font-semibold
                  border-b-2 transition-all duration-200 cursor-pointer
                  ${
                    active
                      ? "border-lime-400 text-lime-400"
                      : "border-transparent text-zinc-600 hover:text-zinc-300 hover:border-zinc-800"
                  }
                `}
              >
                <tab.icon size={15} strokeWidth={active ? 2 : 1.5} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "closers" && <EntityManager table="closers" label="Closer" />}
        {activeTab === "sdrs" && <EntityManager table="sdrs" label="SDR" />}
        {activeTab === "origens" && <OrigemManager />}
      </div>
    </div>
  );
}
