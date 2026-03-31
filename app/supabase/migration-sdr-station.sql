-- ============================================================
-- SDR STATION — SUPABASE MIGRATION
-- Version: 1.0.0
-- Date: 2026-03-31
-- Epic 5 / Story 5.1
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- ENUMS
-- ────────────────────────────────────────────────────────────

CREATE TYPE sdr_lead_status AS ENUM (
  'novo',
  'tentativa',
  'conectado',
  'qualificado',
  'agendado',
  'descartado'
);

CREATE TYPE sdr_call_status AS ENUM (
  'initiated',
  'ringing',
  'answered',
  'completed',
  'no_answer',
  'busy',
  'failed',
  'canceled'
);

CREATE TYPE sdr_call_disposition AS ENUM (
  'atendeu',
  'nao_atendeu',
  'agendar',
  'sem_interesse',
  'numero_errado',
  'caixa_postal'
);

CREATE TYPE sdr_message_channel AS ENUM (
  'whatsapp',
  'instagram',
  'phone'
);

CREATE TYPE sdr_message_direction AS ENUM (
  'inbound',
  'outbound'
);

CREATE TYPE sdr_message_status AS ENUM (
  'pending',
  'sent',
  'delivered',
  'read',
  'failed'
);

CREATE TYPE sdr_interaction_type AS ENUM (
  'call',
  'message',
  'note',
  'schedule'
);

CREATE TYPE sdr_cadence_execution_status AS ENUM (
  'active',
  'paused',
  'completed',
  'exited'
);

CREATE TYPE sdr_number_status AS ENUM (
  'ativo',
  'pausado',
  'bloqueado'
);

CREATE TYPE sdr_transcription_status AS ENUM (
  'pending',
  'transcribing',
  'analyzing',
  'completed',
  'error'
);

CREATE TYPE sdr_schedule_status AS ENUM (
  'agendado',
  'confirmado',
  'realizado',
  'no_show',
  'cancelado'
);

-- ────────────────────────────────────────────────────────────
-- TABLE: sdr_leads — Lead management
-- ────────────────────────────────────────────────────────────

CREATE TABLE sdr_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  empresa TEXT,
  cargo TEXT,
  origem TEXT,
  status sdr_lead_status NOT NULL DEFAULT 'novo',
  tags TEXT[] DEFAULT '{}',
  sdr_id UUID REFERENCES auth.users(id),
  instagram_username TEXT,
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sdr_leads_status ON sdr_leads(status);
CREATE INDEX idx_sdr_leads_sdr_id ON sdr_leads(sdr_id);
CREATE INDEX idx_sdr_leads_telefone ON sdr_leads(telefone);
CREATE INDEX idx_sdr_leads_created ON sdr_leads(created_at DESC);

-- ────────────────────────────────────────────────────────────
-- TABLE: sdr_calls — Call log
-- ────────────────────────────────────────────────────────────

CREATE TABLE sdr_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES sdr_leads(id) ON DELETE CASCADE,
  sdr_id UUID REFERENCES auth.users(id),
  twilio_sid TEXT,
  status sdr_call_status NOT NULL DEFAULT 'initiated',
  disposition sdr_call_disposition,
  duration INTEGER DEFAULT 0,
  recording_url TEXT,
  number_used TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sdr_calls_lead_id ON sdr_calls(lead_id);
CREATE INDEX idx_sdr_calls_sdr_id ON sdr_calls(sdr_id);
CREATE INDEX idx_sdr_calls_status ON sdr_calls(status);
CREATE INDEX idx_sdr_calls_twilio_sid ON sdr_calls(twilio_sid) WHERE twilio_sid IS NOT NULL;
CREATE INDEX idx_sdr_calls_created ON sdr_calls(created_at DESC);

-- ────────────────────────────────────────────────────────────
-- TABLE: sdr_messages — Multi-channel messages
-- ────────────────────────────────────────────────────────────

CREATE TABLE sdr_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES sdr_leads(id) ON DELETE CASCADE,
  sdr_id UUID REFERENCES auth.users(id),
  direction sdr_message_direction NOT NULL,
  channel sdr_message_channel NOT NULL,
  content TEXT,
  media_url TEXT,
  template_id UUID,
  status sdr_message_status NOT NULL DEFAULT 'pending',
  external_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sdr_messages_lead_id ON sdr_messages(lead_id);
CREATE INDEX idx_sdr_messages_sdr_id ON sdr_messages(sdr_id);
CREATE INDEX idx_sdr_messages_channel ON sdr_messages(channel);
CREATE INDEX idx_sdr_messages_status ON sdr_messages(status);
CREATE INDEX idx_sdr_messages_external_id ON sdr_messages(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_sdr_messages_created ON sdr_messages(created_at DESC);

-- ────────────────────────────────────────────────────────────
-- TABLE: sdr_interactions — Unified timeline
-- ────────────────────────────────────────────────────────────

CREATE TABLE sdr_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES sdr_leads(id) ON DELETE CASCADE,
  type sdr_interaction_type NOT NULL,
  reference_id UUID,
  summary TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sdr_interactions_lead_id ON sdr_interactions(lead_id);
CREATE INDEX idx_sdr_interactions_type ON sdr_interactions(type);
CREATE INDEX idx_sdr_interactions_reference_id ON sdr_interactions(reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX idx_sdr_interactions_created ON sdr_interactions(created_at DESC);

-- ────────────────────────────────────────────────────────────
-- TABLE: sdr_cadences — Cadence definitions
-- ────────────────────────────────────────────────────────────

CREATE TABLE sdr_cadences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sdr_cadences_is_active ON sdr_cadences(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_sdr_cadences_is_default ON sdr_cadences(is_default) WHERE is_default = TRUE;
CREATE INDEX idx_sdr_cadences_created_by ON sdr_cadences(created_by);

-- ────────────────────────────────────────────────────────────
-- TABLE: sdr_cadence_executions — Per-lead cadence state
-- ────────────────────────────────────────────────────────────

CREATE TABLE sdr_cadence_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES sdr_leads(id) ON DELETE CASCADE,
  cadence_id UUID NOT NULL REFERENCES sdr_cadences(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0,
  status sdr_cadence_execution_status NOT NULL DEFAULT 'active',
  next_action_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lead_id, cadence_id)
);

CREATE INDEX idx_sdr_cadence_exec_lead_id ON sdr_cadence_executions(lead_id);
CREATE INDEX idx_sdr_cadence_exec_cadence_id ON sdr_cadence_executions(cadence_id);
CREATE INDEX idx_sdr_cadence_exec_status ON sdr_cadence_executions(status);
CREATE INDEX idx_sdr_cadence_exec_next_action ON sdr_cadence_executions(next_action_at)
  WHERE status = 'active' AND next_action_at IS NOT NULL;

-- ────────────────────────────────────────────────────────────
-- TABLE: sdr_numbers — Twilio number pool
-- ────────────────────────────────────────────────────────────

CREATE TABLE sdr_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twilio_sid TEXT,
  number TEXT NOT NULL UNIQUE,
  ddd TEXT NOT NULL,
  friendly_name TEXT,
  status sdr_number_status NOT NULL DEFAULT 'ativo',
  call_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sdr_numbers_ddd ON sdr_numbers(ddd);
CREATE INDEX idx_sdr_numbers_status ON sdr_numbers(status);
CREATE INDEX idx_sdr_numbers_ddd_status ON sdr_numbers(ddd, status) WHERE status = 'ativo';

-- ────────────────────────────────────────────────────────────
-- TABLE: sdr_transcriptions — Call transcription + AI analysis
-- ────────────────────────────────────────────────────────────

CREATE TABLE sdr_transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES sdr_calls(id) ON DELETE CASCADE UNIQUE,
  status sdr_transcription_status NOT NULL DEFAULT 'pending',
  text TEXT,
  summary TEXT,
  score INTEGER CHECK (score >= 1 AND score <= 10),
  objections JSONB DEFAULT '[]',
  improvements JSONB DEFAULT '[]',
  next_steps TEXT,
  tokens_used INTEGER,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sdr_transcriptions_call_id ON sdr_transcriptions(call_id);
CREATE INDEX idx_sdr_transcriptions_status ON sdr_transcriptions(status);

-- ────────────────────────────────────────────────────────────
-- TABLE: sdr_schedules — Closer meeting scheduling
-- ────────────────────────────────────────────────────────────

CREATE TABLE sdr_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES sdr_leads(id) ON DELETE CASCADE,
  sdr_id UUID REFERENCES auth.users(id),
  closer_id UUID REFERENCES auth.users(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  status sdr_schedule_status NOT NULL DEFAULT 'agendado',
  notes TEXT,
  followup_sent_d1 BOOLEAN DEFAULT false,
  followup_sent_d0 BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sdr_schedules_lead_id ON sdr_schedules(lead_id);
CREATE INDEX idx_sdr_schedules_sdr_id ON sdr_schedules(sdr_id);
CREATE INDEX idx_sdr_schedules_closer_id ON sdr_schedules(closer_id);
CREATE INDEX idx_sdr_schedules_status ON sdr_schedules(status);
CREATE INDEX idx_sdr_schedules_scheduled_at ON sdr_schedules(scheduled_at);
CREATE INDEX idx_sdr_schedules_followup ON sdr_schedules(scheduled_at, status)
  WHERE status = 'agendado' AND (followup_sent_d1 = false OR followup_sent_d0 = false);

-- ────────────────────────────────────────────────────────────
-- TABLE: sdr_message_templates — Reusable message templates
-- ────────────────────────────────────────────────────────────

CREATE TABLE sdr_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel sdr_message_channel NOT NULL,
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sdr_msg_templates_channel ON sdr_message_templates(channel);
CREATE INDEX idx_sdr_msg_templates_is_active ON sdr_message_templates(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_sdr_msg_templates_created_by ON sdr_message_templates(created_by);

-- ────────────────────────────────────────────────────────────
-- FUNCTION: update_updated_at trigger (CREATE OR REPLACE — safe if already exists)
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- TRIGGERS: auto-update updated_at
-- ────────────────────────────────────────────────────────────

CREATE TRIGGER trg_sdr_leads_updated_at
  BEFORE UPDATE ON sdr_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_sdr_cadences_updated_at
  BEFORE UPDATE ON sdr_cadences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_sdr_cadence_executions_updated_at
  BEFORE UPDATE ON sdr_cadence_executions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_sdr_transcriptions_updated_at
  BEFORE UPDATE ON sdr_transcriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_sdr_schedules_updated_at
  BEFORE UPDATE ON sdr_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────────
-- RLS: Enable Row Level Security on all tables
-- ────────────────────────────────────────────────────────────

ALTER TABLE sdr_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_cadences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_cadence_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_message_templates ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- RLS POLICIES: service_role — full access (API routes use service key)
-- ────────────────────────────────────────────────────────────

CREATE POLICY "service_all_sdr_leads" ON sdr_leads FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_all_sdr_calls" ON sdr_calls FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_all_sdr_messages" ON sdr_messages FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_all_sdr_interactions" ON sdr_interactions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_all_sdr_cadences" ON sdr_cadences FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_all_sdr_cadence_executions" ON sdr_cadence_executions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_all_sdr_numbers" ON sdr_numbers FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_all_sdr_transcriptions" ON sdr_transcriptions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_all_sdr_schedules" ON sdr_schedules FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_all_sdr_message_templates" ON sdr_message_templates FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ────────────────────────────────────────────────────────────
-- RLS POLICIES: authenticated — full CRUD for logged-in users
-- ────────────────────────────────────────────────────────────

CREATE POLICY "auth_all_sdr_leads" ON sdr_leads FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "auth_all_sdr_calls" ON sdr_calls FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "auth_all_sdr_messages" ON sdr_messages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "auth_all_sdr_interactions" ON sdr_interactions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "auth_all_sdr_cadences" ON sdr_cadences FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "auth_all_sdr_cadence_executions" ON sdr_cadence_executions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "auth_all_sdr_numbers" ON sdr_numbers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "auth_all_sdr_transcriptions" ON sdr_transcriptions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "auth_all_sdr_schedules" ON sdr_schedules FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "auth_all_sdr_message_templates" ON sdr_message_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ────────────────────────────────────────────────────────────
-- SEED: Default cadence
-- ────────────────────────────────────────────────────────────

INSERT INTO sdr_cadences (name, description, is_active, is_default, steps)
VALUES (
  'Cadencia Padrao SDR',
  'Cadencia padrao de 5 toques: 3 ligacoes + WhatsApp + Instagram',
  true,
  true,
  '[
    {"step": 1, "channel": "phone", "delay_days": 0, "template_id": null},
    {"step": 2, "channel": "phone", "delay_days": 1, "template_id": null},
    {"step": 3, "channel": "phone", "delay_days": 3, "template_id": null},
    {"step": 4, "channel": "whatsapp", "delay_days": 4, "template_id": null},
    {"step": 5, "channel": "instagram", "delay_days": 5, "template_id": null}
  ]'::jsonb
);
