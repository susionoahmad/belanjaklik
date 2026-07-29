-- Track the approved ACCESSTRADE traffic source for every affiliate link.
-- This prevents the same product from one campaign overwriting the link
-- belonging to another approved Site ID.

ALTER TABLE affiliate_products
  ADD COLUMN IF NOT EXISTS site_id TEXT,
  ADD COLUMN IF NOT EXISTS site_url TEXT;

-- Preserve a Site ID when it is already present in a tracking URL.
UPDATE affiliate_products
SET site_id = SUBSTRING(affiliate_url FROM '[?&]site_id=([^&]+)')
WHERE NULLIF(site_id, '') IS NULL
  AND affiliate_url ~ '[?&]site_id=';

-- Existing rows created before this migration are kept in one explicit bucket.
UPDATE affiliate_products
SET site_id = 'legacy'
WHERE NULLIF(site_id, '') IS NULL;

ALTER TABLE affiliate_products
  ALTER COLUMN site_id SET DEFAULT 'legacy',
  ALTER COLUMN site_id SET NOT NULL;

ALTER TABLE affiliate_products
  DROP CONSTRAINT IF EXISTS affiliate_products_merchant_campaign_id_external_product_id_key;

ALTER TABLE affiliate_products
  ADD CONSTRAINT affiliate_products_merchant_campaign_site_external_key
  UNIQUE (merchant, campaign_id, external_product_id, site_id);

CREATE INDEX IF NOT EXISTS idx_affiliate_products_site_id
  ON affiliate_products(site_id);

CREATE INDEX IF NOT EXISTS idx_affiliate_products_site_url
  ON affiliate_products(site_url);
