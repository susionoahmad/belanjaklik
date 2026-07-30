import type { AffiliateProduct } from '../types';
import { AccesstradeEngine } from './AccesstradeService';

/**
 * Resolves the final affiliate tracking URL for a product.
 * If affiliate_url is missing or is an invalid/bare root URL (such as "https://atid.me" or "https://atid.me/"),
 * it automatically generates a valid ACCESSTRADE deep link from product_url using Site ID 127950.
 */
export async function resolveProductAffiliateUrl(product: AffiliateProduct): Promise<string> {
  const affUrl = product.affiliate_url?.trim() || '';
  const prodUrl = product.product_url?.trim() || '';

  // Check if affiliate_url is empty, invalid, or bare atid.me link (which returns 'OK' text without redirecting)
  const isBareAtid = !affUrl || 
    affUrl === 'https://atid.me' || 
    affUrl === 'https://atid.me/' || 
    affUrl === 'http://atid.me' || 
    affUrl === 'http://atid.me/' ||
    affUrl.includes('atid.me/error');

  if (affUrl && !isBareAtid) {
    return affUrl;
  }

  // Fallback: convert product_url into ACCESSTRADE deep link
  if (prodUrl) {
    return AccesstradeEngine.convertToAffiliateUrl(prodUrl);
  }

  return affUrl || prodUrl;
}
