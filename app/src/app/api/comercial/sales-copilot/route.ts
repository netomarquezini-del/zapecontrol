import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import type {
  SalesCallRow,
  CallData,
  CloserData,
  DashboardResponse,
  RedFlagItem,
  RedFlagsWrapper,
  StageItem,
} from '@/app/(panel)/comercial/sales-copilot/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ── helpers ──────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function safeNumber(val: string | number | null | undefined): number {
  if (val == null) return 0;
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

function avg(total: number, count: number): number {
  return count > 0 ? Math.round(total / count) : 0;
}

function avgFixed(total: number, count: number, decimals = 1): number {
  return count > 0 ? +((total / count).toFixed(decimals)) : 0;
}

/** Normalize red_flags which can be RedFlagItem[] | { triggered: RedFlagItem[] } | null */
function normalizeRedFlags(raw: SalesCallRow['red_flags']): RedFlagItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object' && 'triggered' in raw) {
    return (raw as RedFlagsWrapper).triggered || [];
  }
  return [];
}

// ── main handler ─────────────────────────────────────────────

const EMPTY_METRICS: DashboardResponse = {
  calls: [],
  metrics: {
    totalCalls: 0,
    avgDuration: 0,
    avgDurationFormatted: '0:00',
    avgTalkRatioCloser: 0,
    avgTalkRatioLead: 0,
    avgLeadAgreements: 0,
    avgSpinTime: 0,
    avgSpinTimeFormatted: '0:00',
    totalRedFlags: 0,
    avgRedFlagsPerCall: 0,
    closers: [],
  },
};

export async function GET() {
  try {
    const supabase = getServiceSupabase();

    const { data: rows, error } = await supabase
      .from('sales_calls')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
      .returns<SalesCallRow[]>();

    if (error) {
      console.error('[comercial/sales-copilot] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Erro ao buscar dados do Supabase' },
        { status: 502 },
      );
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json(EMPTY_METRICS);
    }

    const totalCalls = rows.length;

    // ── aggregate metrics (single pass) ──
    let sumDuration = 0;
    let sumTalkCloser = 0;
    let sumTalkLead = 0;
    let sumAgreements = 0;
    let sumSpinTime = 0;
    let sumRedFlags = 0;

    interface CloserAccumulator {
      name: string;
      calls: number;
      totalDuration: number;
      totalRedFlags: number;
      totalSims: number;
      totalSpinTime: number;
      talkRatioSum: number;
    }

    const closerMap = new Map<string, CloserAccumulator>();

    const calls: CallData[] = rows.map((row) => {
      const duration = row.call_duration_seconds ?? 0;
      const talkCloser = safeNumber(row.talk_ratio_closer);
      const talkLead = safeNumber(row.talk_ratio_lead);
      const agreements = row.lead_agreements ?? 0;
      const spinSeconds = row.spin_total_seconds ?? 0;
      const redFlagsCount = row.total_red_flags ?? 0;
      const closerName = row.closer_name || 'Desconhecido';

      sumDuration += duration;
      sumTalkCloser += talkCloser;
      sumTalkLead += talkLead;
      sumAgreements += agreements;
      sumSpinTime += spinSeconds;
      sumRedFlags += redFlagsCount;

      let acc = closerMap.get(closerName);
      if (!acc) {
        acc = { name: closerName, calls: 0, totalDuration: 0, totalRedFlags: 0, totalSims: 0, totalSpinTime: 0, talkRatioSum: 0 };
        closerMap.set(closerName, acc);
      }
      acc.calls++;
      acc.totalDuration += duration;
      acc.totalRedFlags += redFlagsCount;
      acc.totalSims += agreements;
      acc.totalSpinTime += spinSeconds;
      acc.talkRatioSum += talkCloser;

      return {
        id: row.id,
        createdAt: row.created_at,
        closerName,
        duration,
        durationFormatted: row.call_duration_formatted || formatTime(duration),
        talkRatioCloser: talkCloser,
        talkRatioLead: talkLead,
        leadAgreements: agreements,
        spinTotalSeconds: spinSeconds,
        spinTotalFormatted: row.spin_total_formatted || formatTime(spinSeconds),
        totalRedFlags: redFlagsCount,
        stages: (row.stages as StageItem[]) || [],
        redFlags: normalizeRedFlags(row.red_flags),
      };
    });

    const avgDuration = avg(sumDuration, totalCalls);

    const closers: CloserData[] = Array.from(closerMap.values()).map((c) => ({
      name: c.name,
      totalCalls: c.calls,
      avgDuration: avg(c.totalDuration, c.calls),
      avgDurationFormatted: formatTime(avg(c.totalDuration, c.calls)),
      avgRedFlags: avgFixed(c.totalRedFlags, c.calls),
      avgSims: avgFixed(c.totalSims, c.calls),
      avgSpinTime: avg(c.totalSpinTime, c.calls),
      avgSpinTimeFormatted: formatTime(avg(c.totalSpinTime, c.calls)),
      avgTalkRatio: avg(c.talkRatioSum, c.calls),
    }));

    const response: DashboardResponse = {
      calls,
      metrics: {
        totalCalls,
        avgDuration,
        avgDurationFormatted: formatTime(avgDuration),
        avgTalkRatioCloser: avg(sumTalkCloser, totalCalls),
        avgTalkRatioLead: avg(sumTalkLead, totalCalls),
        avgLeadAgreements: avg(sumAgreements, totalCalls),
        avgSpinTime: avg(sumSpinTime, totalCalls),
        avgSpinTimeFormatted: formatTime(avg(sumSpinTime, totalCalls)),
        totalRedFlags: sumRedFlags,
        avgRedFlagsPerCall: avgFixed(sumRedFlags, totalCalls),
        closers,
      },
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno desconhecido';
    console.error('[comercial/sales-copilot] Unexpected error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
