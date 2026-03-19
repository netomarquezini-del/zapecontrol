"use client";

import { useState } from "react";
import { Target, TrendingUp, Users, CalendarSearch } from "lucide-react";
import MetaLevels from "@/components/metas/meta-levels";
import CloserMetas from "@/components/metas/closer-metas";
import SdrMetas from "@/components/metas/sdr-metas";

const tabs = [
  { id: "gerais", label: "Metas Gerais", icon: TrendingUp },
  { id: "closers", label: "Metas por Closer", icon: Users },
  { id: "sdrs", label: "Metas por SDR", icon: CalendarSearch },
] as const;

type TabId = (typeof tabs)[number]["id"];

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export default function MetasPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const [activeTab, setActiveTab] = useState<TabId>("gerais");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Target size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Metas</h1>
            <p className="text-sm text-zinc-500">
              Gerencie as metas de vendas e agendamentos
            </p>
          </div>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="month-selector"
            className="text-sm text-zinc-400 whitespace-nowrap"
          >
            Mês:
          </label>
          <input
            id="month-selector"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-[#222] bg-[#161616] px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/40 transition-colors [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-[#222]">
        <nav className="flex gap-1" aria-label="Tabs">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium
                  border-b-2 transition-all duration-150
                  ${
                    active
                      ? "border-emerald-400 text-emerald-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                  }
                `}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "gerais" && <MetaLevels selectedMonth={selectedMonth} />}
        {activeTab === "closers" && (
          <CloserMetas selectedMonth={selectedMonth} />
        )}
        {activeTab === "sdrs" && <SdrMetas selectedMonth={selectedMonth} />}
      </div>
    </div>
  );
}
