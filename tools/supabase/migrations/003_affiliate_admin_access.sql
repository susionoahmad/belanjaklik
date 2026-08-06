-- 003_affiliate_admin_access.sql
-- Allow full access to affiliate_products for anon/authenticated roles for admin management

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'affiliate_products' and policyname = 'public manage affiliate_products'
  ) then
    create policy "public manage affiliate_products"
      on affiliate_products for all
      using (true)
      with check (true);
  end if;
end $$;
