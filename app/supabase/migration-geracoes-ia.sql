-- ============================================================
-- GERACOES IA — SUPABASE MIGRATION
-- AI Copy Generation Tracking & Learning Loop
-- Version: 1.0.0
-- Date: 2026-03-31
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- ENUMS
-- ────────────────────────────────────────────────────────────

CREATE TYPE geracao_tipo AS ENUM (
  'variacao_winner',   -- Variation from an existing winner
  'criativo_novo'      -- Brand new creative from briefing
);

CREATE TYPE geracao_variacao_tipo AS ENUM (
  'hook',              -- New hook only
  'angulo',            -- Different angle approach
  'emocao',            -- Different emotional tone
  'copy_completa',     -- Full copy rewrite
  'remix_total',       -- Everything changes except persona/oferta
  'formato'            -- Adaptation to different format
);

CREATE TYPE geracao_resultado AS ENUM (
  'pendente',          -- Not yet tested
  'em_teste',          -- Currently running on Meta
  'winner',            -- Became a winner
  'morto',             -- Killed by rules
  'pausado',           -- Paused
  'saturado'           -- Saturated
);

-- ────────────────────────────────────────────────────────────
-- TABELA: geracoes_ia (batch de geração)
-- Cada vez que o Max gera um lote de copies
-- ────────────────────────────────────────────────────────────

CREATE TABLE geracoes_ia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tipo de geração
  tipo geracao_tipo NOT NULL,

  -- Inputs do briefing (para criativo_novo)
  input_persona creative_persona,
  input_angulo creative_angulo,
  input_emocao creative_emocao,
  input_formato creative_formato,

  -- Winner de origem (para variacao_winner)
  winner_origem_id UUID REFERENCES criativos(id),

  -- Contexto usado na geração (snapshot do que o Max leu)
  contexto_usado JSONB NOT NULL DEFAULT '{}',
  -- Estrutura esperada:
  -- {
  --   "top_winners": [{ id, nome, angulo, roas, cpa, copy_primario, hook }],
  --   "top_falhas": [{ id, nome, angulo, motivo_morte }],
  --   "melhores_ruminacoes": [{ id, texto, ctr, trigger }],
  --   "melhores_conceitos": [{ id, nome, ice_score }],
  --   "patterns_vencedores": [{ combo, win_rate, avg_roas }],
  --   "patterns_evitar": [{ combo, win_rate, motivo }],
  --   "gaps_matriz": [{ angulo, formato, ice_score }],
  --   "geracoes_anteriores_resultado": [{ id, tipo, win_rate }]
  -- }

  -- Métricas da geração
  total_criativos_gerados INT NOT NULL DEFAULT 0,
  total_viraram_winner INT NOT NULL DEFAULT 0,
  total_mortos INT NOT NULL DEFAULT 0,
  total_em_teste INT NOT NULL DEFAULT 0,
  win_rate_geracao DECIMAL(5,2),  -- % de winners sobre testados

  -- Notas livres
  notas TEXT,

  -- Audit
  gerado_por VARCHAR(50) NOT NULL DEFAULT 'max',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- TABELA: geracoes_ia_itens (cada criativo gerado no lote)
-- Vincula criativo gerado ↔ lote ↔ winner origem
-- ────────────────────────────────────────────────────────────

CREATE TABLE geracoes_ia_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vínculo com o lote
  geracao_id UUID NOT NULL REFERENCES geracoes_ia(id) ON DELETE CASCADE,

  -- Criativo gerado
  criativo_id UUID REFERENCES criativos(id),

  -- Tipo de variação (para variacao_winner)
  variacao_tipo geracao_variacao_tipo,

  -- DNA: quais referências inspiraram este criativo
  referencias_usadas JSONB NOT NULL DEFAULT '{}',
  -- Estrutura esperada:
  -- {
  --   "winner_ref": { id, nome, roas, cpa },
  --   "ruminacao_ref": { id, texto, ctr },
  --   "conceito_ref": { id, nome, ice_score },
  --   "pattern_ref": { combo, win_rate }
  -- }

  -- Copy gerada (snapshot — mesmo que o criativo mude depois)
  copy_gerada JSONB NOT NULL DEFAULT '{}',
  -- Estrutura:
  -- {
  --   "hook": "...",
  --   "copy_titulo": "...",
  --   "copy_descricao": "...",
  --   "copy_primario": "...",
  --   "roteiro": "..."
  -- }

  -- Resultado de performance (atualizado conforme o criativo avança)
  resultado geracao_resultado NOT NULL DEFAULT 'pendente',
  cpa_final DECIMAL(10,2),
  roas_final DECIMAL(10,2),
  dias_ativo_final INT,
  total_spend_final DECIMAL(10,2),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────────────────

CREATE INDEX idx_geracoes_ia_tipo ON geracoes_ia(tipo);
CREATE INDEX idx_geracoes_ia_created ON geracoes_ia(created_at DESC);
CREATE INDEX idx_geracoes_ia_winner_origem ON geracoes_ia(winner_origem_id) WHERE winner_origem_id IS NOT NULL;

CREATE INDEX idx_geracoes_ia_itens_geracao ON geracoes_ia_itens(geracao_id);
CREATE INDEX idx_geracoes_ia_itens_criativo ON geracoes_ia_itens(criativo_id) WHERE criativo_id IS NOT NULL;
CREATE INDEX idx_geracoes_ia_itens_resultado ON geracoes_ia_itens(resultado);

-- ────────────────────────────────────────────────────────────
-- TRIGGERS
-- ────────────────────────────────────────────────────────────

-- Reutiliza a função update_updated_at() já criada na migration-creative-panel
CREATE TRIGGER set_updated_at_geracoes_ia
  BEFORE UPDATE ON geracoes_ia
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_geracoes_ia_itens
  BEFORE UPDATE ON geracoes_ia_itens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────────
-- FUNÇÃO: atualizar métricas da geração quando itens mudam
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION refresh_geracao_metrics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE geracoes_ia SET
    total_criativos_gerados = (
      SELECT COUNT(*) FROM geracoes_ia_itens WHERE geracao_id = COALESCE(NEW.geracao_id, OLD.geracao_id)
    ),
    total_viraram_winner = (
      SELECT COUNT(*) FROM geracoes_ia_itens
      WHERE geracao_id = COALESCE(NEW.geracao_id, OLD.geracao_id) AND resultado = 'winner'
    ),
    total_mortos = (
      SELECT COUNT(*) FROM geracoes_ia_itens
      WHERE geracao_id = COALESCE(NEW.geracao_id, OLD.geracao_id) AND resultado = 'morto'
    ),
    total_em_teste = (
      SELECT COUNT(*) FROM geracoes_ia_itens
      WHERE geracao_id = COALESCE(NEW.geracao_id, OLD.geracao_id) AND resultado = 'em_teste'
    ),
    win_rate_geracao = (
      SELECT
        CASE
          WHEN COUNT(*) FILTER (WHERE resultado IN ('winner', 'morto', 'pausado', 'saturado')) > 0
          THEN ROUND(
            COUNT(*) FILTER (WHERE resultado = 'winner')::DECIMAL /
            COUNT(*) FILTER (WHERE resultado IN ('winner', 'morto', 'pausado', 'saturado')) * 100,
            2
          )
          ELSE NULL
        END
      FROM geracoes_ia_itens
      WHERE geracao_id = COALESCE(NEW.geracao_id, OLD.geracao_id)
    )
  WHERE id = COALESCE(NEW.geracao_id, OLD.geracao_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_geracao_metrics_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON geracoes_ia_itens
  FOR EACH ROW EXECUTE FUNCTION refresh_geracao_metrics();

-- ────────────────────────────────────────────────────────────
-- RLS
-- ────────────────────────────────────────────────────────────

ALTER TABLE geracoes_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE geracoes_ia_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access geracoes_ia"
  ON geracoes_ia FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Anon read geracoes_ia"
  ON geracoes_ia FOR SELECT
  USING (true);

CREATE POLICY "Service role full access geracoes_ia_itens"
  ON geracoes_ia_itens FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Anon read geracoes_ia_itens"
  ON geracoes_ia_itens FOR SELECT
  USING (true);
