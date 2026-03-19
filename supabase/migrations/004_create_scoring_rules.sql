CREATE TABLE scoring_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  condition_type TEXT NOT NULL CHECK (condition_type IN ('product_type', 'specific_sku', 'category')),
  condition_value TEXT NOT NULL,
  points DECIMAL(10,2) NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scoring_rules_priority ON scoring_rules(priority DESC);

-- Default scoring rules
INSERT INTO scoring_rules (name, condition_type, condition_value, points, priority) VALUES
  ('Produto Embalado', 'product_type', 'embalado', 1.0, 0),
  ('Produto Desembalado', 'product_type', 'desembalado', 0.5, 0);
