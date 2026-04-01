-- 013_add_ticto_bump_columns.sql
-- Add missing columns for order bumps, upsells, and downsells in ticto_sales

ALTER TABLE public.ticto_sales ADD COLUMN IF NOT EXISTS is_bump boolean DEFAULT false;
ALTER TABLE public.ticto_sales ADD COLUMN IF NOT EXISTS is_upsell boolean DEFAULT false;
ALTER TABLE public.ticto_sales ADD COLUMN IF NOT EXISTS is_downsell boolean DEFAULT false;
ALTER TABLE public.ticto_sales ADD COLUMN IF NOT EXISTS offer_name text;
ALTER TABLE public.ticto_sales ADD COLUMN IF NOT EXISTS offer_code text;
ALTER TABLE public.ticto_sales ADD COLUMN IF NOT EXISTS product_id text;
ALTER TABLE public.ticto_sales ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE public.ticto_sales ADD COLUMN IF NOT EXISTS customer_document text;
ALTER TABLE public.ticto_sales ADD COLUMN IF NOT EXISTS commission numeric(12,2);
ALTER TABLE public.ticto_sales ADD COLUMN IF NOT EXISTS net_amount numeric(12,2);
ALTER TABLE public.ticto_sales ADD COLUMN IF NOT EXISTS item_price numeric(12,2);
ALTER TABLE public.ticto_sales ADD COLUMN IF NOT EXISTS order_total numeric(12,2);
ALTER TABLE public.ticto_sales ADD COLUMN IF NOT EXISTS parent_product text;
ALTER TABLE public.ticto_sales ADD COLUMN IF NOT EXISTS card_brand text;

-- Update unique constraint to include is_bump (bumps have same order_id but different product)
ALTER TABLE public.ticto_sales DROP CONSTRAINT IF EXISTS ticto_sales_order_id_status_key;
ALTER TABLE public.ticto_sales ADD CONSTRAINT ticto_sales_order_id_status_product_bump_key
  UNIQUE (order_id, status, product_name, is_bump);

-- Index for bump queries
CREATE INDEX IF NOT EXISTS idx_ticto_sales_bump ON public.ticto_sales(is_bump) WHERE is_bump = true;
