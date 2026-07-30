import type { AffiliateProduct } from '../types';

function decodeRepeatedly(value: string): string {
  let decoded = value;
  for (let i = 0; i < 5; i++) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

/**
 * Clean out unparsed tracking template tags like {clickid}, {psn}, or trailing ampersands.
 */
export function cleanTrackingUrl(url: string): string {
  if (!url) return '';
  let cleaned = url.trim();
  cleaned = cleaned.replace(/[\?&][^=]+=\{[^}]*\}/g, '');
  cleaned = cleaned.replace(/[\?&]subId1=\{clickid\}/gi, '');
  cleaned = cleaned.replace(/[\?&]sharedid=\{psn\}/gi, '');
  cleaned = cleaned.replace(/[\?&]utm_campaign=\{psn\}/gi, '');
  cleaned = cleaned.replace(/\?&/g, '?').replace(/&&/g, '&').replace(/[\?&]$/, '');
  return cleaned;
}

/**
 * Extracts the true merchant product page URL (blibli.com, shopee.co.id, tokopedia.com, lazada.co.id, tiktok.com, traveloka.com)
 * from any raw URL, intermediate tracking redirect (atid.me, pxf.io, pxfl.io, etc.), or nested query parameters.
 */
export function extractCleanMerchantProductUrl(inputUrl?: string | null): string | null {
  if (!inputUrl) return null;
  const decoded = decodeRepeatedly(inputUrl.trim());

  // Regex targeting clean merchant product page URLs
  const merchantRegex = /https?:\/\/(?:[a-zA-Z0-9-]+\.)?(?:blibli\.com|shopee\.co\.id|tokopedia\.com|lazada\.co\.id|tiktok\.com|traveloka\.com)\/[^\s&"'>]+/i;
  const match = decoded.match(merchantRegex);
  if (!match) return null;

  let cleanUrl = match[0];

  try {
    const urlObj = new URL(cleanUrl);
    const paramsToClean: string[] = [];
    urlObj.searchParams.forEach((val, key) => {
      if (val.includes('{') || val.includes('}')) {
        paramsToClean.push(key);
      }
    });
    paramsToClean.forEach(k => urlObj.searchParams.delete(k));
    return urlObj.toString();
  } catch {
    return cleanUrl;
  }
}

/**
 * Resolves the final affiliate tracking URL for a product.
 * - Blibli: Resolves to direct clean Blibli product URL (e.g. https://www.blibli.com/p/...) to guarantee landing on Blibli and NEVER atid.me OK / 404.
 * - Shopee, Tokopedia, Lazada, TikTok Shop, Traveloka: Preserves original affiliate_url AS-IS.
 */
export async function resolveProductAffiliateUrl(product: AffiliateProduct): Promise<string> {
  const merchant = (product.merchant || '').toLowerCase();
  const prodUrl = product.product_url?.trim() || '';
  const affUrl = product.affiliate_url?.trim() || '';

  const cleanMerchantUrl = extractCleanMerchantProductUrl(prodUrl) || extractCleanMerchantProductUrl(affUrl);

  const isBlibli = merchant === 'blibli' || 
    (prodUrl && prodUrl.toLowerCase().includes('blibli')) || 
    (affUrl && affUrl.toLowerCase().includes('blibli'));

  if (isBlibli) {
    // 1. Direct clean Blibli product page URL (https://www.blibli.com/p/...) is HIGHEST PRIORITY.
    // This guarantees that the user opens the actual Blibli product page and NEVER gets stuck on atid.me OK!
    if (cleanMerchantUrl) {
      return cleanMerchantUrl;
    }

    // 2. If affUrl is a valid pxf.io link without template tags
    if (affUrl && (affUrl.includes('blibli.pxf.io') || affUrl.includes('pxf.io'))) {
      const cleanedAff = cleanTrackingUrl(affUrl);
      if (cleanedAff && cleanedAff.startsWith('http') && !cleanedAff.includes('{clickid}')) {
        return cleanedAff;
      }
    }

    // 3. Fallback to prodUrl if not atid.me
    if (prodUrl && prodUrl.startsWith('http') && !prodUrl.toLowerCase().includes('atid.me')) {
      return prodUrl;
    }

    // 4. Fallback to cleaned affUrl ONLY if it does NOT contain atid.me
    const cleanedAff = cleanTrackingUrl(affUrl);
    if (cleanedAff && !cleanedAff.toLowerCase().includes('atid.me')) {
      return cleanedAff;
    }

    // STRICT SAFETY: NEVER return atid.me!
    return '';
  }

  // ALL OTHER MERCHANTS (Shopee, Tokopedia, Lazada, TikTok Shop, Traveloka, etc.):
  // Preserve affiliate_url AS-IS so native Shopee/Tokopedia/Lazada affiliate links NEVER break or 404!
  if (affUrl && !affUrl.toLowerCase().includes('atid.me')) {
    return cleanTrackingUrl(affUrl);
  }

  if (cleanMerchantUrl) {
    return cleanMerchantUrl;
  }

  return (prodUrl && !prodUrl.toLowerCase().includes('atid.me')) ? prodUrl : '';
}
