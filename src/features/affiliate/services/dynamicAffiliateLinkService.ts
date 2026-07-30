import type { AffiliateProduct } from '../types';
import { AccesstradeEngine } from './AccesstradeService';

/**
 * Resolves the final affiliate tracking URL for a product.
 * If affiliate_url uses atid.me shortlinks (which often return 'OK' text or expire) or is missing,
 * it automatically generates a reliable ACCESSTRADE universal deep link from product_url using Site ID 127950.
 */
export async function resolveProductAffiliateUrl(product: AffiliateProduct): Promise<string> {
  const affUrl = product.affiliate_url?.trim() || '';
  const prodUrl = product.product_url?.trim() || '';

  // If we have a valid product_url (e.g. blibli, shopee, tokopedia, lazada, traveloka URL),
  // and the affiliate_url is missing or uses atid.me shortlinks (which may be broken or return 'OK'),
  // generate a direct ACCESSTRADE click link using product_url.
  if (prodUrl && prodUrl.startsWith('http')) {
    // If affUrl is already a working accesstrade.co.id/click link, use it
    if (affUrl.toLowerCase().includes('accesstrade.co.id/click')) {
      return affUrl;
    }
    // Otherwise (if affUrl is atid.me, empty, or generic), convert prodUrl to ACCESSTRADE click URL
    return AccesstradeEngine.convertToAffiliateUrl(prodUrl);
  }

  // If no prodUrl, but we have affUrl (and it's not a bare atid.me root link)
  if (affUrl && !affUrl.toLowerCase().startsWith('https://atid.me') && !affUrl.toLowerCase().startsWith('http://atid.me')) {
    return affUrl;
  }

  return affUrl || prodUrl;
}
