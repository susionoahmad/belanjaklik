import type { AffiliateProduct } from '../types';
import { AccesstradeEngine } from './AccesstradeService';

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
  const merchantRegex = /https?:\/\/(?:www\.|m\.)?(?:blibli\.com|shopee\.co\.id|tokopedia\.com|lazada\.co\.id|tiktok\.com|traveloka\.com)\/[^\s&"'>]+/i;
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
 * ACCESSTRADE universal click tracker (accesstrade.co.id/click) returns 404 for Blibli products.
 * For Blibli products, it uses the cleaned tracking URL (pxf.io without template tags) or the clean direct Blibli product URL.
 * For other merchants, it wraps clean merchant URLs with ACCESSTRADE Site ID 127950.
 */
export async function resolveProductAffiliateUrl(product: AffiliateProduct): Promise<string> {
  const merchant = (product.merchant || '').toLowerCase();
  const prodUrl = product.product_url?.trim() || '';
  const affUrl = product.affiliate_url?.trim() || '';

  const cleanMerchantUrl = extractCleanMerchantProductUrl(prodUrl) || extractCleanMerchantProductUrl(affUrl);

  // Blibli Special Handling: ACCESSTRADE accesstrade.co.id/click returns 404 for Blibli.
  // We must bypass accesstrade.co.id/click wrapper for Blibli to prevent 404 errors.
  const isBlibli = merchant === 'blibli' || 
    (prodUrl && prodUrl.toLowerCase().includes('blibli')) || 
    (affUrl && affUrl.toLowerCase().includes('blibli'));

  if (isBlibli) {
    if (affUrl && (affUrl.includes('blibli.pxf.io') || affUrl.includes('pxf.io'))) {
      const cleanedAff = cleanTrackingUrl(affUrl);
      if (cleanedAff && cleanedAff.startsWith('http') && !cleanedAff.includes('{clickid}')) {
        return cleanedAff;
      }
    }
    if (cleanMerchantUrl) {
      return cleanMerchantUrl;
    }
    if (prodUrl && prodUrl.startsWith('http')) {
      return prodUrl;
    }
    return cleanTrackingUrl(affUrl) || affUrl;
  }

  // Standard handling for other merchants (Shopee, Tokopedia, Lazada, Traveloka, TikTok Shop)
  if (cleanMerchantUrl) {
    return AccesstradeEngine.convertToAffiliateUrl(cleanMerchantUrl);
  }

  if (affUrl && affUrl.toLowerCase().includes('accesstrade.co.id/click') && !affUrl.includes('{clickid}') && !affUrl.includes('%7Bclickid%7D')) {
    return affUrl;
  }

  if (prodUrl && prodUrl.startsWith('http')) {
    return AccesstradeEngine.convertToAffiliateUrl(prodUrl);
  }

  return cleanTrackingUrl(affUrl) || affUrl || prodUrl;
}
