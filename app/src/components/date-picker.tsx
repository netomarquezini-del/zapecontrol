"use client";

import { useState, useRef, useEffect } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

function pad(n: number) { return String(n).padStart(2, "0"); }
function toISO(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

const PRESETS = [
  { label: "Hoje", key: "today" },
  { label: "Ontem", key: "yesterday" },
  { label: "Ultimos 7D", key: "last7" },
  { label: "Esse Mes", key: "thisMonth" },
  { label: "Mes Passado", key: "lastMonth" },
] as const;

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MONTH_FULL = ["Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function getPreset(key: string): { start: string; end: string } {
  const now = new Date();
  const today = toISO(now);
  switch (key) {
    case "today": return { start: today, end: today };
    case "yesterday": { const y = new Date(now); y.setDate(y.getDate() - 1); return { start: toISO(y), end: toISO(y) }; }
    case "last7": { const s = new Date(now); s.setDate(s.getDate() - 6); return { start: toISO(s), end: today }; }
    case "thisMonth": return { start: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, end: toISO(new Date(now.getFullYear(), now.getMonth() + 1, 0)) };
    case "lastMonth": return { start: toISO(new Date(now.getFullYear(), now.getMonth() - 1, 1)), end: toISO(new Date(now.getFullYear(), now.getMonth(), 0)) };
    default: return { start: today, end: today };
  }
}

function detectActivePreset(start: string, end: string): string | null {
  for (const p of PRESETS) {
    const r = getPreset(p.key);
    if (r.start === start && r.end === end) return p.key;
  }
  return null;
}

// ============================================================
// RANGE DATE PICKER (Dashboard, Lancamentos)
// ============================================================
export default function DatePicker({ startDate, endDate, onChange }: {
  startDate: string; endDate: string; onChange: (start: string, end: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setTempStart(startDate); setTempEnd(endDate); }, [startDate, endDate]);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handlePreset = (key: string) => {
    const { start, end } = getPreset(key);
    onChange(start, end); setOpen(false);
  };

  const activePreset = detectActivePreset(startDate, endDate);

  const label = (() => {
    if (activePreset) return PRESETS.find((p) => p.key === activePreset)?.label || "";
    const [, m1, d1] = startDate.split("-");
    const [y2, m2, d2] = endDate.split("-");
    if (startDate === endDate) return `${d1}/${m1}/${y2}`;
    return `${d1}/${m1} — ${d2}/${m2}/${y2}`;
  })();

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-xl border border-[#222222] bg-[#111111] px-4 py-2.5 text-[13px] font-bold text-white hover:border-lime-400/20 transition-all cursor-pointer">
        <CalendarDays size={14} className="text-lime-400" />
        {label}
      </button>
      {open && (
        <div className="absolute top-full mt-2 right-0 z-50 rounded-2xl border border-[#222222] bg-[#0a0a0a] shadow-2xl min-w-[280px]">
          <div className="p-3 space-y-0.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 px-2 pb-2">Periodo</p>
            {PRESETS.map((p) => (
              <button key={p.key} onClick={() => handlePreset(p.key)} className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${activePreset === p.key ? "bg-lime-400/8 text-lime-400 border border-lime-400/15" : "text-zinc-400 hover:text-lime-400 hover:bg-lime-400/5 border border-transparent"}`}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="border-t border-[#222222] p-3 space-y-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 px-1">Personalizado</p>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-700 block mb-1 px-1">De</label>
                <input type="date" value={tempStart} onChange={(e) => setTempStart(e.target.value)} className="w-full rounded-lg border border-[#222222] bg-[#111111] px-3 py-2 text-[12px] font-bold text-white outline-none focus:border-lime-400/30 [color-scheme:dark]" />
              </div>
              <div className="flex-1">
                <label className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-700 block mb-1 px-1">Ate</label>
                <input type="date" value={tempEnd} onChange={(e) => setTempEnd(e.target.value)} className="w-full rounded-lg border border-[#222222] bg-[#111111] px-3 py-2 text-[12px] font-bold text-white outline-none focus:border-lime-400/30 [color-scheme:dark]" />
              </div>
            </div>
            <button onClick={() => { onChange(tempStart, tempEnd); setOpen(false); }} className="w-full rounded-xl bg-lime-400/10 border border-lime-400/20 py-2.5 text-[12px] font-extrabold text-lime-400 hover:bg-lime-400/15 transition-all cursor-pointer">
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MONTH PICKER (Metas page)
// ============================================================
export function MonthPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => Number(value.split("-")[0]));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const [, m] = value.split("-").map(Number);
  const label = `${MONTH_FULL[m - 1]} de ${value.split("-")[0]}`;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-xl border border-[#222222] bg-[#111111] px-4 py-2.5 text-[13px] font-bold text-white hover:border-lime-400/20 transition-all cursor-pointer">
        <CalendarDays size={14} className="text-lime-400" />
        <span className="capitalize">{label}</span>
      </button>
      {open && (
        <div className="absolute top-full mt-2 right-0 z-50 rounded-2xl border border-[#222222] bg-[#0a0a0a] shadow-2xl p-4 min-w-[240px]">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setViewYear((y) => y - 1)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"><ChevronLeft size={16} /></button>
            <span className="text-sm font-bold text-white">{viewYear}</span>
            <button onClick={() => setViewYear((y) => y + 1)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"><ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((mo, i) => {
              const val = `${viewYear}-${pad(i + 1)}`;
              const isSelected = value === val;
              return (
                <button key={mo} onClick={() => { onChange(val); setOpen(false); }} className={`rounded-xl py-2.5 text-[13px] font-semibold transition-all cursor-pointer ${isSelected ? "bg-lime-400/10 border border-lime-400/20 text-lime-400" : "text-zinc-400 hover:text-white hover:bg-white/[0.03] border border-transparent"}`}>
                  {mo}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
