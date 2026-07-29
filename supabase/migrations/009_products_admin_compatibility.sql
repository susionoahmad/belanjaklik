-- Keep the products table compatible with the Admin Product Modal and Product Import Engine.
-- Safe to run on databases that already contain these columns.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES fulfillment_channels(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS purchase_method VARCHAR(50) NOT NULL DEFAULT 'owner_checkout',
  ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS external_product_code TEXT;

CREATE INDEX IF NOT EXISTS idx_products_channel_id ON products(channel_id);
CREATE INDEX IF NOT EXISTS idx_products_external_product_code ON products(external_product_code);
