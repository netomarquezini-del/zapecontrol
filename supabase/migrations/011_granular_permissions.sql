-- 011_granular_permissions.sql
-- Granular menu/submenu permission system + role templates
-- NOTE: app_users.permissions is JSONB (not text[])

-- Step 1: Create role_templates table
CREATE TABLE IF NOT EXISTS role_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  label       TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Seed system templates
INSERT INTO role_templates (slug, label, description, permissions, is_system) VALUES
  ('admin', 'Admin', 'Acesso total ao sistema', '["comercial.dashboard","comercial.acompanhamento","comercial.lancamentos","comercial.metas","comercial.cadastros","cs.monitor","cs.analytics","cs.consultores","cs.clientes","cs.comunidade","cs.shopee-ads","cs.healthscore","cs.relatorios","trafego.meta-ads","trafego.roas-real","trafego.vendas-ticto","trafego.transacoes","configuracoes.usuarios"]'::jsonb, true),
  ('gerente', 'Gerente', 'Acesso completo exceto configuracoes', '["comercial.dashboard","comercial.acompanhamento","comercial.lancamentos","comercial.metas","comercial.cadastros","cs.monitor","cs.analytics","cs.consultores","cs.clientes","cs.comunidade","cs.shopee-ads","cs.healthscore","cs.relatorios","trafego.meta-ads","trafego.roas-real","trafego.vendas-ticto","trafego.transacoes"]'::jsonb, true),
  ('closer', 'Closer', 'Acesso comercial basico', '["comercial.dashboard","comercial.acompanhamento","comercial.metas"]'::jsonb, true),
  ('sdr', 'SDR', 'Acesso SDR', '["comercial.dashboard","comercial.acompanhamento"]'::jsonb, true),
  ('visualizador', 'Visualizador', 'Apenas visualizar dashboards', '["comercial.dashboard"]'::jsonb, true)
ON CONFLICT (slug) DO NOTHING;

-- Step 3: Add role_template_id to app_users
ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS role_template_id UUID REFERENCES role_templates(id) ON DELETE SET NULL;

-- Step 4: Migrate existing flat permissions (jsonb array) to new dotted format
-- Build new permissions array from old flat values
UPDATE app_users SET permissions = (
  SELECT COALESCE(jsonb_agg(DISTINCT new_perm), '[]'::jsonb)
  FROM (
    SELECT jsonb_array_elements_text(
      CASE
        WHEN old_perm = 'dashboard' THEN '["comercial.dashboard"]'::jsonb
        WHEN old_perm = 'acompanhamento' THEN '["comercial.acompanhamento"]'::jsonb
        WHEN old_perm = 'lancamentos' THEN '["comercial.lancamentos"]'::jsonb
        WHEN old_perm = 'metas' THEN '["comercial.metas"]'::jsonb
        WHEN old_perm = 'cadastros' THEN '["comercial.cadastros"]'::jsonb
        WHEN old_perm = 'usuarios' THEN '["configuracoes.usuarios"]'::jsonb
        WHEN old_perm = 'diario' THEN '["comercial.dashboard"]'::jsonb
        WHEN old_perm = 'cs-monitor' THEN '["cs.monitor","cs.analytics","cs.consultores","cs.clientes","cs.comunidade","cs.shopee-ads","cs.healthscore","cs.relatorios","trafego.meta-ads","trafego.roas-real","trafego.vendas-ticto","trafego.transacoes"]'::jsonb
        ELSE jsonb_build_array(old_perm)
      END
    ) AS new_perm
    FROM jsonb_array_elements_text(app_users.permissions) AS old_perm
  ) sub
)
WHERE permissions IS NOT NULL AND jsonb_array_length(permissions) > 0;

-- Step 5: Link existing users to matching templates by role
UPDATE app_users SET role_template_id = (
  SELECT id FROM role_templates WHERE slug = app_users.role
)
WHERE role IN ('admin', 'gerente', 'closer', 'sdr', 'visualizador');

-- Step 6: RLS policies for role_templates
ALTER TABLE role_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_templates_select" ON role_templates
  FOR SELECT USING (true);

CREATE POLICY "role_templates_insert" ON role_templates
  FOR INSERT WITH CHECK (false);

CREATE POLICY "role_templates_update" ON role_templates
  FOR UPDATE USING (false);

CREATE POLICY "role_templates_delete" ON role_templates
  FOR DELETE USING (false);
