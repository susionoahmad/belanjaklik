-- Personal Shopping Assistant Seed Data

-- 1. FULFILLMENT CHANNELS SEED
INSERT INTO fulfillment_channels (id, name, logo, description, type, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'Alfamind Store', 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=150', 'Toko Alfamind Resmi (Pengiriman cepat)', 'alfamind', true),
('22222222-2222-2222-2222-222222222222', 'Supermarket Lokal', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150', 'Supermarket terdekat dengan pilihan lengkap', 'supermarket', true),
('33333333-3333-3333-3333-333333333333', 'Pasar Tradisional', 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=150', 'Bahan segar & sayur segar langsung dari pasar', 'traditional_market', true),
('44444444-4444-4444-4444-444444444444', 'Minimarket Terdekat', 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=150', 'Belanja mendesak kebutuhan harian', 'minimarket', true)
ON CONFLICT (id) DO NOTHING;

-- 2. CATEGORIES SEED
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
('c1111111-1111-1111-1111-111111111111', 'Bahan Pokok & Sembako', 'bahan-pokok', 'shopping-bag', 1),
('c2222222-2222-2222-2222-222222222222', 'Minuman & Kopi', 'minuman', 'coffee', 2),
('c3333333-3333-3333-3333-333333333333', 'Makanan Ringan & Biskuit', 'snack', 'cookie', 3),
('c4444444-4444-4444-4444-444444444444', 'Susu & Olahan', 'susu', 'milk', 4),
('c5555555-5555-5555-5555-555555555555', 'Kebersihan & Sabun Cuci', 'kebersihan', 'sparkles', 5),
('c6666666-6666-6666-6666-666666666666', 'Perawatan Diri & Mandi', 'perawatan-diri', 'heart', 6)
ON CONFLICT (id) DO NOTHING;

-- 3. PRODUCTS SEED (Valid Hex UUIDs: 'f' prefix)
INSERT INTO products (id, category_id, name, slug, brand, barcode, description, unit, price, promo_price, is_promo, is_featured, is_popular, is_available, stock_status, image_url, search_keywords, weight) VALUES
('f1010101-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Indomie Goreng Spesial 85g', 'indomie-goreng-spesial-85g', 'Indomie', '899100110001', 'Mie instan goreng rasa spesial terfavorit keluarga Indonesia.', 'bungkus', 3100, 2900, true, true, true, true, 'in_stock', 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', 'mie instant goreng lezat indofood', '85g'),
('f1010102-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Minyak Goreng Bimoli 2 Litur Pouch', 'minyak-goreng-bimoli-2l', 'Bimoli', '899100220002', 'Minyak goreng kelapa sawit murni kualitas emas.', 'pouch', 38500, 34900, true, true, true, true, 'in_stock', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400', 'minyak goreng kelapa sawit bimoli pouch 2l', '2L'),
('f1010103-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Beras Sania Premium 5kg', 'beras-sania-premium-5kg', 'Sania', '899100330003', 'Beras putih pulen kualitas premium dan bersih.', 'karung', 74000, 69900, true, true, false, true, 'in_stock', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', 'beras putih pulen 5kg sania', '5kg'),
('f1010104-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Gula Pasir Gulaku Hijau 1kg', 'gula-pasir-gulaku-hijau-1kg', 'Gulaku', '899100440004', 'Gula pasir tebu murni bersih dan manis alami.', 'kg', 17500, 16800, true, false, true, true, 'in_stock', 'https://images.unsplash.com/photo-1622484210800-8851039289bb?w=400', 'gula tebu gula pasir murni gulaku 1kg', '1kg'),
('f2020201-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'Aqua Air Mineral 600ml Botol', 'aqua-600ml', 'Aqua', '899200110001', 'Air minum mineral pegunungan alami botol 600ml.', 'botol', 3500, 3000, true, true, true, true, 'in_stock', 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400', 'air mineral aqua botol seger 600ml', '600ml'),
('f2020202-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'Kapal Api Kopi Bubuk Spesial 165g', 'kapal-api-kopi-bubuk-165g', 'Kapal Api', '899200220002', 'Kopi murni harum dan mantap dari biji kopi pilihan.', 'bungkus', 15500, 14200, true, false, true, true, 'in_stock', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400', 'kopi hitam murni kapal api 165g', '165g'),
('f3030301-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'Chitato Sapi Panggang 68g', 'chitato-sapi-panggang-68g', 'Chitato', '899300110001', 'Keripik kentang bergelombang dengan bumbu sapi panggang gurih.', 'bungkus', 11200, 9900, true, true, true, true, 'in_stock', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400', 'snack chitato sapi panggang kentang biskuit', '68g'),
('f4040401-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 'Ultra Milk Full Cream 1 Litur', 'ultra-milk-full-cream-1l', 'Ultra Milk', '899400110001', 'Susu UHT murni segar rasa full cream tinggi kalsium.', 'kotak', 21000, 18900, true, true, true, true, 'in_stock', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400', 'susu uht ultra milk full cream 1l', '1L'),
('f5050501-5555-5555-5555-555555555555', 'c5555555-5555-5555-5555-555555555555', 'Rinso Anti Noda Deterjen Bubuk 770g', 'rinso-anti-noda-770g', 'Rinso', '899500110001', 'Deterjen bubuk pembersih noda pakaian harum dan segar.', 'bungkus', 24500, 21900, true, false, true, true, 'in_stock', 'https://images.unsplash.com/photo-1585830812416-a6c86bb14576?w=400', 'deterjen sabun cuci rinso anti noda 770g', '770g'),
('f6060601-6666-6666-6666-666666666666', 'c6666666-6666-6666-6666-666666666666', 'Lifebuoy Sabun Mandi Cair Total 10 450ml', 'lifebuoy-total-10-450ml', 'Lifebuoy', '899600110001', 'Sabun mandi cair anti bakteri perlindungan total keluarga.', 'pouch', 26000, 22500, true, false, true, true, 'in_stock', 'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=400', 'sabun mandi cair lifebuoy total 10 pouch 450ml', '450ml')
ON CONFLICT (id) DO NOTHING;

-- 4. SHOPPING TEMPLATES SEED
INSERT INTO shopping_templates (id, name, slug, description, category, items, icon) VALUES
('d1111111-1111-1111-1111-111111111111', 'Paket Anak Kos Hemat', 'paket-anak-kos', 'Kebutuhan instan hemat untuk mahasiswa & anak kos', 'Hemat', '[{"product_name": "Indomie Goreng Spesial 85g", "quantity": 10, "default_price": 2900, "unit": "bungkus"}, {"product_name": "Aqua Air Mineral 600ml Botol", "quantity": 12, "default_price": 3000, "unit": "botol"}, {"product_name": "Kapal Api Kopi Bubuk Spesial 165g", "quantity": 1, "default_price": 14200, "unit": "bungkus"}]', 'sparkles'),
('d2222222-2222-2222-2222-222222222222', 'Paket Sembako Keluarga', 'paket-sembako-keluarga', 'Stok bahan pokok mingguan lengkap keluarga', 'Keluarga', '[{"product_name": "Beras Sania Premium 5kg", "quantity": 1, "default_price": 69900, "unit": "karung"}, {"product_name": "Minyak Goreng Bimoli 2 Litur Pouch", "quantity": 2, "default_price": 34900, "unit": "pouch"}, {"product_name": "Gula Pasir Gulaku Hijau 1kg", "quantity": 2, "default_price": 16800, "unit": "kg"}, {"product_name": "Indomie Goreng Spesial 85g", "quantity": 5, "default_price": 2900, "unit": "bungkus"}]', 'package'),
('d3333333-3333-3333-3333-333333333333', 'Paket Kebersihan Rumah', 'paket-kebersihan-rumah', 'Perlengkapan sabun cuci & pembersih mandi lengkap', 'Rumah', '[{"product_name": "Rinso Anti Noda Deterjen Bubuk 770g", "quantity": 2, "default_price": 21900, "unit": "bungkus"}, {"product_name": "Lifebuoy Sabun Mandi Cair Total 10 450ml", "quantity": 2, "default_price": 22500, "unit": "pouch"}]', 'shield')
ON CONFLICT (id) DO NOTHING;

-- 5. STORE SETTINGS SEED
INSERT INTO settings (key, value, description) VALUES
('store_profile', '{"name": "Toko Berkah Asisten Belanja", "phone": "6281234567890", "owner": "Budi Santoso", "address": "Jl. Raya Sembako No. 88, Jakarta South", "business_hours": "07:00 - 21:00 WIB", "delivery_info": "Pengiriman gratis radius 3 km dengan minimal pemesanan Rp 50.000"}', 'Profil toko & nomor kontak WhatsApp'),
('homepage_config', '{"show_banner_slider": true, "show_flash_sale": true, "show_weekly_promos": true, "show_quick_packages": true, "show_popular_products": true, "show_recently_viewed": true}', 'Konfigurasi seksi di halaman utama')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 6. PRODUCT IMPORT ENGINE SCHEMAS
CREATE TABLE IF NOT EXISTS import_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type VARCHAR(50) NOT NULL DEFAULT 'SCREENSHOT',
    uploaded_files JSONB DEFAULT '[]'::jsonb,
    total_products INT DEFAULT 0,
    duplicated_products INT DEFAULT 0,
    imported_products INT DEFAULT 0,
    processing_status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES import_sessions(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'Pending',
    current_stage VARCHAR(100),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS import_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES import_sessions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    raw_ocr_text TEXT,
    extracted_name VARCHAR(255),
    extracted_brand VARCHAR(100),
    extracted_price NUMERIC(12, 2),
    ai_corrected_name VARCHAR(255),
    ai_corrected_brand VARCHAR(100),
    confidence NUMERIC(5, 2),
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS import_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES import_sessions(id) ON DELETE CASCADE,
    result_id UUID REFERENCES import_results(id) ON DELETE CASCADE,
    extracted_data JSONB,
    match_data JSONB,
    ai_recommendations JSONB,
    status VARCHAR(50) DEFAULT 'NEEDS_REVIEW',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS import_audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID,
    stage_name VARCHAR(100),
    input_state JSONB,
    output_state JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS catalog_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_number INT NOT NULL,
    description TEXT,
    snapshot_data JSONB,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PRODUCT KNOWLEDGE ENGINE SCHEMAS
CREATE TABLE IF NOT EXISTS product_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    attribute_key VARCHAR(100) NOT NULL,
    attribute_value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_synonyms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    term VARCHAR(255) NOT NULL,
    alias VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    embedding_vector JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    target_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL,
    score NUMERIC(5, 4) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    keyword VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brand_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_name VARCHAR(100) UNIQUE NOT NULL,
    manufacturer VARCHAR(255),
    aliases JSONB DEFAULT '[]'::jsonb,
    category_focus VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS category_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(100) UNIQUE NOT NULL,
    shelf_group VARCHAR(100),
    subcategories JSONB DEFAULT '[]'::jsonb
);

