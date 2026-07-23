import type { ProductSource, Product } from '../../shared/types';
import { TokoSayaProvider } from '../providers/TokoSayaProvider';
import { ProductParser } from '../parsers/ProductParser';
import { ProductNormalizer } from '../normalizers/ProductNormalizer';
import { SyncScheduler } from '../scheduler/SyncScheduler';
import { dataService } from '../../shared/db/dataService';

export class ProductSyncService {
  /**
   * Validates if a given URL is a supported Toko Saya product URL.
   */
  static validateUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    const regex = /^https?:\/\/[^\/]+\/[^\/]+\/detail\/[^\/]+/i;
    return regex.test(url.trim());
  }

  /**
   * Extracts external product code from URL.
   */
  static extractExternalCode(url: string): string {
    const match = url.match(/\/detail\/([^\/\?#]+)/);
    return match ? match[1] : `p_${Date.now()}`;
  }

  /**
   * Synchronizes a single product URL.
   */
  static async syncProductUrl(sourceUrl: string, existingSourceId?: string): Promise<{ product: Product; source: ProductSource }> {
    const cleanUrl = sourceUrl.trim();

    if (!this.validateUrl(cleanUrl)) {
      throw new Error(`URL Toko Saya tidak valid. Format yang didukung: https://tokovirtualku.id/{nama_toko}/detail/{id_produk}`);
    }

    const externalCode = this.extractExternalCode(cleanUrl);
    const nowIso = new Date().toISOString();
    const hexCode = (externalCode.replace(/[^0-9a-f]/gi, '') + '00000000000000000000000000000000').toLowerCase();
    const sourceUuid = `${hexCode.substring(0, 8)}-${hexCode.substring(8, 12)}-4000-9000-${hexCode.substring(12, 24)}`;

    let sourceRecord: Partial<ProductSource> = {
      id: existingSourceId || sourceUuid,
      source_url: cleanUrl,
      provider: 'tokosaya',
      external_product_code: externalCode,
      sync_status: 'pending',
      sync_interval_hours: 24,
      updated_at: nowIso
    };

    try {
      let rawData: import('../parsers/ProductParser').RawParsedProduct;

      // 1. Try official Alfamind REST API first (100% data + real images without HTML scraping)
      const officialData = await TokoSayaProvider.fetchProductByPlu(externalCode);
      if (officialData && officialData.product_name) {
        rawData = ProductParser.parseFromOfficialData(officialData, cleanUrl, externalCode);
      } else {
        // Fallback: Download product page HTML via Provider & Parse
        const html = await TokoSayaProvider.downloadProductPage(cleanUrl);
        rawData = ProductParser.parse(html, cleanUrl);
      }

      // 3. Check existing categories, channels, and products from database
      const [allCategories, allChannels, allProducts] = await Promise.all([
        dataService.fetchCategories(),
        dataService.fetchFulfillmentChannels(),
        dataService.fetchProducts()
      ]);

      const existingProd = allProducts.find(p => p.external_product_code === externalCode);
      const targetProductId = existingProd ? existingProd.id : undefined;

      // 4. Normalize into Product domain object linked to target product ID
      const normalizedProduct = ProductNormalizer.normalize(rawData, targetProductId);

      // Explicitly update all freshly scraped properties (images, name, prices, description)
      normalizedProduct.name = rawData.title;
      normalizedProduct.image_url = rawData.images[0];
      normalizedProduct.images = rawData.images;
      normalizedProduct.price = rawData.price;
      normalizedProduct.promo_price = rawData.promoPrice;
      normalizedProduct.description = rawData.description;
      normalizedProduct.brand = rawData.brand;

      // Category & Channel resolution logic:
      // 1. If product already exists in database and user selected/updated a category_id, PRESERVE IT!
      let targetCategoryId = existingProd?.category_id;
      let targetCategoryName = existingProd?.category;

      if (!targetCategoryId && rawData.category) {
        // Try exact & fuzzy match against database categories
        const rawCatLower = rawData.category.toLowerCase();
        const matchedCategory = allCategories.find(c => {
          const cNameLower = c.name.toLowerCase();
          const cSlugLower = (c.slug || '').toLowerCase();
          return cNameLower === rawCatLower ||
                 cNameLower.includes(rawCatLower) ||
                 rawCatLower.includes(cNameLower) ||
                 (cSlugLower && rawCatLower.includes(cSlugLower.replace(/-/g, ' ')));
        });

        if (matchedCategory) {
          targetCategoryId = matchedCategory.id;
          targetCategoryName = matchedCategory.name;
        }
      }

      // Fallback if still unassigned
      if (!targetCategoryId && allCategories.length > 0) {
        targetCategoryId = allCategories[0].id;
        targetCategoryName = allCategories[0].name;
      }

      const alfamindChannel = allChannels.find(c => c.slug === 'alfamind-official') || allChannels[0];

      normalizedProduct.category_id = targetCategoryId;
      if (targetCategoryName) {
        normalizedProduct.category = targetCategoryName;
      }
      normalizedProduct.channel_id = existingProd?.channel_id || alfamindChannel?.id || undefined;

      // 5. Save normalized product into local database
      const savedProduct = await dataService.saveProduct(normalizedProduct);

      // 5. Update Product Source status to 'synced'
      sourceRecord = {
        ...sourceRecord,
        product_id: savedProduct.id,
        sync_status: 'synced',
        last_synced_at: nowIso,
        next_sync_at: SyncScheduler.calculateNextSyncAt('synced'),
        last_error: undefined,
        product_name: savedProduct.name,
        product_price: savedProduct.price,
        product_image_url: savedProduct.image_url
      };

      const savedSource = await dataService.saveProductSource(sourceRecord);
      return { product: savedProduct, source: savedSource };

    } catch (err: any) {
      const errorMessage = err?.message || 'Terjadi kesalahan saat melakukan sinkronisasi.';

      sourceRecord = {
        ...sourceRecord,
        sync_status: 'failed',
        last_error: errorMessage,
        next_sync_at: SyncScheduler.calculateNextSyncAt('failed')
      };

      const savedSource = await dataService.saveProductSource(sourceRecord);
      throw new Error(`Sinkronisasi Gagal: ${errorMessage}`);
    }
  }

  /**
   * Force sync an existing source.
   */
  static async forceSyncSource(source: ProductSource): Promise<{ product: Product; source: ProductSource }> {
    return await this.syncProductUrl(source.source_url, source.id);
  }

  /**
   * Pause background sync for a source.
   */
  static async pauseSyncSource(source: ProductSource): Promise<ProductSource> {
    const updated = {
      ...source,
      sync_status: 'paused' as const,
      updated_at: new Date().toISOString()
    };
    return await dataService.saveProductSource(updated);
  }

  /**
   * Resume background sync for a source.
   */
  static async resumeSyncSource(source: ProductSource): Promise<ProductSource> {
    const updated = {
      ...source,
      sync_status: 'pending' as const,
      next_sync_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return await dataService.saveProductSource(updated);
  }
}
