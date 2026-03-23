-- Migration: vendas_diarias — registro simples de vendas diárias
-- Usado pela página /diario-registro

CREATE TABLE vendas_diarias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  closer_id INTEGER NOT NULL REFERENCES closers(id),
  valor DECIMAL(12,2) NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendas_diarias_data ON vendas_diarias(data DESC);
CREATE INDEX idx_vendas_diarias_closer ON vendas_diarias(closer_id);
CREATE INDEX idx_vendas_diarias_created ON vendas_diarias(created_at DESC);

-- RLS: allow anon to insert/read (external page, no auth)
ALTER TABLE vendas_diarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read vendas_diarias" ON vendas_diarias
  FOR SELECT USING (true);

CREATE POLICY "Allow anon insert vendas_diarias" ON vendas_diarias
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon delete vendas_diarias" ON vendas_diarias
  FOR DELETE USING (true);

CREATE POLICY "Allow service_role full access vendas_diarias" ON vendas_diarias
  FOR ALL USING (true) WITH CHECK (true);
