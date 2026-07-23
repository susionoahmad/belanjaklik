-- Personal Shopping Assistant - Enterprise DDD Setup Script
-- Supabase PostgreSQL (Schema + RLS + Seed Data)

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

-- 2. FULFILLMENT CHANNELS (CHANNEL REGISTRY ONLY)
CREATE TABLE IF NOT EXISTS fulfillment_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100),
  base_url TEXT,
  icon_url TEXT,
  description TEXT,
  settings JSONB DEFAULT '{"open_new_tab": true, "allow_cart": true, "show_price": true}',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure missing columns exist if table was created previously
ALTER TABLE fulfillment_channels ADD COLUMN IF NOT EXISTS slug VARCHAR(100);
ALTER TABLE fulfillment_channels ADD COLUMN IF NOT EXISTS base_url TEXT;
ALTER TABLE fulfillment_channels ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE fulfillment_channels ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE fulfillment_channels ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  channel_id UUID REFERENCES fulfillment_channels(id) ON DELETE SET NULL,
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
  stock_status VARCHAR(20) DEFAULT 'in_stock',
  thumbnail_url TEXT,
  image_url TEXT,
  search_keywords TEXT,
  weight VARCHAR(50),
  notes TEXT,
  purchase_method VARCHAR(50) NOT NULL DEFAULT 'owner_checkout', -- 'self_checkout' | 'owner_checkout' | 'quote_request' | 'coming_soon'
  external_product_code VARCHAR(100),
  images JSONB DEFAULT '[]',
  sort_order INT DEFAULT 0,
  price_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

-- SUPABASE STORAGE BUCKET SETUP
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public Read Product Images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'product-images');
CREATE POLICY "Public Upload Product Images" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'product-images');

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_channel ON products(channel_id);
CREATE INDEX IF NOT EXISTS idx_products_purchase_method ON products(purchase_method);

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
  status VARCHAR(30) DEFAULT 'sent_whatsapp',
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

-- 6. SHOPPING TEMPLATES
CREATE TABLE IF NOT EXISTS shopping_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'General',
  items JSONB NOT NULL DEFAULT '[]',
  icon VARCHAR(50) DEFAULT 'package',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PROMO FILES
CREATE TABLE IF NOT EXISTS promo_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(20) DEFAULT 'image',
  start_date DATE,
  end_date DATE,
  status VARCHAR(30) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SETTINGS
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ANALYTICS EVENTS (EVENT BUS LOGS)
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name VARCHAR(100) NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  channel_id UUID REFERENCES fulfillment_channels(id) ON DELETE SET NULL,
  purchase_method VARCHAR(50),
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PRODUCT SOURCES (TOKO SAYA SYNC ENGINE)
CREATE TABLE IF NOT EXISTS product_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  provider VARCHAR(50) NOT NULL DEFAULT 'tokosaya',
  external_product_code VARCHAR(100) NOT NULL,
  sync_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'synced' | 'failed' | 'paused'
  last_synced_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  sync_interval_hours INT DEFAULT 24,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Product Sources" ON product_sources;
DROP POLICY IF EXISTS "Admin Full Access Product Sources" ON product_sources;
DROP POLICY IF EXISTS "Public Full Access Product Sources Demo" ON product_sources;

CREATE POLICY "Public Read Product Sources" ON product_sources FOR SELECT TO public USING (true);
CREATE POLICY "Admin Full Access Product Sources" ON product_sources FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access Product Sources Demo" ON product_sources FOR ALL TO public USING (true) WITH CHECK (true);

-- RLS POLICIES (PUBLIC READ & AUTHENTICATED ADMIN WRITE)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillment_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ
CREATE POLICY "Public Read Categories" ON categories FOR SELECT TO public USING (true);
CREATE POLICY "Public Read Fulfillment Channels" ON fulfillment_channels FOR SELECT TO public USING (true);
CREATE POLICY "Public Read Active Products" ON products FOR SELECT TO public USING (deleted_at IS NULL);
CREATE POLICY "Public Read Shopping Templates" ON shopping_templates FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Public Read Active Promo Files" ON promo_files FOR SELECT TO public USING (status = 'active');
CREATE POLICY "Public Read Settings" ON settings FOR SELECT TO public USING (true);
CREATE POLICY "Public Insert Shopping Requests" ON shopping_requests FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public Insert Shopping Request Items" ON shopping_request_items FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public Insert Analytics Events" ON analytics_events FOR INSERT TO public WITH CHECK (true);

-- ADMIN FULL ACCESS
CREATE POLICY "Admin Full Access Products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access Categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access Fulfillment Channels" ON fulfillment_channels FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access Shopping Templates" ON shopping_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access Settings" ON settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access Analytics Events" ON analytics_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SEED FULFILLMENT CHANNELS
INSERT INTO fulfillment_channels (id, name, slug, base_url, icon_url, description, is_active, sort_order) VALUES
('11111111-1111-1111-1111-111111111111', 'Alfamind Official', 'alfamind-official', 'https://tokosaya.alfamind.id/product/', 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=150', 'Toko Resmi Alfamind - Beli Langsung di App/Web Alfamind', true, 1),
('22222222-2222-2222-2222-222222222222', 'Alfamind Grocery', 'alfamind-grocery', NULL, 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150', 'Asisten Belanja Sembako Alfamind diproses Store Owner', true, 2),
('33333333-3333-3333-3333-333333333333', 'Pasar Tradisional', 'pasar-tradisional', NULL, 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=150', 'Bahan Segar & Sayuran Langsung dari Pasar', true, 3),
('44444444-4444-4444-4444-444444444444', 'Shopee Official Store', 'shopee-official', 'https://shopee.co.id/product/', 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=150', 'Official Marketplace Shopee Partner', true, 4),
('55555555-5555-5555-5555-555555555555', 'Tokopedia Store', 'tokopedia-store', 'https://tokopedia.com/product/', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150', 'Tokopedia Merchant Channel', true, 5)
ON CONFLICT (id) DO NOTHING;

-- SEED CATEGORIES
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
('c1111111-1111-1111-1111-111111111111', 'Alfamart (Sembako)', 'alfamart-sembako', 'shopping-bag', 1),
('c2222222-2222-2222-2222-222222222222', 'Promo Merchant', 'promo-merchant', 'percent', 2),
('10000000-0000-0000-0000-000000000003', 'DAN+DAN', 'dan-dan', 'sparkles', 3),
('10000000-0000-0000-0000-000000000004', 'Fashion', 'fashion', 'shirt', 4),
('10000000-0000-0000-0000-000000000005', 'Peralatan Masak', 'peralatan-masak', 'utensils-crossed', 5),
('c4444444-4444-4444-4444-444444444444', 'Gadget & Elektronik', 'gadget-elektronik', 'tv', 6),
('10000000-0000-0000-0000-000000000007', 'Aksesori & Perhiasan', 'aksesori-perhiasan', 'watch', 7),
('10000000-0000-0000-0000-000000000008', 'Buku, Mainan & Edukasi', 'buku-mainan-edukasi', 'book-open', 8),
('10000000-0000-0000-0000-000000000009', 'Perlengkapan Ibadah', 'perlengkapan-ibadah', 'heart', 9),
('c6666666-6666-6666-6666-666666666666', 'Health & Beauty', 'health-beauty', 'heart-pulse', 10),
('10000000-0000-0000-0000-000000000011', 'Ibu dan Anak', 'ibu-dan-anak', 'baby', 11),
('c3333333-3333-3333-3333-333333333333', 'Makanan & Minuman', 'makanan-minuman', 'coffee', 12),
('10000000-0000-0000-0000-000000000013', 'Peralatan Makan & Minum', 'peralatan-makan-minum', 'coffee', 13),
('c5555555-5555-5555-5555-555555555555', 'Peralatan Rumah Tangga', 'peralatan-rumah-tangga', 'home', 14),
('10000000-0000-0000-0000-000000000015', 'Hobby & Olahraga', 'hobby-olahraga', 'activity', 15),
('10000000-0000-0000-0000-000000000016', 'Tas & Dompet', 'tas-dompet', 'briefcase', 17),
('10000000-0000-0000-0000-000000000017', 'Produk KOTA', 'produk-kota', 'building', 17),
('10000000-0000-0000-0000-000000000018', 'DEPO Grosir', 'depo-grosir', 'package', 18),
('10000000-0000-0000-0000-000000000019', 'Produk Virtual (PPOB)', 'produk-virtual-ppob', 'smartphone', 19)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

-- SEED PRODUCTS (WITH DIFFERING PURCHASE METHODS)
INSERT INTO products (id, category_id, channel_id, name, slug, brand, barcode, description, unit, price, promo_price, is_promo, is_featured, is_popular, is_available, stock_status, image_url, search_keywords, weight, purchase_method, external_product_code) VALUES
-- Owner Checkout Products (Groceries)
('f1010101-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Indomie Goreng Spesial 85g', 'indomie-goreng-spesial-85g', 'Indomie', '899100110001', 'Mie instan goreng rasa spesial terfavorit keluarga Indonesia.', 'bungkus', 3100, 2900, true, true, true, true, 'in_stock', 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', 'mie instant goreng lezat indofood', '85g', 'owner_checkout', NULL),
('f1010102-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Minyak Goreng Bimoli 2 Litur Pouch', 'minyak-goreng-bimoli-2l', 'Bimoli', '899100220002', 'Minyak goreng kelapa sawit murni kualitas emas.', 'pouch', 38500, 34900, true, true, true, true, 'in_stock', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400', 'minyak goreng kelapa sawit bimoli pouch 2l', '2L', 'owner_checkout', NULL),
('f1010103-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Beras Sania Premium 5kg', 'beras-sania-premium-5kg', 'Sania', '899100330003', 'Beras putih pulen kualitas premium dan bersih.', 'karung', 74000, 69900, true, true, false, true, 'in_stock', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', 'beras putih pulen 5kg sania', '5kg', 'owner_checkout', NULL),

-- Self Checkout Products (Alfamind Main / External Store Links)
('f4040401-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Cosmos Rice Cooker Digital 1.8L CRJ-3201', 'cosmos-rice-cooker-crj3201', 'Cosmos', '899400110001', 'Penanak nasi serbaguna anti lengket hemat listrik.', 'unit', 349000, 299000, true, true, true, true, 'in_stock', 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400', 'rice cooker cosmos penanak nasi magic com', '2kg', 'self_checkout', 'CRJ3201-ALFA'),
('f4040402-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Blender Philips HR2115 Glass 2L', 'blender-philips-hr2115', 'Philips', '899400220002', 'Blender pisau pro-blend 5 kecepatan tinggi.', 'unit', 580000, 529000, true, true, true, true, 'in_stock', 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400', 'blender philips hr2115 kaca jus', '3kg', 'self_checkout', 'HR2115-SHOPEE'),

-- Quote Request Products (Custom Wholesale / Bulk B2B)
('f5050501-5555-5555-5555-555555555555', 'c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Paket Daging Sapi Lokal Segar 10kg Grosir', 'paket-daging-sapi-grosir-10kg', 'Pasar Segar', '899500110001', 'Daging sapi kualitas pilihan langsung dari jagal pasar.', 'paket', 1200000, 1150000, true, false, true, true, 'in_stock', 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400', 'daging sapi grosir katering pasar', '10kg', 'quote_request', NULL),

-- Coming Soon Products
('f6060601-6666-6666-6666-666666666666', 'c4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Smart TV LED 43 Inch 4K Ultra HD 2026 Edition', 'smart-tv-43-inch-4k-2026', 'Polytron', '899600110001', 'Televisi pintar generasi terbaru edisi khusus 2026.', 'unit', 4200000, NULL, false, true, false, true, 'in_stock', 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400', 'tv pintar smart tv 43 inch polytron 4k', '8kg', 'coming_soon', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO shopping_templates (id, name, slug, description, category, items, icon) VALUES
('d1111111-1111-1111-1111-111111111111', 'Paket Anak Kos Hemat', 'paket-anak-kos', 'Kebutuhan instan hemat untuk mahasiswa & anak kos', 'Hemat', '[{"product_name": "Indomie Goreng Spesial 85g", "quantity": 10, "default_price": 2900, "unit": "bungkus"}]', 'sparkles')
ON CONFLICT (id) DO NOTHING;

INSERT INTO settings (key, value, description) VALUES
('store_profile', '{"name": "Toko Berkah Asisten Belanja", "phone": "6281234567890", "owner": "Budi Santoso", "address": "Jl. Raya Sembako No. 88, Jakarta South", "business_hours": "07:00 - 21:00 WIB", "delivery_info": "Pengiriman gratis radius 3 km dengan minimal pemesanan Rp 50.000"}', 'Profil toko & nomor kontak WhatsApp')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
