CREATE TABLE production_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  production_date DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_production_entries_date ON production_entries(production_date);
CREATE INDEX idx_production_entries_product ON production_entries(product_id);
CREATE INDEX idx_production_entries_created_by ON production_entries(created_by);
