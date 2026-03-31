'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Loader2,
  Clock,
  MessageSquare,
  AlertTriangle,
  ThumbsUp,
  Timer,
  Flag,
  Users,
  X,
  CheckCircle2,
  Circle,
  CircleDot,
} from 'lucide-react';
import type {
  CallData,
  CloserData,
  Metrics,
  DashboardResponse,
  StageItem,
  RedFlagItem,
} from './types';

const POLL_INTERVAL = 30_000;
const MAX_CONSECUTIVE_ERRORS = 3;

type TabId = 'overview' | 'calls' | 'closers';
type StatusColor = 'green' | 'yellow' | 'red';

// ══════════════════════════════════════════════════════════════
//  Main Dashboard
// ══════════════════════════════════════════════════════════════

export default function SalesCopilotPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedCall, setSelectedCall] = useState<CallData | null>(null);
  const [selectedCloser, setSelectedCloser] = useState<string>('all');
  const errorCountRef = useRef(0);

  const fetchData = useCallback(async () => {
    try {
      const resp = await fetch('/api/comercial/sales-copilot');
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
        throw new Error(body.error || `HTTP ${resp.status}`);
      }
      const json: DashboardResponse = await resp.json();
      setData(json);
      setError(null);
      errorCountRef.current = 0;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      errorCountRef.current++;
      if (errorCountRef.current === 1) {
        setError(message);
      }
      console.error('[SalesCopilot] fetch error:', message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (errorCountRef.current < MAX_CONSECUTIVE_ERRORS) {
        fetchData();
      }
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin text-lime-400 mx-auto mb-4" />
          <p className="text-sm text-zinc-500">Carregando dados...</p>
        </div>
      </div>
    );
  }

  // ── Error state (no data at all) ──
  if (error && !data) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center max-w-sm">
          <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-4" />
          <p className="text-sm font-semibold text-white mb-2">Erro ao carregar dados</p>
          <p className="text-xs text-zinc-500 mb-4">{error}</p>
          <button
            onClick={() => { errorCountRef.current = 0; setLoading(true); fetchData(); }}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#1A1A1A] text-lime-400 border border-[#222222] hover:border-lime-400/20 transition-colors cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics;
  const allCalls = data?.calls ?? [];
  const closers = metrics?.closers ?? [];
  const closerNames = [...new Set(allCalls.map(c => c.closerName).filter(Boolean))];
  const calls = selectedCloser === 'all' ? allCalls : allCalls.filter(c => c.closerName === selectedCloser);

  return (
    <div>
      {/* Page title */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-white">Sales Copilot</h1>
          <p className="text-xs text-zinc-500 mt-1">Analise de calls comerciais em tempo real</p>
        </div>
        <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-lime-400/10 text-lime-400 border border-lime-400/15">
          {metrics?.totalCalls ?? 0} calls
        </div>
      </div>

      {/* Stale data banner */}
      {error && data && (
        <div className="mb-4 px-4 py-2 rounded-xl text-center text-xs font-semibold bg-yellow-500/10 text-yellow-500 border border-yellow-500/15">
          Dados podem estar desatualizados — {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard label="Total de Calls" value={String(metrics?.totalCalls ?? 0)} />
        <StatCard label="Duracao Media" value={metrics?.avgDurationFormatted ?? '0:00'} />
        <StatCard label="Talk Ratio (Closer)" value={`${metrics?.avgTalkRatioCloser ?? 0}%`} status={getStatusByTalkRatio(metrics?.avgTalkRatioCloser)} />
        <StatCard label="SIMs por Call" value={String(metrics?.avgLeadAgreements ?? 0)} status={getStatusBySims(metrics?.avgLeadAgreements)} />
        <StatCard label="Red Flags / Call" value={String(metrics?.avgRedFlagsPerCall ?? 0)} status={getStatusByRedFlags(metrics?.avgRedFlagsPerCall)} />
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <StatCard label="SPIN Medio" value={metrics?.avgSpinTimeFormatted ?? '0:00'} status={getStatusBySpinTime(metrics?.avgSpinTime)} sub="Minimo ideal: 8:00" />
        <StatCard label="Total Red Flags" value={String(metrics?.totalRedFlags ?? 0)} accent />
        <StatCard label="Closers Ativos" value={String(closers.length)} />
      </div>

      {/* Filtro por Closer */}
      <div className="mt-6 flex items-center gap-3">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Filtrar por closer</label>
        <select
          value={selectedCloser}
          onChange={(e) => setSelectedCloser(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm font-semibold bg-[#111111] text-white border border-[#222222] focus:border-lime-400/30 focus:outline-none transition-colors cursor-pointer appearance-none"
          style={{ minWidth: '180px' }}
        >
          <option value="all">Todos os closers</option>
          {closerNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        {selectedCloser !== 'all' && (
          <button
            onClick={() => setSelectedCloser('all')}
            className="text-xs text-zinc-500 hover:text-lime-400 transition-colors cursor-pointer"
          >
            Limpar filtro
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-[#222222]">
        {([
          { id: 'overview', label: 'Visao Geral' },
          { id: 'calls', label: `Calls (${calls.length})` },
          { id: 'closers', label: `Closers (${closers.length})` },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-semibold transition-all relative cursor-pointer ${
              activeTab === tab.id ? 'text-lime-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-6 pb-12">
        {activeTab === 'overview' && <OverviewTab calls={calls} closers={closers} />}
        {activeTab === 'calls' && <CallsTab calls={calls} onSelect={setSelectedCall} />}
        {activeTab === 'closers' && <ClosersTab closers={closers} />}
      </div>

      {/* Call Detail Modal */}
      {selectedCall && <CallDetailModal call={selectedCall} onClose={() => setSelectedCall(null)} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  Stat Card
// ══════════════════════════════════════════════════════════════

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  status?: StatusColor;
  accent?: boolean;
}

const STATUS_COLORS: Record<StatusColor, string> = {
  green: 'text-green-500',
  yellow: 'text-yellow-500',
  red: 'text-red-500',
};

function StatCard({ label, value, sub, status, accent }: StatCardProps) {
  const valueClass = status
    ? STATUS_COLORS[status]
    : accent
      ? 'text-lime-400'
      : 'text-white';

  return (
    <div className="rounded-xl border border-[#222222] bg-[#111111] p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">{label}</p>
      <p className={`text-2xl font-extrabold tabular-nums ${valueClass}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  Overview Tab
// ══════════════════════════════════════════════════════════════

function OverviewTab({ calls, closers }: { calls: CallData[]; closers: CloserData[] }) {
  const recentCalls = calls.slice(0, 5);
  const sortedClosers = [...closers].sort((a, b) => b.totalCalls - a.totalCalls);

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Recent Calls */}
      <div className="col-span-2 rounded-xl border border-[#222222] bg-[#111111]">
        <div className="px-5 py-4 border-b border-[#222222]">
          <h3 className="text-sm font-bold text-white">Calls Recentes</h3>
        </div>
        {recentCalls.length === 0 ? (
          <EmptyState message="Nenhuma call registrada ainda." sub="As calls aparecem aqui automaticamente quando o Sales Copilot e usado." />
        ) : (
          <div>
            {recentCalls.map((call) => (
              <div key={call.id} className="px-5 py-3 flex items-center justify-between border-b border-[#1E1E1E] transition-colors hover:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <Avatar name={call.closerName} />
                  <div>
                    <p className="text-sm font-semibold text-white">{call.closerName}</p>
                    <p className="text-xs text-zinc-500">{formatDate(call.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <MiniMetric label="Duracao" value={call.durationFormatted} />
                  <MiniMetric label="Talk" value={`${call.talkRatioCloser}%`} color={call.talkRatioCloser > 70 ? 'text-red-500' : undefined} />
                  <MiniMetric label="SIMs" value={String(call.leadAgreements)} />
                  <MiniMetric label="Flags" value={String(call.totalRedFlags)} color={call.totalRedFlags > 0 ? 'text-red-500' : 'text-green-500'} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ranking Closers */}
      <div className="rounded-xl border border-[#222222] bg-[#111111]">
        <div className="px-5 py-4 border-b border-[#222222]">
          <h3 className="text-sm font-bold text-white">Ranking Closers</h3>
        </div>
        {sortedClosers.length === 0 ? (
          <EmptyState message="Sem dados ainda." />
        ) : (
          <div>
            {sortedClosers.map((closer, i) => (
              <div key={closer.name} className="px-5 py-3 flex items-center justify-between border-b border-[#1E1E1E]">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-5 text-center ${i === 0 ? 'text-lime-400' : 'text-zinc-500'}`}>
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{closer.name}</p>
                    <p className="text-xs text-zinc-500">{closer.totalCalls} calls</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs ${closer.avgRedFlags > 2 ? 'text-red-500' : 'text-zinc-400'}`}>
                    {closer.avgRedFlags} flags/call
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  Calls Tab
// ══════════════════════════════════════════════════════════════

function CallsTab({ calls, onSelect }: { calls: CallData[]; onSelect: (c: CallData) => void }) {
  return (
    <div className="rounded-xl border border-[#222222] bg-[#111111] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#222222]">
            <Th>Data</Th>
            <Th>Closer</Th>
            <Th>Duracao</Th>
            <Th>Talk Ratio</Th>
            <Th>SPIN</Th>
            <Th>SIMs</Th>
            <Th>Red Flags</Th>
          </tr>
        </thead>
        <tbody>
          {calls.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-zinc-500">Nenhuma call registrada</td>
            </tr>
          ) : (
            calls.map((call) => (
              <tr
                key={call.id}
                className="transition-colors cursor-pointer hover:bg-white/[0.02] border-b border-[#1E1E1E]"
                onClick={() => onSelect(call)}
              >
                <Td>{formatDate(call.createdAt)}</Td>
                <Td bold>{call.closerName}</Td>
                <Td>{call.durationFormatted}</Td>
                <Td color={call.talkRatioCloser > 70 ? 'text-red-500' : undefined}>{call.talkRatioCloser}% / {call.talkRatioLead}%</Td>
                <Td color={call.spinTotalSeconds < 480 ? 'text-yellow-500' : undefined}>{call.spinTotalFormatted}</Td>
                <Td color={call.leadAgreements < 3 ? 'text-yellow-500' : undefined}>{call.leadAgreements}</Td>
                <Td>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    call.totalRedFlags === 0
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-red-500/10 text-red-500'
                  }`}>
                    {call.totalRedFlags}
                  </span>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  Closers Tab
// ══════════════════════════════════════════════════════════════

function ClosersTab({ closers }: { closers: CloserData[] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {closers.length === 0 ? (
        <div className="col-span-2 text-center py-12">
          <p className="text-zinc-500">Nenhum closer com calls registradas.</p>
        </div>
      ) : (
        closers.map((closer) => (
          <div key={closer.name} className="rounded-xl border border-[#222222] bg-[#111111] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar name={closer.name} accent size="lg" />
                <div>
                  <p className="text-base font-bold text-white">{closer.name}</p>
                  <p className="text-xs text-zinc-500">{closer.totalCalls} calls realizadas</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniCard label="Duracao media" value={closer.avgDurationFormatted} />
              <MiniCard label="Talk ratio" value={`${closer.avgTalkRatio}%`} color={closer.avgTalkRatio > 70 ? 'text-red-500' : undefined} />
              <MiniCard label="SIMs / call" value={String(closer.avgSims)} color={closer.avgSims < 3 ? 'text-yellow-500' : undefined} />
              <MiniCard label="Red flags / call" value={String(closer.avgRedFlags)} color={closer.avgRedFlags > 2 ? 'text-red-500' : 'text-green-500'} />
              <MiniCard label="SPIN medio" value={closer.avgSpinTimeFormatted} color={closer.avgSpinTime < 480 ? 'text-yellow-500' : undefined} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  Call Detail Modal
// ══════════════════════════════════════════════════════════════

function CallDetailModal({ call, onClose }: { call: CallData; onClose: () => void }) {
  const stages: StageItem[] = call.stages ?? [];
  const redFlags: RedFlagItem[] = call.redFlags ?? [];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-[#222222] bg-[#111111]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#222222] flex items-center justify-between sticky top-0 z-10 bg-[#111111]">
          <div>
            <h2 className="text-lg font-bold text-white">{call.closerName}</h2>
            <p className="text-xs text-zinc-500">{formatDate(call.createdAt)} — {call.durationFormatted}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-zinc-600 hover:text-white hover:bg-white/5 cursor-pointer" aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        {/* Metrics */}
        <div className="px-6 py-4 grid grid-cols-4 gap-3">
          <MiniCard label="Talk Ratio" value={`${call.talkRatioCloser}% / ${call.talkRatioLead}%`} color={call.talkRatioCloser > 70 ? 'text-red-500' : undefined} />
          <MiniCard label="SIMs" value={String(call.leadAgreements)} color={call.leadAgreements < 3 ? 'text-yellow-500' : undefined} />
          <MiniCard label="SPIN" value={call.spinTotalFormatted} color={call.spinTotalSeconds < 480 ? 'text-yellow-500' : undefined} />
          <MiniCard label="Red Flags" value={String(call.totalRedFlags)} color={call.totalRedFlags > 0 ? 'text-red-500' : 'text-green-500'} />
        </div>

        {/* Stages */}
        {stages.length > 0 && (
          <div className="px-6 py-4 border-t border-[#222222]">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Etapas</p>
            <div className="space-y-1">
              {stages.map((stage, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  <div className="w-4 flex items-center justify-center">
                    {stage.status === 'completed' ? (
                      <CheckCircle2 size={14} className="text-lime-400" />
                    ) : stage.status === 'current' ? (
                      <CircleDot size={14} className="text-lime-400" />
                    ) : (
                      <Circle size={14} className="text-zinc-700" />
                    )}
                  </div>
                  <span className={`text-sm flex-1 ${stage.status === 'pending' ? 'text-zinc-700' : 'text-zinc-400'}`}>
                    {stage.label || stage.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Red Flags */}
        {redFlags.length > 0 && (
          <div className="px-6 py-4 border-t border-[#222222]">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Red Flags Disparados</p>
            <div className="space-y-2">
              {redFlags.map((flag, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                  <AlertTriangle size={14} className={`mt-0.5 flex-shrink-0 ${flag.severity === 'CRITICAL' ? 'text-red-500' : 'text-yellow-500'}`} />
                  <span>{flag.message || flag.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  Reusable Primitives
// ══════════════════════════════════════════════════════════════

function Avatar({ name, accent, size }: { name: string; accent?: boolean; size?: 'lg' }) {
  const dim = size === 'lg' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
  return (
    <div className={`${dim} rounded-full flex items-center justify-center font-bold bg-[#222222] ${accent ? 'text-lime-400' : 'text-zinc-400'}`}>
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

function EmptyState({ message, sub }: { message: string; sub?: string }) {
  return (
    <div className="px-5 py-8 text-center">
      <p className="text-zinc-500">{message}</p>
      {sub && <p className="text-xs text-zinc-700 mt-2">{sub}</p>}
    </div>
  );
}

function MiniMetric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center min-w-[50px]">
      <p className="text-xs text-zinc-700">{label}</p>
      <p className={`text-sm font-bold tabular-nums ${color || 'text-zinc-400'}`}>{value}</p>
    </div>
  );
}

function MiniCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg bg-[#1A1A1A] p-3">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={`text-sm font-bold tabular-nums ${color || 'text-white'}`}>{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
      {children}
    </th>
  );
}

function Td({ children, bold, color }: { children: React.ReactNode; bold?: boolean; color?: string }) {
  return (
    <td className={`px-4 py-3 text-sm tabular-nums ${color || 'text-zinc-400'} ${bold ? 'font-bold' : ''}`}>
      {children}
    </td>
  );
}

// ══════════════════════════════════════════════════════════════
//  Utils
// ══════════════════════════════════════════════════════════════

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '--';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--';
  }
}

function getStatusByTalkRatio(ratio?: number): StatusColor {
  if (!ratio) return 'green';
  if (ratio <= 60) return 'green';
  if (ratio <= 70) return 'yellow';
  return 'red';
}

function getStatusBySims(sims?: number): StatusColor {
  if (!sims) return 'red';
  if (sims >= 3) return 'green';
  if (sims >= 2) return 'yellow';
  return 'red';
}

function getStatusByRedFlags(flags?: number): StatusColor {
  if (!flags) return 'green';
  if (flags <= 1) return 'green';
  if (flags <= 2) return 'yellow';
  return 'red';
}

function getStatusBySpinTime(seconds?: number): StatusColor {
  if (!seconds) return 'red';
  if (seconds >= 480) return 'green';
  if (seconds >= 360) return 'yellow';
  return 'red';
}
