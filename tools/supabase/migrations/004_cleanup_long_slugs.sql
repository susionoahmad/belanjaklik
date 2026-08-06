-- 004_cleanup_long_slugs.sql
-- Truncate existing excessively long slugs (>80 chars) in affiliate_products table for SEO and filesystem compatibility

UPDATE affiliate_products
SET slug = SUBSTRING(slug FROM 1 FOR 70) || '-' || SUBSTRING(id::text FROM 1 FOR 6)
WHERE length(slug) > 80;
