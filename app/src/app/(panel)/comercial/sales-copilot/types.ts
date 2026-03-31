// ============================================================
// Sales Copilot — Shared types (API + Client)
// ============================================================

/** Row shape coming from supabase `sales_calls` table */
export interface SalesCallRow {
  id: string;
  created_at: string;
  closer_name: string | null;
  call_duration_seconds: number | null;
  call_duration_formatted: string | null;
  talk_ratio_closer: string | number | null;
  talk_ratio_lead: string | number | null;
  lead_agreements: number | null;
  spin_total_seconds: number | null;
  spin_total_formatted: string | null;
  total_red_flags: number | null;
  stages: StageItem[] | null;
  red_flags: RedFlagItem[] | RedFlagsWrapper | null;
}

export interface StageItem {
  name?: string;
  label?: string;
  status: 'completed' | 'current' | 'pending';
}

export interface RedFlagItem {
  name?: string;
  message?: string;
  severity?: 'CRITICAL' | 'WARNING' | string;
}

/** Some calls store red_flags as { triggered: [...] } */
export interface RedFlagsWrapper {
  triggered: RedFlagItem[];
}

// --- API response types ---

export interface CallData {
  id: string;
  createdAt: string;
  closerName: string;
  duration: number;
  durationFormatted: string;
  talkRatioCloser: number;
  talkRatioLead: number;
  leadAgreements: number;
  spinTotalSeconds: number;
  spinTotalFormatted: string;
  totalRedFlags: number;
  stages: StageItem[];
  redFlags: RedFlagItem[];
}

export interface CloserData {
  name: string;
  totalCalls: number;
  avgDuration: number;
  avgDurationFormatted: string;
  avgRedFlags: number;
  avgSims: number;
  avgSpinTime: number;
  avgSpinTimeFormatted: string;
  avgTalkRatio: number;
}

export interface Metrics {
  totalCalls: number;
  avgDuration: number;
  avgDurationFormatted: string;
  avgTalkRatioCloser: number;
  avgTalkRatioLead: number;
  avgLeadAgreements: number;
  avgSpinTime: number;
  avgSpinTimeFormatted: string;
  totalRedFlags: number;
  avgRedFlagsPerCall: number;
  closers: CloserData[];
}

export interface DashboardResponse {
  calls: CallData[];
  metrics: Metrics;
}

export interface ErrorResponse {
  error: string;
}
