import type { AffiliateProduct } from '../types';
import { resolveAffiliateSite } from './affiliateSiteService';

function decodeRepeatedly(value: string): string {
  let result = value;
  for (let i = 0; i < 3; i++) {
    try {
      const decoded = decodeURIComponent(result);
      if (decoded === result) break;
      result = decoded;
    } catch {
      break;
    }
  }
  return result;
}

export function extractDestinationUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    for (const key of ['url', 'origin_link', 'redirect_url', 'u']) {
      const candidate = parsed.searchParams.get(key);
      if (candidate) {
        const decoded = decodeRepeatedly(candidate);
        if (/^https?:\/\//i.test(decoded)) return decoded;
      }
    }
  } catch {
    return null;
  }
  return /^https?:\/\//i.test(url) ? url : null;
}

export function createAccesstradeLink(destinationUrl: string, siteId: string, productId?: string): string {
  const subId = productId ? `belanjaklik_${productId}` : 'belanjaklik_app';
  return `https://accesstrade.co.id/click?site_id=${encodeURIComponent(siteId)}&url=${encodeURIComponent(destinationUrl)}&sub_id=${encodeURIComponent(subId)}`;
}

export async function resolveProductAffiliateUrl(product: AffiliateProduct): Promise<string> {
  const site = await resolveAffiliateSite();
  const storedUrl = product.affiliate_url?.trim() || '';
  const destinationUrl = extractDestinationUrl(product.product_url) ||
    (/(atid\\.me|accesstrade\\.co\\.id|at\\.accesstrade\\.co\\.id)/i.test(storedUrl)
      ? extractDestinationUrl(storedUrl)
      : null);

  if (!site?.site_id || !destinationUrl) return storedUrl;
  if (product.site_id && String(product.site_id) === String(site.site_id) && storedUrl) return storedUrl;

  return createAccesstradeLink(destinationUrl, site.site_id, product.id);
}


