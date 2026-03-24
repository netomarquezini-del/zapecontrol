-- 011_granular_permissions.sql
-- Granular menu/submenu permission system + role templates

-- Step 1: Create role_templates table
CREATE TABLE IF NOT EXISTS role_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  label       TEXT NOT NULL,
  description TEXT,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  is_system   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Seed system templates
INSERT INTO role_templates (slug, label, description, permissions, is_system) VALUES
  ('admin', 'Admin', 'Acesso total ao sistema', ARRAY[
    'comercial.dashboard','comercial.acompanhamento','comercial.lancamentos','comercial.metas','comercial.cadastros',
    'cs.monitor','cs.analytics','cs.consultores','cs.clientes','cs.comunidade','cs.shopee-ads','cs.healthscore','cs.relatorios',
    'trafego.meta-ads','trafego.roas-real','trafego.vendas-ticto','trafego.transacoes',
    'configuracoes.usuarios'
  ], true),
  ('gerente', 'Gerente', 'Acesso completo exceto configuracoes', ARRAY[
    'comercial.dashboard','comercial.acompanhamento','comercial.lancamentos','comercial.metas','comercial.cadastros',
    'cs.monitor','cs.analytics','cs.consultores','cs.clientes','cs.comunidade','cs.shopee-ads','cs.healthscore','cs.relatorios',
    'trafego.meta-ads','trafego.roas-real','trafego.vendas-ticto','trafego.transacoes'
  ], true),
  ('closer', 'Closer', 'Acesso comercial basico', ARRAY[
    'comercial.dashboard','comercial.acompanhamento','comercial.metas'
  ], true),
  ('sdr', 'SDR', 'Acesso SDR', ARRAY[
    'comercial.dashboard','comercial.acompanhamento'
  ], true),
  ('visualizador', 'Visualizador', 'Apenas visualizar dashboards', ARRAY[
    'comercial.dashboard'
  ], true)
ON CONFLICT (slug) DO NOTHING;

-- Step 3: Add role_template_id to app_users
ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS role_template_id UUID REFERENCES role_templates(id) ON DELETE SET NULL;

-- Step 4: Migrate existing flat permissions to new dotted format
-- Users with 'cs-monitor' get all CS + Trafego perms (preserving existing access)
UPDATE app_users SET permissions = (
  SELECT COALESCE(array_agg(DISTINCT new_perm), '{}') FROM (
    SELECT unnest(CASE
      WHEN old_perm = 'dashboard' THEN ARRAY['comercial.dashboard']
      WHEN old_perm = 'acompanhamento' THEN ARRAY['comercial.acompanhamento']
      WHEN old_perm = 'lancamentos' THEN ARRAY['comercial.lancamentos']
      WHEN old_perm = 'metas' THEN ARRAY['comercial.metas']
      WHEN old_perm = 'cadastros' THEN ARRAY['comercial.cadastros']
      WHEN old_perm = 'usuarios' THEN ARRAY['configuracoes.usuarios']
      WHEN old_perm = 'diario' THEN ARRAY['comercial.dashboard']
      WHEN old_perm = 'cs-monitor' THEN ARRAY[
        'cs.monitor','cs.analytics','cs.consultores','cs.clientes',
        'cs.comunidade','cs.shopee-ads','cs.healthscore','cs.relatorios',
        'trafego.meta-ads','trafego.roas-real','trafego.vendas-ticto','trafego.transacoes'
      ]
      ELSE ARRAY[old_perm]
    END) AS new_perm
    FROM unnest(app_users.permissions) AS old_perm
  ) sub
)
WHERE permissions IS NOT NULL AND array_length(permissions, 1) > 0;

-- Step 5: Link existing users to matching templates by role
UPDATE app_users SET role_template_id = (
  SELECT id FROM role_templates WHERE slug = app_users.role
)
WHERE role IN ('admin', 'gerente', 'closer', 'sdr', 'visualizador');

-- Step 6: RLS policies for role_templates
ALTER TABLE role_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can read templates
CREATE POLICY "role_templates_select" ON role_templates
  FOR SELECT USING (true);

-- Only service role can modify (API routes use service key)
CREATE POLICY "role_templates_insert" ON role_templates
  FOR INSERT WITH CHECK (false);

CREATE POLICY "role_templates_update" ON role_templates
  FOR UPDATE USING (false);

CREATE POLICY "role_templates_delete" ON role_templates
  FOR DELETE USING (false);
