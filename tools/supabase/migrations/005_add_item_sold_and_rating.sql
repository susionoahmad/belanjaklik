-- Migration 005: Add top-level item_sold and item_rating columns with index & backfill
ALTER TABLE affiliate_products 
  ADD COLUMN IF NOT EXISTS item_sold INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS item_rating NUMERIC(3,2) DEFAULT NULL;

-- Create index on item_sold for performant sorting
CREATE INDEX IF NOT EXISTS idx_affiliate_products_item_sold ON affiliate_products(item_sold DESC NULLS LAST);

-- Backfill data from raw_data JSONB for existing products
UPDATE affiliate_products
SET 
  item_sold = COALESCE((raw_data->>'item_sold')::int, 0),
  item_rating = NULLIF((raw_data->>'item_rating')::numeric, 0)
WHERE raw_data IS NOT NULL;
