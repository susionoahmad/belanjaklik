import type { AffiliateProduct } from '../types';

/**
 * Temporary consolidation mode while ACCESSTRADE reviews the property URL.
 * Both public domains use the existing Site ID 127950 and stored affiliate URL.
 */
export async function resolveProductAffiliateUrl(product: AffiliateProduct): Promise<string> {
  return product.affiliate_url?.trim() || '';
}
