-- 002_affiliate_slug_clicks.sql
-- Migrasi tambahan untuk affiliate_products & affiliate_clicks

-- 1. Tambah kolom slug pada affiliate_products
alter table affiliate_products
  add column if not exists slug text;

-- 2. Unique index untuk slug jika not null
create unique index if not exists idx_affiliate_products_slug
  on affiliate_products (slug) where slug is not null;

-- 3. Tabel pencatatan klik affiliate (affiliate_clicks)
create table if not exists affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references affiliate_products(id) on delete set null,
  clicked_at timestamptz not null default now()
);

-- 4. Enable RLS dan beri izin insert publik
alter table affiliate_clicks enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'affiliate_clicks' and policyname = 'public insert affiliate_clicks'
  ) then
    create policy "public insert affiliate_clicks"
      on affiliate_clicks for insert with check (true);
  end if;
end $$;
