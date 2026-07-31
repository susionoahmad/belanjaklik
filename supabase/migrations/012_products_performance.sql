-- Migration 012: Add performance indexes for products table
-- Resolves Postgres 57014 statement timeout on homepage products query

-- 1. Composite index for deleted_at + created_at DESC
CREATE INDEX IF NOT EXISTS idx_products_deleted_at_created_at 
  ON products (deleted_at, created_at DESC);

-- 2. Partial index for active non-deleted products
CREATE INDEX IF NOT EXISTS idx_products_active_created_at 
  ON products (created_at DESC) 
  WHERE deleted_at IS NULL;

-- 3. Indexes for category filtering & lookup
CREATE INDEX IF NOT EXISTS idx_products_category_id 
  ON products (category_id);

CREATE INDEX IF NOT EXISTS idx_products_ext_code 
  ON products (external_product_code);

-- 4. Partial index for promo items
CREATE INDEX IF NOT EXISTS idx_products_is_promo 
  ON products (is_promo) 
  WHERE is_promo = TRUE;
