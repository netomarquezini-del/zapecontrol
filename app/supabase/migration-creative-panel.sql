-- ============================================================
-- CREATIVE MANAGEMENT PANEL — SUPABASE MIGRATION
-- Version: 1.0.0
-- Date: 2026-03-30
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- ENUMS
-- ────────────────────────────────────────────────────────────

CREATE TYPE creative_status AS ENUM (
  'ideia',        -- Concept stage, not yet produced
  'em_producao',  -- Being produced by Maicon/Thomas
  'revisao',      -- QA review (Quinn/Hugo/Vitor)
  'aprovado',     -- Approved, waiting upload
  'pronto',       -- Ready — triggers auto-upload to Meta
  'em_teste',     -- Active on Meta, collecting data
  'winner',       -- CPA <= target for 3+ days, 10+ conversions
  'escala',       -- Promoted to scale campaign
  'saturado',     -- Frequency > 3.5 + CTR declining
  'pausado',      -- Paused by kill rule or manual
  'morto'         -- Permanently killed, archived
);

CREATE TYPE creative_angulo AS ENUM (
  'dor',           -- Pain-focused (burning money, no results)
  'desejo',        -- Desire-focused (financial freedom, scale)
  'prova_social',  -- Social proof (4000 students, 50M sold)
  'autoridade',    -- Authority (Neto's method, TRIA)
  'urgencia',      -- Urgency/scarcity
  'curiosidade',   -- Curiosity hook
  'contraste',     -- Before/after
  'identificacao', -- "You are this person" (compliant)
  'educativo',     -- Teaching a mini-lesson
  'controverso'    -- Contrarian opinion
);

CREATE TYPE creative_formato AS ENUM (
  'video_talking_head',
  'video_motion_graphics',
  'video_depoimento',
  'video_screen_recording',
  'video_misto',
  'estatico_single',
  'estatico_carrossel',
  'estatico_antes_depois',
  'estatico_lista',
  'estatico_prova_social',
  'estatico_quote',
  'estatico_comparacao',
  'estatico_numero',
  'estatico_headline_bold',
  'story_vertical',
  'reel_vertical'
);

CREATE TYPE creative_persona AS ENUM (
  'seller_iniciante',     -- Just starting, confused
  'seller_intermediario', -- Selling but not scaling
  'seller_avancado',      -- Doing 100k+ wants optimization
  'seller_frustrado',     -- Tried ADS, failed
  'seller_curioso',       -- Heard about Shopee ADS, exploring
  'geral'                 -- Broad targeting
);

CREATE TYPE creative_emocao AS ENUM (
  'medo',          -- Fear of losing money
  'frustacao',     -- Frustration with current results
  'esperanca',     -- Hope for better results
  'ambicao',       -- Ambition to scale
  'inveja',        -- FOMO seeing others succeed
  'confianca',     -- Trust in method/authority
  'curiosidade',   -- Intellectual curiosity
  'raiva',         -- Anger at wasted effort
  'alivio',        -- Relief from finding solution
  'empolgacao'     -- Excitement about possibility
);

CREATE TYPE trigger_type AS ENUM (
  'gancho_numerico',   -- "ROAS de 25 em 10 dias"
  'pergunta',          -- "Voce ta queimando dinheiro?"
  'afirmacao_choque',  -- "90% dos sellers erram isso"
  'historia',          -- "Meu aluno saiu do zero..."
  'contraste',         -- "Antes vs Depois"
  'desafio',           -- "Tente fazer isso em 7 dias"
  'segredo',           -- "O que ninguem te conta sobre..."
  'comando',           -- "Para de fazer isso agora"
  'lista',             -- "3 erros que todo seller comete"
  'revelacao'          -- "Descobri que..."
);

CREATE TYPE conceito_tipo AS ENUM (
  'hook',           -- Opening hook
  'angulo',         -- Creative angle
  'mecanismo',      -- Mechanism (4 configuracoes)
  'prova',          -- Proof element
  'oferta',         -- Offer framing
  'cta',            -- Call to action
  'formato_idea'    -- Format idea
);

-- ────────────────────────────────────────────────────────────
-- TABLE: criativos (main creative cards)
-- ────────────────────────────────────────────────────────────

CREATE TABLE criativos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  nome TEXT NOT NULL,                        -- Internal name (e.g. "AD108 | Video | Shopee Ads")
  descricao TEXT,                            -- Brief description of the concept

  -- Classification
  status creative_status NOT NULL DEFAULT 'ideia',
  angulo creative_angulo NOT NULL DEFAULT 'dor',
  formato creative_formato NOT NULL,
  persona creative_persona NOT NULL DEFAULT 'geral',
  emocao_primaria creative_emocao NOT NULL DEFAULT 'frustacao',
  emocao_secundaria creative_emocao,

  -- Content
  hook TEXT,                                 -- Opening hook text
  copy_primario TEXT,                        -- Primary text for Meta
  copy_titulo TEXT,                          -- Headline for Meta
  copy_descricao TEXT,                       -- Description for Meta
  roteiro TEXT,                              -- Full script (for videos)

  -- Production
  agente_produtor TEXT,                      -- 'maicon' | 'thomas' | 'manual'
  conceito_id UUID REFERENCES conceitos(id) ON DELETE SET NULL,
  ruminacao_id UUID REFERENCES ruminacoes(id) ON DELETE SET NULL,
  formato_id UUID REFERENCES formatos(id) ON DELETE SET NULL,
  variacao_de UUID REFERENCES criativos(id) ON DELETE SET NULL, -- Parent creative (if variation)
  geracao INT NOT NULL DEFAULT 1,            -- Generation number (1 = original, 2+ = variation)

  -- Files (Supabase Storage paths)
  arquivo_principal TEXT,                    -- Primary file (video/image) path in storage
  arquivo_thumbnail TEXT,                    -- Thumbnail path
  arquivo_preview TEXT,                      -- Preview/low-res path
  mime_type TEXT,                            -- e.g. "video/mp4", "image/png"
  duracao_segundos NUMERIC(6,2),             -- Video duration in seconds
  resolucao TEXT,                            -- e.g. "1080x1080", "1080x1920"
  tamanho_bytes BIGINT,                      -- File size

  -- Meta Ads Integration
  meta_ad_id TEXT,                           -- Meta Ad ID (after upload)
  meta_adset_id TEXT,                        -- Meta Ad Set ID
  meta_campaign_id TEXT,                     -- Meta Campaign ID
  meta_creative_id TEXT,                     -- Meta Creative ID
  meta_media_id TEXT,                        -- Meta media hash/video ID
  meta_upload_at TIMESTAMPTZ,               -- When uploaded to Meta
  meta_url TEXT,                             -- Link URL (default: /curso-ads/)

  -- Performance Snapshot (denormalized for fast queries)
  total_spend NUMERIC(12,2) DEFAULT 0,
  total_impressions BIGINT DEFAULT 0,
  total_clicks BIGINT DEFAULT 0,
  total_purchases INT DEFAULT 0,
  total_revenue NUMERIC(12,2) DEFAULT 0,
  cpa_atual NUMERIC(10,2),                   -- Current CPA
  roas_atual NUMERIC(8,4),                   -- Current ROAS
  ctr_atual NUMERIC(6,4),                    -- Current CTR
  frequency_atual NUMERIC(6,2),              -- Current frequency
  dias_ativo INT DEFAULT 0,                  -- Days active on Meta

  -- Winner Detection
  is_winner BOOLEAN DEFAULT FALSE,
  winner_at TIMESTAMPTZ,
  dias_consecutivos_bom INT DEFAULT 0,       -- Consecutive days CPA <= target

  -- Tags & Notes
  tags TEXT[] DEFAULT '{}',
  notas TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT DEFAULT 'system',
  updated_by TEXT DEFAULT 'system'
);

-- Indexes for common queries
CREATE INDEX idx_criativos_status ON criativos(status);
CREATE INDEX idx_criativos_angulo ON criativos(angulo);
CREATE INDEX idx_criativos_formato ON criativos(formato);
CREATE INDEX idx_criativos_persona ON criativos(persona);
CREATE INDEX idx_criativos_emocao ON criativos(emocao_primaria);
CREATE INDEX idx_criativos_meta_ad ON criativos(meta_ad_id) WHERE meta_ad_id IS NOT NULL;
CREATE INDEX idx_criativos_is_winner ON criativos(is_winner) WHERE is_winner = TRUE;
CREATE INDEX idx_criativos_variacao ON criativos(variacao_de) WHERE variacao_de IS NOT NULL;
CREATE INDEX idx_criativos_created ON criativos(created_at DESC);
CREATE INDEX idx_criativos_roas ON criativos(roas_atual DESC NULLS LAST) WHERE status = 'em_teste';

-- ────────────────────────────────────────────────────────────
-- TABLE: conceitos (67 creative concepts with ICE scores)
-- ────────────────────────────────────────────────────────────

CREATE TABLE conceitos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content
  nome TEXT NOT NULL,                        -- Short name
  descricao TEXT NOT NULL,                   -- Full concept description
  tipo conceito_tipo NOT NULL DEFAULT 'angulo',

  -- Classification
  angulo creative_angulo,
  persona creative_persona,
  emocao creative_emocao,

  -- ICE Scoring (1-10 each)
  ice_impacto NUMERIC(3,1) NOT NULL DEFAULT 5,    -- Impact: potential effect
  ice_confianca NUMERIC(3,1) NOT NULL DEFAULT 5,  -- Confidence: certainty it works
  ice_facilidade NUMERIC(3,1) NOT NULL DEFAULT 5, -- Ease: effort to produce
  ice_score NUMERIC(4,1) GENERATED ALWAYS AS (
    (ice_impacto + ice_confianca + ice_facilidade) / 3.0
  ) STORED,

  -- Usage tracking
  vezes_usado INT DEFAULT 0,
  melhor_roas NUMERIC(8,4),
  pior_roas NUMERIC(8,4),
  media_roas NUMERIC(8,4),

  -- Status
  ativo BOOLEAN DEFAULT TRUE,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conceitos_ice ON conceitos(ice_score DESC);
CREATE INDEX idx_conceitos_tipo ON conceitos(tipo);
CREATE INDEX idx_conceitos_angulo ON conceitos(angulo);
CREATE INDEX idx_conceitos_ativo ON conceitos(ativo) WHERE ativo = TRUE;

-- ────────────────────────────────────────────────────────────
-- TABLE: ruminacoes (55 ruminations/hooks)
-- ────────────────────────────────────────────────────────────

CREATE TABLE ruminacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content
  texto TEXT NOT NULL,                       -- The hook/rumination text
  texto_variantes TEXT[] DEFAULT '{}',       -- Alternative phrasings

  -- Classification
  trigger trigger_type NOT NULL,
  emocao creative_emocao NOT NULL,
  angulo creative_angulo,
  persona creative_persona,

  -- Scoring
  impacto_estimado NUMERIC(3,1) DEFAULT 5,  -- 1-10

  -- Performance (updated from Meta data)
  vezes_usado INT DEFAULT 0,
  melhor_ctr NUMERIC(6,4),
  media_ctr NUMERIC(6,4),
  melhor_hook_rate NUMERIC(6,4),             -- 3-second video view rate

  -- Status
  ativo BOOLEAN DEFAULT TRUE,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ruminacoes_trigger ON ruminacoes(trigger);
CREATE INDEX idx_ruminacoes_emocao ON ruminacoes(emocao);
CREATE INDEX idx_ruminacoes_ativo ON ruminacoes(ativo) WHERE ativo = TRUE;

-- ────────────────────────────────────────────────────────────
-- TABLE: formatos (16 creative formats with specs)
-- ────────────────────────────────────────────────────────────

CREATE TABLE formatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  nome TEXT NOT NULL UNIQUE,                 -- Format name
  formato creative_formato NOT NULL UNIQUE,
  tipo TEXT NOT NULL CHECK (tipo IN ('video', 'estatico')),

  -- Specs
  largura INT NOT NULL,                      -- Width in pixels
  altura INT NOT NULL,                       -- Height in pixels
  aspect_ratio TEXT NOT NULL,                -- e.g. "1:1", "9:16", "4:5"
  duracao_min NUMERIC(5,1),                  -- Min duration (video only)
  duracao_max NUMERIC(5,1),                  -- Max duration (video only)
  tamanho_max_mb INT DEFAULT 100,            -- Max file size

  -- Production guidance
  agente_recomendado TEXT,                   -- 'maicon' | 'thomas'
  template_remotion TEXT,                    -- Remotion template ID (if applicable)
  diretrizes TEXT,                           -- Production guidelines

  -- Performance tracking
  media_ctr NUMERIC(6,4),
  media_roas NUMERIC(8,4),
  total_criativos INT DEFAULT 0,
  total_winners INT DEFAULT 0,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- TABLE: metricas_criativos (daily performance from Meta API)
-- ────────────────────────────────────────────────────────────

CREATE TABLE metricas_criativos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  criativo_id UUID NOT NULL REFERENCES criativos(id) ON DELETE CASCADE,
  meta_ad_id TEXT NOT NULL,

  -- Date
  date DATE NOT NULL,

  -- Core metrics
  spend NUMERIC(10,2) NOT NULL DEFAULT 0,
  impressions BIGINT NOT NULL DEFAULT 0,
  reach BIGINT DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0,

  -- Rates
  ctr NUMERIC(6,4) DEFAULT 0,
  cpc NUMERIC(8,2) DEFAULT 0,
  cpm NUMERIC(8,2) DEFAULT 0,
  frequency NUMERIC(6,2) DEFAULT 0,

  -- Conversions
  purchases INT DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  cost_per_purchase NUMERIC(10,2) DEFAULT 0,
  roas NUMERIC(8,4) DEFAULT 0,

  -- Funnel
  landing_page_views BIGINT DEFAULT 0,
  add_to_cart INT DEFAULT 0,
  initiate_checkout INT DEFAULT 0,
  add_payment_info INT DEFAULT 0,
  link_clicks BIGINT DEFAULT 0,

  -- Video-specific
  video_views_3s BIGINT DEFAULT 0,
  video_views_15s BIGINT DEFAULT 0,
  video_views_complete BIGINT DEFAULT 0,
  hook_rate NUMERIC(6,4) DEFAULT 0,          -- 3s views / impressions
  hold_rate NUMERIC(6,4) DEFAULT 0,          -- complete / 3s views

  -- Engagement
  post_reactions INT DEFAULT 0,
  post_comments INT DEFAULT 0,
  post_shares INT DEFAULT 0,
  post_saves INT DEFAULT 0,

  -- Sync metadata
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uk_metricas_ad_date UNIQUE(meta_ad_id, date)
);

CREATE INDEX idx_metricas_criativo ON metricas_criativos(criativo_id);
CREATE INDEX idx_metricas_date ON metricas_criativos(date DESC);
CREATE INDEX idx_metricas_ad_date ON metricas_criativos(meta_ad_id, date DESC);

-- ────────────────────────────────────────────────────────────
-- TABLE: sugestoes_variacoes (auto-generated variation suggestions)
-- ────────────────────────────────────────────────────────────

CREATE TABLE sugestoes_variacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source
  criativo_origem_id UUID NOT NULL REFERENCES criativos(id) ON DELETE CASCADE,

  -- Suggestion
  tipo TEXT NOT NULL CHECK (tipo IN (
    'novo_hook',            -- Same creative, different hook
    'novo_angulo',          -- Same format, different angle
    'novo_formato',         -- Same concept, different format
    'novo_copy',            -- Same visual, different copy
    'nova_emocao',          -- Same message, different emotion
    'nova_persona',         -- Retarget to different persona
    'mashup',               -- Combine elements of 2 winners
    'escala_vertical'       -- Same everything but bigger budget
  )),
  descricao TEXT NOT NULL,                   -- What to change and why

  -- Suggested values
  angulo_sugerido creative_angulo,
  formato_sugerido creative_formato,
  persona_sugerida creative_persona,
  emocao_sugerida creative_emocao,
  hook_sugerido TEXT,
  copy_sugerido TEXT,

  -- Reasoning
  motivo TEXT NOT NULL,                      -- Why this variation
  confianca NUMERIC(3,1) DEFAULT 5,          -- 1-10 confidence
  impacto_estimado NUMERIC(3,1) DEFAULT 5,   -- 1-10 estimated impact

  -- Status
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
    'pendente',    -- Waiting for human review
    'aceita',      -- Accepted, will be produced
    'rejeitada',   -- Rejected by human
    'produzida'    -- Already produced (criativo_gerado_id filled)
  )),
  criativo_gerado_id UUID REFERENCES criativos(id) ON DELETE SET NULL,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT
);

CREATE INDEX idx_sugestoes_origem ON sugestoes_variacoes(criativo_origem_id);
CREATE INDEX idx_sugestoes_status ON sugestoes_variacoes(status) WHERE status = 'pendente';

-- ────────────────────────────────────────────────────────────
-- TABLE: historico_status (audit trail of status changes)
-- ────────────────────────────────────────────────────────────

CREATE TABLE historico_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  criativo_id UUID NOT NULL REFERENCES criativos(id) ON DELETE CASCADE,

  status_anterior creative_status,
  status_novo creative_status NOT NULL,

  motivo TEXT,                               -- Why the change happened
  detalhes JSONB DEFAULT '{}',               -- Additional context (metrics, rule name, etc.)

  executado_por TEXT NOT NULL DEFAULT 'system', -- 'system' | 'leo' | 'neto' | 'manual'

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_historico_criativo ON historico_status(criativo_id, created_at DESC);

-- ────────────────────────────────────────────────────────────
-- TABLE: matriz_cobertura (materialized view for coverage matrix)
-- ────────────────────────────────────────────────────────────

CREATE TABLE matriz_cobertura (
  angulo creative_angulo NOT NULL,
  formato creative_formato NOT NULL,
  persona creative_persona NOT NULL,

  total_criativos INT DEFAULT 0,
  total_em_teste INT DEFAULT 0,
  total_winners INT DEFAULT 0,
  total_mortos INT DEFAULT 0,

  media_roas NUMERIC(8,4),
  melhor_roas NUMERIC(8,4),

  ultima_atualizacao TIMESTAMPTZ DEFAULT now(),

  PRIMARY KEY (angulo, formato, persona)
);

-- ────────────────────────────────────────────────────────────
-- FUNCTION: update_updated_at trigger
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_criativos_updated_at
  BEFORE UPDATE ON criativos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_conceitos_updated_at
  BEFORE UPDATE ON conceitos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_ruminacoes_updated_at
  BEFORE UPDATE ON ruminacoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_formatos_updated_at
  BEFORE UPDATE ON formatos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────────
-- FUNCTION: log status changes automatically
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO historico_status (criativo_id, status_anterior, status_novo, motivo, executado_por)
    VALUES (NEW.id, OLD.status, NEW.status, 'Auto-logged by trigger', NEW.updated_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_criativos_status_log
  AFTER UPDATE ON criativos
  FOR EACH ROW EXECUTE FUNCTION log_status_change();

-- ────────────────────────────────────────────────────────────
-- FUNCTION: refresh coverage matrix
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION refresh_matriz_cobertura()
RETURNS void AS $$
BEGIN
  -- Clear and rebuild
  DELETE FROM matriz_cobertura;

  INSERT INTO matriz_cobertura (angulo, formato, persona, total_criativos, total_em_teste, total_winners, total_mortos, media_roas, melhor_roas, ultima_atualizacao)
  SELECT
    c.angulo,
    c.formato,
    c.persona,
    COUNT(*) AS total_criativos,
    COUNT(*) FILTER (WHERE c.status = 'em_teste') AS total_em_teste,
    COUNT(*) FILTER (WHERE c.is_winner = TRUE) AS total_winners,
    COUNT(*) FILTER (WHERE c.status = 'morto') AS total_mortos,
    AVG(c.roas_atual) FILTER (WHERE c.roas_atual IS NOT NULL AND c.roas_atual > 0) AS media_roas,
    MAX(c.roas_atual) AS melhor_roas,
    now()
  FROM criativos c
  GROUP BY c.angulo, c.formato, c.persona;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- RLS POLICIES
-- ────────────────────────────────────────────────────────────

ALTER TABLE criativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conceitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruminacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE formatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_criativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sugestoes_variacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE matriz_cobertura ENABLE ROW LEVEL SECURITY;

-- Service role: full access (used by Leo Engine and API routes with service key)
CREATE POLICY "service_all_criativos" ON criativos FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_all_conceitos" ON conceitos FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_all_ruminacoes" ON ruminacoes FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_all_formatos" ON formatos FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_all_metricas" ON metricas_criativos FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_all_sugestoes" ON sugestoes_variacoes FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_all_historico" ON historico_status FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_all_matriz" ON matriz_cobertura FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Anon role: read-only for dashboard (frontend uses anon key)
CREATE POLICY "anon_read_criativos" ON criativos FOR SELECT
  USING (auth.role() = 'anon');

CREATE POLICY "anon_read_conceitos" ON conceitos FOR SELECT
  USING (auth.role() = 'anon');

CREATE POLICY "anon_read_ruminacoes" ON ruminacoes FOR SELECT
  USING (auth.role() = 'anon');

CREATE POLICY "anon_read_formatos" ON formatos FOR SELECT
  USING (auth.role() = 'anon');

CREATE POLICY "anon_read_metricas" ON metricas_criativos FOR SELECT
  USING (auth.role() = 'anon');

CREATE POLICY "anon_read_sugestoes" ON sugestoes_variacoes FOR SELECT
  USING (auth.role() = 'anon');

CREATE POLICY "anon_read_historico" ON historico_status FOR SELECT
  USING (auth.role() = 'anon');

CREATE POLICY "anon_read_matriz" ON matriz_cobertura FOR SELECT
  USING (auth.role() = 'anon');

-- ────────────────────────────────────────────────────────────
-- SEED: formatos (16 creative formats)
-- ────────────────────────────────────────────────────────────

INSERT INTO formatos (nome, formato, tipo, largura, altura, aspect_ratio, duracao_min, duracao_max, tamanho_max_mb, agente_recomendado, diretrizes) VALUES
  ('Video Talking Head', 'video_talking_head', 'video', 1080, 1080, '1:1', 15, 60, 500, 'maicon', 'Pessoa falando direto pra camera. Hook nos primeiros 3s. Legendas obrigatorias.'),
  ('Video Motion Graphics', 'video_motion_graphics', 'video', 1080, 1080, '1:1', 15, 45, 500, 'maicon', 'ZERO fotos. Neurodesign. Cenas a cada 2-3s. Texto grande Albert Sans. 3D impactante.'),
  ('Video Depoimento', 'video_depoimento', 'video', 1080, 1080, '1:1', 15, 90, 500, 'maicon', 'Depoimento real de aluno. Humanos 100% reais. Sem atores.'),
  ('Video Screen Recording', 'video_screen_recording', 'video', 1080, 1080, '1:1', 30, 120, 500, 'maicon', 'Tela do Shopee mostrando resultados. Overlay com destaques.'),
  ('Video Misto', 'video_misto', 'video', 1080, 1080, '1:1', 15, 60, 500, 'maicon', 'Combina talking head + motion graphics + screen recording.'),
  ('Estatico Single', 'estatico_single', 'estatico', 1080, 1080, '1:1', NULL, NULL, 30, 'thomas', '4 blocos: headline + problema + resultado/solucao + proof. ~60-80 palavras.'),
  ('Estatico Carrossel', 'estatico_carrossel', 'estatico', 1080, 1080, '1:1', NULL, NULL, 30, 'thomas', 'Ate 10 cards. Primeiro card = hook forte. Ultimo = CTA com botao Shopee.'),
  ('Estatico Antes/Depois', 'estatico_antes_depois', 'estatico', 1080, 1080, '1:1', NULL, NULL, 30, 'thomas', 'Contraste visual claro. Numeros reais. Sem manipulacao.'),
  ('Estatico Lista', 'estatico_lista', 'estatico', 1080, 1080, '1:1', NULL, NULL, 30, 'thomas', 'Lista de 3-5 itens. Cada item com icone. Visual clean.'),
  ('Estatico Prova Social', 'estatico_prova_social', 'estatico', 1080, 1080, '1:1', NULL, NULL, 30, 'thomas', 'Print de resultado real. Destaque numeros. Logo Shopee.'),
  ('Estatico Quote', 'estatico_quote', 'estatico', 1080, 1080, '1:1', NULL, NULL, 30, 'thomas', 'Citacao impactante do Neto. Fonte grande/imponente.'),
  ('Estatico Comparacao', 'estatico_comparacao', 'estatico', 1080, 1080, '1:1', NULL, NULL, 30, 'thomas', 'Dois lados: errado vs certo. Cores contrastantes.'),
  ('Estatico Numero', 'estatico_numero', 'estatico', 1080, 1080, '1:1', NULL, NULL, 30, 'thomas', 'Um numero grande central (4000 alunos, ROAS 25, 50M). Contexto embaixo.'),
  ('Estatico Headline Bold', 'estatico_headline_bold', 'estatico', 1080, 1080, '1:1', NULL, NULL, 30, 'thomas', 'Headline gigante ocupando 60% do card. Fonte imponente. Sem botao.'),
  ('Story Vertical', 'story_vertical', 'video', 1080, 1920, '9:16', 5, 15, 500, 'maicon', 'Formato vertical stories/reels. Hook imediato. CTA swipe up.'),
  ('Reel Vertical', 'reel_vertical', 'video', 1080, 1920, '9:16', 15, 90, 500, 'maicon', 'Formato vertical reels. Ritmo rapido. Gancho nos primeiros 2s.');

-- ────────────────────────────────────────────────────────────
-- STORAGE BUCKET
-- ────────────────────────────────────────────────────────────
-- Run via Supabase Dashboard > Storage:
-- Create bucket: "criativos"
-- Public: false
-- File size limit: 500MB
-- Allowed MIME types: image/*, video/*
