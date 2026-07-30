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
 * - Blibli: Resolves to direct clean Blibli product URL (or clean tracking link) to avoid 404 / atid.me OK errors.
 * - Shopee, Tokopedia, Lazada, TikTok Shop, Traveloka: Preserves original affiliate_url AS-IS.
 */
export async function resolveProductAffiliateUrl(product: AffiliateProduct): Promise<string> {
  const merchant = (product.merchant || '').toLowerCase();
  const prodUrl = product.product_url?.trim() || '';
  const affUrl = product.affiliate_url?.trim() || '';

  const isBlibli = merchant === 'blibli' || 
    (prodUrl && prodUrl.toLowerCase().includes('blibli')) || 
    (affUrl && affUrl.toLowerCase().includes('blibli'));

  // Special handling ONLY for Blibli to fix atid.me / pxf.io 404 issues
  if (isBlibli) {
    const cleanMerchantUrl = extractCleanMerchantProductUrl(prodUrl) || extractCleanMerchantProductUrl(affUrl);
    if (cleanMerchantUrl) {
      return cleanMerchantUrl;
    }
    if (prodUrl && prodUrl.startsWith('http') && !prodUrl.toLowerCase().includes('atid.me')) {
      return prodUrl;
    }
    const cleanedAff = cleanTrackingUrl(affUrl);
    if (cleanedAff && !cleanedAff.toLowerCase().includes('atid.me')) {
      return cleanedAff;
    }
    return cleanMerchantUrl || prodUrl || affUrl;
  }

  // ALL OTHER MERCHANTS (Shopee, Tokopedia, Lazada, TikTok Shop, Traveloka, etc.):
  // Preserve affiliate_url AS-IS so native Shopee/Tokopedia/Lazada affiliate links NEVER break or 404!
  if (affUrl) {
    return cleanTrackingUrl(affUrl);
  }

  return prodUrl;
}
