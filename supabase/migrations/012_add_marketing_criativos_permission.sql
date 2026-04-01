-- 012_add_marketing_criativos_permission.sql
-- Add marketing.criativos permission to relevant role templates

-- Add to admin template
UPDATE role_templates
SET permissions = permissions || '["marketing.criativos"]'::jsonb,
    updated_at = NOW()
WHERE slug = 'admin'
  AND NOT permissions @> '"marketing.criativos"';

-- Add to gerente template
UPDATE role_templates
SET permissions = permissions || '["marketing.criativos"]'::jsonb,
    updated_at = NOW()
WHERE slug = 'gerente'
  AND NOT permissions @> '"marketing.criativos"';

-- Update existing admin users to include new permission
UPDATE app_users
SET permissions = permissions || '["marketing.criativos"]'::jsonb
WHERE role = 'admin'
  AND NOT permissions @> '"marketing.criativos"';

-- Update existing gerente users to include new permission
UPDATE app_users
SET permissions = permissions || '["marketing.criativos"]'::jsonb
WHERE role = 'gerente'
  AND NOT permissions @> '"marketing.criativos"';
