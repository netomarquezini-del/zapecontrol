CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  daily_target DECIMAL(10,2),
  weekly_target DECIMAL(10,2),
  monthly_target DECIMAL(10,2),
  valid_from DATE NOT NULL,
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goals_product ON goals(product_id);
CREATE INDEX idx_goals_valid ON goals(valid_from, valid_until);
