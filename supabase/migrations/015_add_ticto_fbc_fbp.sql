-- Add Facebook cookie columns for Meta CAPI user matching
-- _fbc = Facebook Click ID (cookie)
-- _fbp = Facebook Browser ID (cookie)
-- These improve Event Match Quality (EMQ) score from ~3 to ~7+

ALTER TABLE public.ticto_sales ADD COLUMN IF NOT EXISTS _fbc TEXT;
ALTER TABLE public.ticto_sales ADD COLUMN IF NOT EXISTS _fbp TEXT;
