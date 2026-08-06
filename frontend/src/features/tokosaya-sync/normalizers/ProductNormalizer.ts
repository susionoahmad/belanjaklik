import type { Product } from '../../shared/types';
import type { RawParsedProduct } from '../parsers/ProductParser';

function codeToUuid(code: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(code)) return code;

  const hexOnly = (code.replace(/[^0-9a-f]/gi, '') + '00000000000000000000000000000000').toLowerCase();
  return `${hexOnly.substring(0, 8)}-${hexOnly.substring(8, 12)}-4000-8000-${hexOnly.substring(12, 24)}`;
}

export class ProductNormalizer {
  /**
   * Normalizes raw parsed data into standard application Product domain object.
   */
  static normalize(raw: RawParsedProduct, existingProductId?: string): Partial<Product> {
    const title = raw.title || 'Produk Toko Saya';
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Ensure slug is 100% unique per external product code to prevent Postgres unique constraint collisions
    const slug = `${baseSlug || 'produk'}-${raw.externalCode}`;

    const primaryImage = raw.images[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400';
    const generatedUuid = codeToUuid(raw.externalCode);

    return {
      id: existingProductId || generatedUuid,
      name: title,
      slug: slug,
      brand: raw.brand || 'Alfamind',
      description: raw.description,
      price: raw.price || 0,
      promo_price: raw.promoPrice,
      is_promo: !!raw.promoPrice && raw.promoPrice < (raw.price || 0),
      is_available: true,
      is_featured: true,
      is_popular: true,
      stock_status: 'in_stock',
      unit: 'pcs',
      image_url: primaryImage,
      images: raw.images,
      purchase_method: 'self_checkout', // Explicitly Self Checkout for Toko Saya
      channel_id: '11111111-1111-1111-1111-111111111111', // Alfamind Official Channel ID
      external_product_code: raw.externalCode,
      search_keywords: `${title} ${raw.brand || ''} ${raw.externalCode}`.toLowerCase()
    };
  }
}
