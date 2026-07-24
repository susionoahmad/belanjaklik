-- Personal Shopping Assistant Database Schema
-- Supabase PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(50) DEFAULT 'shopping-bag',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FULFILLMENT CHANNELS
CREATE TABLE IF NOT EXISTS fulfillment_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  logo VARCHAR(255),
  description TEXT,
  type VARCHAR(50) DEFAULT 'partner', -- 'alfamind', 'supermarket', 'traditional_market', 'minimarket', 'marketplace'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  brand VARCHAR(100),
  barcode VARCHAR(50),
  description TEXT,
  unit VARCHAR(50) DEFAULT 'pcs',
  price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  promo_price DECIMAL(12,2),
  is_promo BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_popular BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  stock_status VARCHAR(20) DEFAULT 'in_stock', -- 'in_stock', 'low_stock', 'out_of_stock'
  thumbnail_url TEXT,
  image_url TEXT,
  search_keywords TEXT,
  weight VARCHAR(50),
  notes TEXT,
  sort_order INT DEFAULT 0,
  promo_title VARCHAR(255),
  promo_start_date VARCHAR(50),
  promo_end_date VARCHAR(50),
  promo_badge VARCHAR(255),
  promo_type VARCHAR(50),
  price_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Migration for existing database instances
ALTER TABLE products ADD COLUMN IF NOT EXISTS promo_title VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS promo_start_date VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS promo_end_date VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS promo_badge VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS promo_type VARCHAR(50);

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_popular ON products(is_popular);
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('indonesian', coalesce(name, '') || ' ' || coalesce(brand, '') || ' ' || coalesce(search_keywords, '')));

-- 4. SHOPPING REQUESTS
CREATE TABLE IF NOT EXISTS shopping_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_notes TEXT,
  preferred_delivery_time VARCHAR(100),
  subtotal DECIMAL(12,2) DEFAULT 0.00,
  estimated_total DECIMAL(12,2) DEFAULT 0.00,
  fulfillment_channel_id UUID REFERENCES fulfillment_channels(id) ON DELETE SET NULL,
  status VARCHAR(30) DEFAULT 'sent_whatsapp', -- 'draft', 'sent_whatsapp', 'processing', 'completed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SHOPPING REQUEST ITEMS
CREATE TABLE IF NOT EXISTS shopping_request_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES shopping_requests(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  price DECIMAL(12,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit VARCHAR(50) DEFAULT 'pcs',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RELATED PRODUCTS (Frequently Bought Together)
CREATE TABLE IF NOT EXISTS related_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  related_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, related_product_id)
);

-- 7. SHOPPING TEMPLATES & PACKAGES
CREATE TABLE IF NOT EXISTS shopping_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'General',
  items JSONB NOT NULL DEFAULT '[]', -- Array of { product_name, quantity, default_price, unit }
  icon VARCHAR(50) DEFAULT 'package',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PROMO FILES (Brochures for OCR)
CREATE TABLE IF NOT EXISTS promo_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(20) DEFAULT 'image', -- 'pdf', 'image'
  start_date DATE,
  end_date DATE,
  status VARCHAR(30) DEFAULT 'active',
  ocr_status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SEARCH LOGS
CREATE TABLE IF NOT EXISTS search_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword VARCHAR(255) NOT NULL,
  result_count INT DEFAULT 0,
  session_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. FAVORITES
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(100) NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, product_id)
);

-- 11. CUSTOMER FEEDBACK
CREATE TABLE IF NOT EXISTS customer_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name VARCHAR(150),
  phone VARCHAR(50),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. STORE SETTINGS
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ANALYTICS VIEWS
CREATE OR REPLACE VIEW view_most_searched_products AS
SELECT keyword, COUNT(*) as search_count, MAX(created_at) as last_searched
FROM search_logs
GROUP BY keyword
ORDER BY search_count DESC;

CREATE OR REPLACE VIEW view_most_ordered_products AS
SELECT product_name, brand, COUNT(*) as order_frequency, SUM(quantity) as total_quantity
FROM shopping_request_items
GROUP BY product_name, brand
ORDER BY total_quantity DESC;

CREATE OR REPLACE VIEW view_top_categories AS
SELECT c.name as category_name, COUNT(p.id) as total_products
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.name
ORDER BY total_products DESC;

CREATE OR REPLACE VIEW view_daily_requests_summary AS
SELECT DATE(created_at) as request_date, COUNT(*) as total_requests, SUM(estimated_total) as total_estimated_value
FROM shopping_requests
GROUP BY DATE(created_at)
ORDER BY request_date DESC;

-- AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_shopping_requests_updated_at BEFORE UPDATE ON shopping_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS POLICIES
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillment_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public Read Fulfillment Channels" ON fulfillment_channels FOR SELECT USING (true);
CREATE POLICY "Public Read Active Products" ON products FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Public Insert Shopping Requests" ON shopping_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Shopping Request Items" ON shopping_request_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Shopping Templates" ON shopping_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Active Promo Files" ON promo_files FOR SELECT USING (status = 'active');
CREATE POLICY "Public Read Settings" ON settings FOR SELECT USING (true);
