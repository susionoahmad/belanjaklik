-- MVP ACCESSTRADE verticals: marketplace, travel, and digital.
-- Finance is intentionally excluded from the public MVP until lead/disclaimer flow is ready.
ALTER TABLE affiliate_products
  ADD COLUMN IF NOT EXISTS vertical TEXT NOT NULL DEFAULT 'marketplace',
  ADD COLUMN IF NOT EXISTS subcategory TEXT,
  ADD COLUMN IF NOT EXISTS offer_type TEXT NOT NULL DEFAULT 'product',
  ADD COLUMN IF NOT EXISTS campaign_name TEXT,
  ADD COLUMN IF NOT EXISTS advertiser_name TEXT;

ALTER TABLE affiliate_products DROP CONSTRAINT IF EXISTS affiliate_products_vertical_check;
ALTER TABLE affiliate_products ADD CONSTRAINT affiliate_products_vertical_check
  CHECK (vertical IN ('marketplace', 'travel', 'digital'));

CREATE INDEX IF NOT EXISTS idx_affiliate_products_vertical ON affiliate_products(vertical);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_vertical_subcategory ON affiliate_products(vertical, subcategory);
