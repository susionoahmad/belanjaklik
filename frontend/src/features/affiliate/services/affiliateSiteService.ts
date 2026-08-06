import { supabase, isSupabaseConfigured } from '@/features/shared/db/supabaseClient';

export interface AffiliateSiteConfig {
  site_id: string;
  hostname: string;
  site_url: string;
  is_active: boolean;
}

const normaliseHostname = (hostname: string): string =>
  hostname.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');

function getEnvSiteMap(): Record<string, string> {
  const raw = import.meta.env.VITE_ACCESSTRADE_SITE_MAP || '';
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function resolveAffiliateSite(hostname?: string): Promise<AffiliateSiteConfig | null> {
  const currentHostname = normaliseHostname(
    hostname || (typeof window !== 'undefined' ? window.location.hostname : '')
  );
  if (!currentHostname) return null;

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('affiliate_sites')
      .select('site_id,hostname,site_url,is_active')
      .eq('hostname', currentHostname)
      .eq('is_active', true)
      .maybeSingle();
    if (!error && data) return data as AffiliateSiteConfig;
  }

  const envMap = getEnvSiteMap();
  const siteId = envMap[currentHostname] ||
    (currentHostname === normaliseHostname(import.meta.env.VITE_SITE_URL || '')
      ? import.meta.env.VITE_ACCESSTRADE_SITE_ID
      : '');

  return siteId ? {
    site_id: String(siteId),
    hostname: currentHostname,
    site_url: `https://${currentHostname}`,
    is_active: true
  } : null;
}
