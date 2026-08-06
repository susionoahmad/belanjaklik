-- Migration 011: Create Promotion Campaign Engine tables
-- Supports Banner Slider, Campaign Landing pages, and Enterprise Promotion Engine

-- 1. Promotion Campaigns Table
CREATE TABLE IF NOT EXISTS promotion_campaigns (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subtitle TEXT,
  theme TEXT,
  description TEXT,
  terms_conditions TEXT,
  banner_image TEXT,
  mobile_banner TEXT,
  desktop_banner TEXT,
  start_date TEXT,
  end_date TEXT,
  campaign_type TEXT NOT NULL DEFAULT 'FAIR',
  priority INT NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  primary_color TEXT,
  secondary_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Promotion Products Table
CREATE TABLE IF NOT EXISTS promotion_products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  campaign_id TEXT REFERENCES promotion_campaigns(id) ON DELETE CASCADE,
  product_id TEXT,
  base_price NUMERIC,
  promo_price NUMERIC,
  discount_amount NUMERIC,
  discount_percentage NUMERIC,
  badge TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  product_name TEXT,
  product_brand TEXT,
  product_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Promotion Banners Table
CREATE TABLE IF NOT EXISTS promotion_banners (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  campaign_id TEXT REFERENCES promotion_campaigns(id) ON DELETE CASCADE,
  banner_type TEXT NOT NULL DEFAULT 'HOMEPAGE_SLIDER',
  image TEXT NOT NULL,
  alt_text TEXT,
  target_url TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for security
ALTER TABLE promotion_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_banners ENABLE ROW LEVEL SECURITY;

-- Public Read RLS Policies
DROP POLICY IF EXISTS "Public read promotion_campaigns" ON promotion_campaigns;
CREATE POLICY "Public read promotion_campaigns" ON promotion_campaigns FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read promotion_products" ON promotion_products;
CREATE POLICY "Public read promotion_products" ON promotion_products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read promotion_banners" ON promotion_banners;
CREATE POLICY "Public read promotion_banners" ON promotion_banners FOR SELECT USING (true);

-- Public Write RLS Policies
DROP POLICY IF EXISTS "Public write promotion_campaigns" ON promotion_campaigns;
CREATE POLICY "Public write promotion_campaigns" ON promotion_campaigns FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public write promotion_products" ON promotion_products;
CREATE POLICY "Public write promotion_products" ON promotion_products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public write promotion_banners" ON promotion_banners;
CREATE POLICY "Public write promotion_banners" ON promotion_banners FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_status ON promotion_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_slug ON promotion_campaigns(slug);
CREATE INDEX IF NOT EXISTS idx_promotion_products_campaign ON promotion_products(campaign_id);
CREATE INDEX IF NOT EXISTS idx_promotion_banners_campaign ON promotion_banners(campaign_id);

-- Seed Default Body Care Fair Campaign
INSERT INTO promotion_campaigns (
  id, title, slug, subtitle, description, banner_image, desktop_banner, mobile_banner, start_date, end_date, campaign_type, priority, status, primary_color, secondary_color, terms_conditions
) VALUES (
  'camp_body_care_2026',
  'Body Care Fair Special',
  'body-care-fair',
  'Hemat hingga 35% untuk produk perawatan tubuh & mandi pilihan',
  'Beli produk body care kesayangan keluarga dengan harga promo paling hemat minggu ini.',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600',
  '2026-07-16',
  '2026-08-15',
  'FAIR',
  10,
  'ACTIVE',
  '#e11d48',
  '#f43f5e',
  'Promo berlaku selama persediaan masih ada. Maksimal 3 pcs per pesanan.'
) ON CONFLICT (id) DO NOTHING;
