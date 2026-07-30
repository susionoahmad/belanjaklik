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

  // Clean out broken template tags like {clickid}, {psn}, or unparsed template query params
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
 * If affiliate_url uses atid.me or pxf.io tracking redirects with unreplaced template parameters (which cause 404),
 * it extracts the clean merchant URL (e.g. blibli.com/p/...) and wraps it with ACCESSTRADE Site ID 127950.
 */
export async function resolveProductAffiliateUrl(product: AffiliateProduct): Promise<string> {
  const prodUrl = product.product_url?.trim() || '';
  const affUrl = product.affiliate_url?.trim() || '';

  // 1. Try to extract clean merchant product URL from product_url or affiliate_url
  const cleanMerchantUrl = extractCleanMerchantProductUrl(prodUrl) || extractCleanMerchantProductUrl(affUrl);

  if (cleanMerchantUrl) {
    // Wrap clean merchant URL with ACCESSTRADE universal click tracker (site_id=127950)
    return AccesstradeEngine.convertToAffiliateUrl(cleanMerchantUrl);
  }

  // 2. If affUrl is already a working direct accesstrade.co.id/click link without broken template tags, use it
  if (affUrl && affUrl.toLowerCase().includes('accesstrade.co.id/click') && !affUrl.includes('%7Bclickid%7D') && !affUrl.includes('{clickid}')) {
    return affUrl;
  }

  // 3. Fallback to product_url or affUrl converted
  if (prodUrl && prodUrl.startsWith('http')) {
    return AccesstradeEngine.convertToAffiliateUrl(prodUrl);
  }

  return affUrl || prodUrl;
}
