import { dataService } from '../../shared/db/dataService';
import type { ReviewItem } from '../types';
import type { Product } from '../../shared/types';
import { catalogVersioningService } from '../versioning/CatalogVersioningService';
import { ImportEventBus } from '../events/ImportEventBus';

export class CatalogUpdateEngine {
  static async publishApprovedItems(items: ReviewItem[]): Promise<{ createdCount: number; updatedCount: number }> {
    let createdCount = 0;
    let updatedCount = 0;

    // Create backup catalog version snapshot prior to updating
    await catalogVersioningService.createSnapshot('Auto-snapshot before publishing imported screenshots batch');

    for (const item of items) {
      if (item.action === 'IGNORE') continue;

      const card = item.card;
      const norm = card.normalizedData;
      const ai = card.aiCorrectedData;

      const productName = item.editedData?.name || ai?.corrected_name || norm?.extracted_name || norm?.normalized_name || 'Produk Impor Sembako';
      const brand = item.editedData?.brand || ai?.corrected_brand || norm?.extracted_brand || norm?.normalized_brand || 'Umum';
      const currentPrice = item.editedData?.price !== undefined 
        ? item.editedData.price 
        : (norm?.normalized_price ?? norm?.current_price ?? 0);
      const originalPrice = norm?.original_price || norm?.strikethrough_price;
      const promoTitle = item.editedData?.promo_title || norm?.promo_title;
      const promoStartDate = item.editedData?.promo_start_date || norm?.promo_start_date;
      const promoEndDate = item.editedData?.promo_end_date || norm?.promo_end_date;
      const promoBadge = item.editedData?.promo_badge || norm?.promo_badge;
      const promoType = item.editedData?.promo_type || norm?.promo_type;

      const isPromo = norm?.is_promo || norm?.has_strikethrough_price || (!!originalPrice && originalPrice > currentPrice) || !!promoType || !!promoBadge;
      
      // If strikethrough original price is present: price = normal price, promo_price = discounted current price
      const finalPrice = item.editedData?.price !== undefined 
        ? item.editedData.price 
        : (originalPrice && originalPrice > currentPrice ? originalPrice : currentPrice);
      const finalPromoPrice = item.editedData?.promo_price !== undefined 
        ? item.editedData.promo_price 
        : (originalPrice && originalPrice > currentPrice ? currentPrice : (isPromo ? currentPrice : undefined));


      
      const isAvailable = item.editedData?.is_available !== undefined
        ? item.editedData.is_available
        : norm?.is_available !== undefined
          ? norm.is_available
          : norm?.stock_status ? norm.stock_status !== 'out_of_stock' : true;

      const stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = item.editedData?.stock_status 
        || norm?.stock_status 
        || (isAvailable ? 'in_stock' : 'out_of_stock');

      const unit = item.editedData?.unit || norm?.normalized_unit || norm?.package_size || 'pcs';
      const imageUrl = item.editedData?.image_url || card.cropImageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300';
      const isPromoCategory = card.aiCategoryRecommendation?.category === 'Promo Merchant' || isPromo;
      
      const targetCategoryId = item.editedData?.category_id;
      const targetCategoryName = item.editedData?.category;

      if (item.action === 'ACCEPT' || item.action === 'MERGE_PRODUCT') {
        const candidate = card.matchResult?.candidateProduct;
        if (candidate) {
          console.log(`[CatalogUpdateEngine] Updating existing candidate product: ${candidate.name} (id: ${candidate.id})`);
          await dataService.saveProduct({
            ...candidate,
            name: productName,
            brand,
            price: finalPrice,
            promo_price: finalPromoPrice,
            is_promo: isPromo,
            promo_title: promoTitle,
            promo_start_date: promoStartDate,
            promo_end_date: promoEndDate,
            promo_badge: promoBadge,
            promo_type: promoType,
            is_available: isAvailable,
            stock_status: stockStatus,
            category_id: targetCategoryId || (isPromoCategory ? 'c2222222-2222-2222-2222-222222222222' : candidate.category_id),
            category: targetCategoryName || (isPromoCategory ? 'Promo Merchant' : candidate.category),
            image_url: imageUrl,
            purchase_method: 'owner_checkout'
          });
          updatedCount++;
        } else {
          console.log(`[CatalogUpdateEngine] Creating new product from ACCEPT: ${productName}`);
          await this.createNewProduct(
            productName, brand, finalPrice, finalPromoPrice, isPromo, isPromoCategory, unit, imageUrl, isAvailable, stockStatus,
            promoTitle, promoStartDate, promoEndDate, promoBadge, promoType, targetCategoryId, targetCategoryName
          );
          createdCount++;
        }
      } else if (item.action === 'CREATE_PRODUCT' || item.action === 'EDIT') {
        if (card.matchResult?.candidateProduct && item.action === 'EDIT') {
          console.log(`[CatalogUpdateEngine] Updating product from EDIT: ${productName}`);
          await dataService.saveProduct({
            ...card.matchResult.candidateProduct,
            name: productName,
            brand,
            price: finalPrice,
            promo_price: finalPromoPrice,
            is_promo: isPromo,
            promo_title: promoTitle,
            promo_start_date: promoStartDate,
            promo_end_date: promoEndDate,
            promo_badge: promoBadge,
            promo_type: promoType,
            is_available: isAvailable,
            stock_status: stockStatus,
            category_id: targetCategoryId || card.matchResult.candidateProduct.category_id,
            category: targetCategoryName || card.matchResult.candidateProduct.category,
            image_url: imageUrl,
            purchase_method: 'owner_checkout'
          });
          updatedCount++;
        } else {
          console.log(`[CatalogUpdateEngine] Creating new product from CREATE_PRODUCT: ${productName}`);
          await this.createNewProduct(
            productName, brand, finalPrice, finalPromoPrice, isPromo, isPromoCategory, unit, imageUrl, isAvailable, stockStatus,
            promoTitle, promoStartDate, promoEndDate, promoBadge, promoType, targetCategoryId, targetCategoryName
          );
          createdCount++;
        }
      } else {
        console.log(`[CatalogUpdateEngine] Creating product from default fallback action (${item.action}): ${productName}`);
        await this.createNewProduct(
          productName, brand, finalPrice, finalPromoPrice, isPromo, isPromoCategory, unit, imageUrl, isAvailable, stockStatus,
          promoTitle, promoStartDate, promoEndDate, promoBadge, promoType, targetCategoryId, targetCategoryName
        );
        createdCount++;
      }
    }

    // Refresh products catalog
    const refreshed = await dataService.fetchProducts();
    console.log(`[CatalogUpdateEngine] Batch publish completed! Created: ${createdCount}, Updated: ${updatedCount}. Total catalog products count: ${refreshed.length}`);

    // Emit domain event for catalog update and trigger knowledge pipeline
    ImportEventBus.emit('CatalogUpdated', {
      source: 'screenshot_import',
      createdCount,
      updatedCount,
      totalCatalogProducts: refreshed.length,
      products: refreshed
    });

    return { createdCount, updatedCount };
  }


  private static async createNewProduct(
    name: string, 
    brand: string, 
    price: number, 
    promoPrice: number | undefined, 
    isPromo: boolean, 
    isPromoCategory: boolean, 
    unit: string, 
    imageUrl: string,
    isAvailable: boolean = true,
    stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock',
    promoTitle?: string,
    promoStartDate?: string,
    promoEndDate?: string,
    promoBadge?: string,
    promoType?: 'JSM' | 'FLASHSALE' | 'MEMBER' | 'SUPER_SAVER' | 'REGULAR',
    targetCategoryId?: string,
    targetCategoryName?: string
  ): Promise<Product> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `prod-${Date.now()}`;

    const isBeauty = ['slavina', 'pixy', 'hanasui', 'parfum', 'perfume', 'lotion', 'lip', 'powder', 'foundation', 'shampoo', 'sabun', 'beauty', 'cosmetic', 'emeron', 'lifebuoy', 'fres', 'pepsodent', 'systema', 'close up']
      .some(kw => name.toLowerCase().includes(kw) || brand.toLowerCase().includes(kw));

    const defaultCatId = targetCategoryId || (isBeauty ? 'c6666666-6666-6666-6666-666666666666' : 'c1111111-1111-1111-1111-111111111111');
    const defaultCatName = targetCategoryName || (isBeauty ? 'Health & Beauty' : 'Alfamart (Sembako)');

    return await dataService.saveProduct({
      id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      category_id: targetCategoryId || (isPromoCategory ? 'c2222222-2222-2222-2222-222222222222' : defaultCatId),
      category: targetCategoryName || (isPromoCategory ? 'Promo Merchant' : defaultCatName),


      name,
      slug,
      brand,
      unit,
      price,
      promo_price: promoPrice,
      is_promo: isPromo,
      promo_title: promoTitle,
      promo_start_date: promoStartDate,
      promo_end_date: promoEndDate,
      promo_badge: promoBadge,
      promo_type: promoType,
      is_available: isAvailable,
      stock_status: stockStatus,
      image_url: imageUrl,
      purchase_method: 'owner_checkout'
    });
  }
}


