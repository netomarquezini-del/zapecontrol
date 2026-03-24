-- Meta Ads Account Daily Insights
CREATE TABLE IF NOT EXISTS meta_ads_account_insights (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  spend DECIMAL(12,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr DECIMAL(6,4) DEFAULT 0,
  cpc DECIMAL(10,2) DEFAULT 0,
  cpm DECIMAL(10,2) DEFAULT 0,
  reach INTEGER DEFAULT 0,
  frequency DECIMAL(6,2) DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  cost_per_purchase DECIMAL(10,2) DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  roas DECIMAL(8,4) DEFAULT 0,
  add_to_cart INTEGER DEFAULT 0,
  initiate_checkout INTEGER DEFAULT 0,
  landing_page_views INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_insights_date ON meta_ads_account_insights(date DESC);

-- Meta Ads Campaign Daily Insights
CREATE TABLE IF NOT EXISTS meta_ads_campaign_insights (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  status TEXT,
  objective TEXT,
  spend DECIMAL(12,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr DECIMAL(6,4) DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  cost_per_purchase DECIMAL(10,2) DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  roas DECIMAL(8,4) DEFAULT 0,
  frequency DECIMAL(6,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_insights_date ON meta_ads_campaign_insights(date DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_insights_campaign ON meta_ads_campaign_insights(campaign_id, date DESC);

-- Meta Ads Ad Daily Insights
CREATE TABLE IF NOT EXISTS meta_ads_ad_insights (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  ad_id TEXT NOT NULL,
  ad_name TEXT,
  campaign_id TEXT,
  campaign_name TEXT,
  adset_id TEXT,
  adset_name TEXT,
  status TEXT,
  spend DECIMAL(12,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr DECIMAL(6,4) DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  cost_per_purchase DECIMAL(10,2) DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  roas DECIMAL(8,4) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, ad_id)
);

CREATE INDEX IF NOT EXISTS idx_ad_insights_date ON meta_ads_ad_insights(date DESC);
CREATE INDEX IF NOT EXISTS idx_ad_insights_ad ON meta_ads_ad_insights(ad_id, date DESC);

-- RLS
ALTER TABLE meta_ads_account_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_ads_campaign_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_ads_ad_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON meta_ads_account_insights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON meta_ads_campaign_insights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON meta_ads_ad_insights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service write" ON meta_ads_account_insights FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service write" ON meta_ads_campaign_insights FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service write" ON meta_ads_ad_insights FOR ALL TO service_role USING (true);
