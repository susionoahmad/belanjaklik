-- Domain -> ACCESSTRADE Site ID mapping.
-- Satu database dapat dipakai beberapa domain/property yang telah disetujui.
CREATE TABLE IF NOT EXISTS affiliate_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id TEXT NOT NULL UNIQUE,
  hostname TEXT NOT NULL UNIQUE,
  site_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_sites_hostname_active
  ON affiliate_sites (hostname, is_active);

ALTER TABLE affiliate_sites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read active affiliate_sites" ON affiliate_sites;
CREATE POLICY "public read active affiliate_sites"
  ON affiliate_sites FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "service role manage affiliate_sites" ON affiliate_sites;
CREATE POLICY "service role manage affiliate_sites"
  ON affiliate_sites FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Site ID lama tetap menjadi mapping untuk domain Vercel.
INSERT INTO affiliate_sites (site_id, hostname, site_url)
VALUES ('127950', 'belanjaklik.vercel.app', 'https://belanjaklik.vercel.app')
ON CONFLICT (hostname) DO UPDATE SET
  site_id = EXCLUDED.site_id,
  site_url = EXCLUDED.site_url,
  updated_at = now();

-- Tambahkan Site ID domain custom setelah mengetahui Site ID yang disetujui:
-- INSERT INTO affiliate_sites (site_id, hostname, site_url)
-- VALUES ('SITE_ID_CUSTOM', 'belanjaklik.my.id', 'https://belanjaklik.my.id');
