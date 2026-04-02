CREATE TABLE IF NOT EXISTS cron_status (
  name TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pausado',
  schedule TEXT DEFAULT '',
  schedule_label TEXT DEFAULT '',
  command TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS but allow anon read
ALTER TABLE cron_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON cron_status FOR SELECT USING (true);
CREATE POLICY "Allow service write" ON cron_status FOR ALL USING (auth.role() = 'service_role');
