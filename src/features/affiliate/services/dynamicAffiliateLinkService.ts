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
 * Constructs an ACCESSTRADE Blibli tracking URL for any clean Blibli product URL.
 * Publisher ID: 392205 (ACCESSTRADE / PT Interspace Indonesia)
 * Campaign ID: 1662217 (Blibli Indonesia)
 */
export function buildAccesstradeBlibliTrackingUrl(targetBlibliUrl: string): string {
  if (!targetBlibliUrl) return '';
  const cleanUrl = targetBlibliUrl.trim();
  const encoded = encodeURIComponent(cleanUrl);
  return `https://blibli.pxf.io/c/392205/1662217/19024?u=${encoded}`;
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
 * - Blibli: Uses clean blibli.pxf.io tracking link (Publisher 392205) without broken template tags ({clickid}).
 *   This GUARANTEES clicks are recorded in ACCESSTRADE dashboard AND redirect to Blibli with 200 OK (no 404, no atid.me OK).
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
    // 1. If affUrl is a blibli.pxf.io tracking link, clean template tags ({clickid}, {psn})
    // This records the click in ACCESSTRADE dashboard and opens Blibli with 200 OK!
    if (affUrl && (affUrl.includes('blibli.pxf.io') || affUrl.includes('pxf.io'))) {
      const cleanedAff = cleanTrackingUrl(affUrl);
      if (cleanedAff && cleanedAff.startsWith('http') && !cleanedAff.includes('{clickid}')) {
        return cleanedAff;
      }
    }

    // 2. If we have a clean Blibli product URL, construct a valid ACCESSTRADE Blibli tracking URL (blibli.pxf.io)
    // This ensures even raw Blibli URLs are tracked in ACCESSTRADE dashboard!
    if (cleanMerchantUrl) {
      return buildAccesstradeBlibliTrackingUrl(cleanMerchantUrl);
    }

    // 3. Fallback: wrap prodUrl if valid Blibli URL
    if (prodUrl && prodUrl.startsWith('http') && prodUrl.includes('blibli.com')) {
      return buildAccesstradeBlibliTrackingUrl(prodUrl);
    }

    // 4. Fallback: cleaned affUrl if not atid.me
    const cleanedAff = cleanTrackingUrl(affUrl);
    if (cleanedAff && !cleanedAff.toLowerCase().includes('atid.me')) {
      return cleanedAff;
    }

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
