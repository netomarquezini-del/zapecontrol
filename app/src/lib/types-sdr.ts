// SDR Station Types

// ══════════════════════════════════════════════════════════════
//  Enums (match database)
// ══════════════════════════════════════════════════════════════

export type SdrLeadStatus = 'novo' | 'tentativa' | 'conectado' | 'qualificado' | 'agendado' | 'descartado'
export type SdrCallStatus = 'initiated' | 'ringing' | 'answered' | 'completed' | 'no_answer' | 'busy' | 'failed' | 'canceled'
export type SdrCallDisposition = 'atendeu' | 'nao_atendeu' | 'agendar' | 'sem_interesse' | 'numero_errado' | 'caixa_postal'
export type SdrMessageChannel = 'whatsapp' | 'instagram' | 'phone'
export type SdrMessageDirection = 'inbound' | 'outbound'
export type SdrMessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
export type SdrInteractionType = 'call' | 'message' | 'note' | 'schedule'
export type SdrCadenceExecutionStatus = 'active' | 'paused' | 'completed' | 'exited'
export type SdrNumberStatus = 'ativo' | 'pausado' | 'bloqueado'
export type SdrTranscriptionStatus = 'pending' | 'transcribing' | 'analyzing' | 'completed' | 'error'
export type SdrScheduleStatus = 'agendado' | 'confirmado' | 'realizado' | 'no_show' | 'cancelado'

// ══════════════════════════════════════════════════════════════
//  Interfaces
// ══════════════════════════════════════════════════════════════

export interface SdrLead {
  id: string
  nome: string
  telefone: string
  email: string | null
  empresa: string | null
  cargo: string | null
  origem: string | null
  status: SdrLeadStatus
  sdr_user_id: string | null
  cadence_id: string | null
  tags: string[]
  custom_fields: Record<string, unknown>
  last_contact_at: string | null
  next_contact_at: string | null
  total_calls: number
  total_messages: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SdrCall {
  id: string
  lead_id: string
  sdr_user_id: string
  number_id: string | null
  direction: SdrMessageDirection
  status: SdrCallStatus
  disposition: SdrCallDisposition | null
  duration_seconds: number | null
  recording_url: string | null
  external_call_id: string | null
  started_at: string
  answered_at: string | null
  ended_at: string | null
  notes: string | null
  created_at: string
}

export interface SdrMessage {
  id: string
  lead_id: string
  sdr_user_id: string
  channel: SdrMessageChannel
  direction: SdrMessageDirection
  status: SdrMessageStatus
  content: string
  template_id: string | null
  external_message_id: string | null
  sent_at: string | null
  delivered_at: string | null
  read_at: string | null
  created_at: string
}

export interface SdrInteraction {
  id: string
  lead_id: string
  sdr_user_id: string
  type: SdrInteractionType
  summary: string | null
  metadata: Record<string, unknown>
  reference_id: string | null
  created_at: string
}

export interface SdrCadence {
  id: string
  name: string
  description: string | null
  steps: SdrCadenceStep[]
  is_active: boolean
  is_default: boolean
  total_leads: number
  conversion_rate: number | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface SdrCadenceStep {
  step: number
  channel: SdrMessageChannel | 'phone'
  delay_days: number
  template_id: string | null
}

export interface SdrCadenceExecution {
  id: string
  lead_id: string
  cadence_id: string
  current_step: number
  status: SdrCadenceExecutionStatus
  started_at: string
  paused_at: string | null
  completed_at: string | null
  exited_at: string | null
  exit_reason: string | null
  next_action_at: string | null
  created_at: string
  updated_at: string
}

export interface SdrNumber {
  id: string
  number: string
  label: string | null
  provider: string
  status: SdrNumberStatus
  assigned_to: string | null
  daily_limit: number
  calls_today: number
  region: string | null
  capabilities: string[]
  created_at: string
  updated_at: string
}

export interface SdrTranscription {
  id: string
  call_id: string
  status: SdrTranscriptionStatus
  transcription_text: string | null
  ai_summary: string | null
  ai_sentiment: string | null
  ai_next_steps: string | null
  ai_score: number | null
  language: string | null
  duration_seconds: number | null
  word_count: number | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface SdrSchedule {
  id: string
  lead_id: string
  sdr_user_id: string
  closer_user_id: string | null
  status: SdrScheduleStatus
  scheduled_at: string
  duration_minutes: number
  meeting_link: string | null
  notes: string | null
  confirmed_at: string | null
  completed_at: string | null
  no_show_at: string | null
  canceled_at: string | null
  cancel_reason: string | null
  created_at: string
  updated_at: string
}

export interface SdrMessageTemplate {
  id: string
  name: string
  channel: SdrMessageChannel
  content: string
  variables: string[]
  is_active: boolean
  usage_count: number
  created_by: string
  created_at: string
  updated_at: string
}

// ══════════════════════════════════════════════════════════════
//  Insert / Update types
// ══════════════════════════════════════════════════════════════

export type SdrLeadInsert = Omit<SdrLead, 'id' | 'created_at' | 'updated_at'>
export type SdrLeadUpdate = Partial<SdrLeadInsert>

export type SdrCallInsert = Omit<SdrCall, 'id' | 'created_at'>
export type SdrCallUpdate = Partial<SdrCallInsert>

export type SdrMessageInsert = Omit<SdrMessage, 'id' | 'created_at'>
export type SdrMessageUpdate = Partial<SdrMessageInsert>

export type SdrInteractionInsert = Omit<SdrInteraction, 'id' | 'created_at'>

export type SdrCadenceInsert = Omit<SdrCadence, 'id' | 'created_at' | 'updated_at'>
export type SdrCadenceUpdate = Partial<SdrCadenceInsert>

export type SdrCadenceExecutionInsert = Omit<SdrCadenceExecution, 'id' | 'created_at' | 'updated_at'>
export type SdrCadenceExecutionUpdate = Partial<SdrCadenceExecutionInsert>

export type SdrNumberInsert = Omit<SdrNumber, 'id' | 'created_at' | 'updated_at'>
export type SdrNumberUpdate = Partial<SdrNumberInsert>

export type SdrTranscriptionInsert = Omit<SdrTranscription, 'id' | 'created_at'>
export type SdrTranscriptionUpdate = Partial<SdrTranscriptionInsert>

export type SdrScheduleInsert = Omit<SdrSchedule, 'id' | 'created_at' | 'updated_at'>
export type SdrScheduleUpdate = Partial<SdrScheduleInsert>

export type SdrMessageTemplateInsert = Omit<SdrMessageTemplate, 'id' | 'created_at' | 'updated_at'>
export type SdrMessageTemplateUpdate = Partial<SdrMessageTemplateInsert>

// ══════════════════════════════════════════════════════════════
//  Pipeline status config
// ══════════════════════════════════════════════════════════════

export const PIPELINE_STATUSES: { value: SdrLeadStatus; label: string; color: string }[] = [
  { value: 'novo', label: 'Novo', color: '#a3e635' },           // lime-400
  { value: 'tentativa', label: 'Tentativa', color: '#facc15' }, // yellow-400
  { value: 'conectado', label: 'Conectado', color: '#60a5fa' }, // blue-400
  { value: 'qualificado', label: 'Qualificado', color: '#818cf8' }, // indigo-400
  { value: 'agendado', label: 'Agendado', color: '#34d399' },   // emerald-400
  { value: 'descartado', label: 'Descartado', color: '#f87171' }, // red-400
]

// ══════════════════════════════════════════════════════════════
//  Disposition options config
// ══════════════════════════════════════════════════════════════

export const DISPOSITION_OPTIONS: { value: SdrCallDisposition; label: string; icon: string }[] = [
  { value: 'atendeu', label: 'Atendeu', icon: 'PhoneCall' },
  { value: 'nao_atendeu', label: 'Nao Atendeu', icon: 'PhoneMissed' },
  { value: 'agendar', label: 'Agendar', icon: 'CalendarPlus' },
  { value: 'sem_interesse', label: 'Sem Interesse', icon: 'ThumbsDown' },
  { value: 'numero_errado', label: 'Numero Errado', icon: 'PhoneOff' },
  { value: 'caixa_postal', label: 'Caixa Postal', icon: 'Voicemail' },
]
