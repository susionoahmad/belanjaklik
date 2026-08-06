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
  cleaned = cleaned.replace(/[\?&]sub_id=\{[^}]*\}/gi, '');
  cleaned = cleaned.replace(/[\?&]subId1=\{[^}]*\}/gi, '');
  cleaned = cleaned.replace(/[\?&]sharedid=\{[^}]*\}/gi, '');
  cleaned = cleaned.replace(/[\?&]utm_campaign=\{[^}]*\}/gi, '');
  cleaned = cleaned.replace(/[\?&]goods_id=[\uFEFF\s]*\d+/gi, '');
  cleaned = cleaned.replace(/\?&/g, '?').replace(/&&/g, '&').replace(/[\?&]$/, '');

  if (cleaned.toLowerCase().includes('shope.ee/') || cleaned.toLowerCase().includes('s.shopee.co.id/')) {
    cleaned = cleaned.replace(/([?&])(?:subId|sub_id|clickid|utm_|smtt|af_)[^&]*/gi, '');
    cleaned = cleaned.replace(/\?&/g, '?').replace(/&&/g, '&').replace(/[\?&]$/, '');
  }

  return cleaned;
}

/**
 * Extracts the true merchant product page URL (blibli.com, shopee.co.id, shope.ee, tokopedia.com, lazada.co.id, tiktok.com, traveloka.com)
 * from any raw URL, intermediate tracking redirect (atid.me, pxf.io, pxfl.io, etc.), or nested query parameters.
 */
export function extractCleanMerchantProductUrl(inputUrl?: string | null): string | null {
  if (!inputUrl) return null;
  const decoded = decodeRepeatedly(inputUrl.trim());

  const originMatch = decoded.match(/origin_link=([^&]+)/i);
  if (originMatch && originMatch[1]) {
    const rawOrigin = decodeRepeatedly(originMatch[1]);
    const cleanOrigin = rawOrigin.replace(/\/universal-link\/product\//i, '/product/');
    if (cleanOrigin.startsWith('http')) {
      return cleanTrackingUrl(cleanOrigin);
    }
  }

  // Regex targeting clean merchant product page URLs
  const merchantRegex = /https?:\/\/(?:[a-zA-Z0-9-]+\.)?(?:blibli\.com|shopee\.co\.id|shope\.ee|tokopedia\.com|lazada\.co\.id|tiktok\.com|traveloka\.com)\/[^\s&"'>]+/i;
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
    return cleanTrackingUrl(urlObj.toString());
  } catch {
    return cleanTrackingUrl(cleanUrl);
  }
}

/**
 * Resolves the final affiliate tracking URL for a product.
 * Uses the exact affiliate_url stored in DB (cleaned of {clickid} template tags).
 * If affiliate_url is missing or is a bare atid.me link, falls back to product_url or clean merchant URL.
 */
export async function resolveProductAffiliateUrl(product: AffiliateProduct): Promise<string> {
  const affUrl = product.affiliate_url?.trim() || '';
  const prodUrl = product.product_url?.trim() || '';
  const merchant = (product.merchant || '').toLowerCase();
  const isShopee = merchant.includes('shopee') || affUrl.toLowerCase().includes('shopee') || affUrl.toLowerCase().includes('shope.ee') || prodUrl.toLowerCase().includes('shopee') || prodUrl.toLowerCase().includes('shope.ee');

  if (isShopee) {
    const cleanShopee = extractCleanMerchantProductUrl(affUrl) || extractCleanMerchantProductUrl(prodUrl);
    if (cleanShopee && (cleanShopee.includes('shopee.co.id') || cleanShopee.includes('shope.ee'))) {
      return cleanShopee;
    }
  }

  // 1. If affiliate_url exists and is not a bare atid.me root link, clean broken template tags ({clickid}) and use it
  if (affUrl && !affUrl.toLowerCase().startsWith('https://atid.me') && !affUrl.toLowerCase().startsWith('http://atid.me')) {
    const cleaned = cleanTrackingUrl(affUrl);
    if (cleaned && cleaned.startsWith('http')) {
      return cleaned;
    }
  }

  // 2. If affiliate_url is missing or is bare atid.me, fall back to product_url
  if (prodUrl && prodUrl.startsWith('http') && !prodUrl.toLowerCase().includes('atid.me')) {
    return cleanTrackingUrl(prodUrl);
  }

  // 3. Fallback to clean merchant product URL if extracted
  const cleanMerchant = extractCleanMerchantProductUrl(prodUrl) || extractCleanMerchantProductUrl(affUrl);
  if (cleanMerchant) {
    return cleanMerchant;
  }

  return cleanTrackingUrl(affUrl || prodUrl);
}
