-- Tabel produk affiliate (Shopee, TikTok Shop, Tokopedia, dll via Accesstrade)
-- Jalankan di Supabase SQL Editor project belanjaklik kamu

create extension if not exists "pgcrypto";

create table if not exists affiliate_products (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'accesstrade',       -- accesstrade | manual | dst
  merchant text not null,                            -- 'shopee' | 'tiktok_shop' | 'tokopedia'
  campaign_id text not null,                         -- campaignId Accesstrade
  site_id text not null default 'legacy',              -- approved ACCESSTRADE Site ID
  site_url text,                                      -- approved traffic source URL
  external_product_id text,                          -- ID produk dari feed asal (untuk dedup)
  name text not null,
  description text,
  image_url text,
  product_url text,                                  -- link produk asli
  affiliate_url text not null,                        -- link tracking affiliate (yang dipromosikan)
  price numeric(12,2),
  original_price numeric(12,2),
  discount_percent numeric(5,2),
  commission_rate numeric(5,2),
  shop_name text,
  category text,
  is_active boolean not null default true,
  raw_data jsonb,                                     -- simpan payload asli dari feed, untuk debugging/reprocessing
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (merchant, campaign_id, external_product_id, site_id)
);

create index if not exists idx_affiliate_products_merchant on affiliate_products (merchant);
create index if not exists idx_affiliate_products_active on affiliate_products (is_active);
create index if not exists idx_affiliate_products_search on affiliate_products
  using gin (to_tsvector('simple', name || ' ' || coalesce(category, '')));

alter table affiliate_products enable row level security;

-- Publik hanya boleh baca produk yang aktif
create policy "public read active affiliate_products"
  on affiliate_products for select
  using (is_active = true);

-- Hanya service_role (dipakai Edge Function) yang boleh tulis/update
create policy "service role manage affiliate_products"
  on affiliate_products for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Tabel kecil untuk mencatat riwayat sync (opsional tapi berguna buat debug)
create table if not exists affiliate_sync_logs (
  id uuid primary key default gen_random_uuid(),
  merchant text not null,
  campaign_id text not null,
  status text not null,           -- success | error
  products_synced integer default 0,
  error_message text,
  created_at timestamptz not null default now()
);
alter table affiliate_sync_logs enable row level security;
create policy "service role manage affiliate_sync_logs"
  on affiliate_sync_logs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');


