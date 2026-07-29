-- One ACCESSTRADE property may have more than one hostname alias.
ALTER TABLE affiliate_sites
  DROP CONSTRAINT IF EXISTS affiliate_sites_site_id_key;
-- Temporary consolidation: both public domains use the existing ACCESSTRADE
-- property Site ID 127950 while the property URL change is being reviewed.
INSERT INTO affiliate_sites (site_id, hostname, site_url, is_active)
VALUES ('127950', 'belanjaklik.my.id', 'https://belanjaklik.my.id', TRUE)
ON CONFLICT (hostname) DO UPDATE SET
  site_id = EXCLUDED.site_id,
  site_url = EXCLUDED.site_url,
  is_active = TRUE,
  updated_at = now();

