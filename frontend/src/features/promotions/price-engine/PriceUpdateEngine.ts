import type { Product } from '../../shared/types';
import type { PriceHistoryRecord, PromotionCampaign, PromotionProduct } from '../types/campaignTypes';
import { dataService } from '../../shared/db/dataService';

export interface CalculatedPromotionPrice {
  base_price: number;
  promo_price: number;
  discount_amount: number;
  discount_percentage: number;
  effective_price: number;
  is_promo_active: boolean;
  active_campaign?: PromotionCampaign;
}

export class PriceUpdateEngine {
  /**
   * Evaluates and computes effective promotional pricing without modifying original base_price
   */
  static calculateEffectivePrice(
    product: Product,
    campaigns: PromotionCampaign[],
    promoProducts: PromotionProduct[]
  ): CalculatedPromotionPrice {
    const basePrice = product.price;
    const nowIso = new Date().toISOString().slice(0, 10);

    // Find all active campaign mappings for this product
    const activeMappings = promoProducts.filter(pp => {
      if (pp.product_id !== product.id || !pp.is_active) return false;
      const parentCamp = campaigns.find(c => c.id === pp.campaign_id);
      if (!parentCamp) return false;
      return parentCamp.status === 'ACTIVE' && parentCamp.start_date <= nowIso && parentCamp.end_date >= nowIso;
    });

    if (activeMappings.length === 0) {
      return {
        base_price: basePrice,
        promo_price: product.promo_price || basePrice,
        discount_amount: 0,
        discount_percentage: 0,
        effective_price: product.promo_price || basePrice,
        is_promo_active: product.is_promo ?? false
      };
    }

    // Resolve Multiple Campaign Conflicts: Sort by Priority (Desc) -> Start Date (Desc) -> Discount (Desc)
    activeMappings.sort((a, b) => {
      const campA = campaigns.find(c => c.id === a.campaign_id)!;
      const campB = campaigns.find(c => c.id === b.campaign_id)!;
      if (campB.priority !== campA.priority) return campB.priority - campA.priority;
      if (campB.start_date !== campA.start_date) return campB.start_date.localeCompare(campA.start_date);
      return b.discount_percentage - a.discount_percentage;
    });

    const winningPromo = activeMappings[0];
    const winningCamp = campaigns.find(c => c.id === winningPromo.campaign_id);

    const promoPrice = winningPromo.promo_price;
    const discountAmount = Math.max(0, basePrice - promoPrice);
    const discountPercentage = Math.round((discountAmount / basePrice) * 100 * 10) / 10;

    return {
      base_price: basePrice,
      promo_price: promoPrice,
      discount_amount: discountAmount,
      discount_percentage: discountPercentage,
      effective_price: promoPrice,
      is_promo_active: true,
      active_campaign: winningCamp
    };
  }

  /**
   * Applies campaign promotion to catalog product non-destructively
   */
  static async activateCampaignPromotion(
    product: Product,
    campaign: PromotionCampaign,
    promoPrice: number
  ): Promise<Product> {
    const basePrice = product.price; // Original Base Price remains untouched
    const discountAmount = Math.max(0, basePrice - promoPrice);
    const discountPercentage = Math.round((discountAmount / basePrice) * 100 * 10) / 10;

    // Update catalog product promo fields without changing base price
    const updatedProduct = await dataService.saveProduct({
      ...product,
      promo_price: promoPrice,
      is_promo: true,
      notes: `Promo ${campaign.title} (Diskon ${discountPercentage}%)`
    });

    // Record Price Change History
    const historyRecord: PriceHistoryRecord = {
      id: `ph_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      product_id: product.id,
      campaign_id: campaign.id,
      product_name: product.name,
      old_base_price: basePrice,
      new_promo_price: promoPrice,
      discount_percentage: discountPercentage,
      change_type: 'CAMPAIGN_ACTIVATED',
      timestamp: new Date().toISOString(),
      notes: `Activated campaign ${campaign.title} (Base: Rp ${basePrice.toLocaleString('id-ID')} -> Promo: Rp ${promoPrice.toLocaleString('id-ID')})`
    };

    await dataService.recordPriceHistory(historyRecord);
    return updatedProduct;
  }

  /**
   * Restores original base price or falls back to remaining active promotion when campaign expires or ends
   */
  static async restoreBasePrice(product: Product, campaignId?: string): Promise<Product> {
    const basePrice = product.price;

    // Check if product belongs to other active campaigns before completely clearing promo state
    const allCampaigns = await dataService.fetchPromotionCampaigns();
    const allPromoProducts = await dataService.fetchPromotionProducts();

    // Exclude the current campaign being expired
    const remainingCampaigns = campaignId
      ? allCampaigns.filter(c => c.id !== campaignId)
      : allCampaigns;

    const priceEval = this.calculateEffectivePrice(product, remainingCampaigns, allPromoProducts);

    let restoredProduct: Product;

    if (priceEval.is_promo_active && priceEval.active_campaign) {
      // Re-apply remaining active winning campaign promo price
      restoredProduct = await dataService.saveProduct({
        ...product,
        promo_price: priceEval.promo_price,
        is_promo: true,
        notes: `Promo ${priceEval.active_campaign.title} (Diskon ${priceEval.discount_percentage}%)`
      });

      const historyRecord: PriceHistoryRecord = {
        id: `ph_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        product_id: product.id,
        campaign_id: campaignId,
        product_name: product.name,
        old_base_price: product.promo_price || basePrice,
        new_promo_price: priceEval.promo_price,
        discount_percentage: priceEval.discount_percentage,
        change_type: 'CAMPAIGN_EXPIRED',
        timestamp: new Date().toISOString(),
        notes: `Campaign expired (${campaignId}), updated to next active campaign: ${priceEval.active_campaign.title}`
      };
      await dataService.recordPriceHistory(historyRecord);
    } else {
      // Completely restore base price
      restoredProduct = await dataService.saveProduct({
        ...product,
        promo_price: undefined,
        is_promo: false
      });

      const historyRecord: PriceHistoryRecord = {
        id: `ph_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        product_id: product.id,
        campaign_id: campaignId,
        product_name: product.name,
        old_base_price: product.promo_price || basePrice,
        new_promo_price: basePrice,
        discount_percentage: 0,
        change_type: 'CAMPAIGN_EXPIRED',
        timestamp: new Date().toISOString(),
        notes: `Automatically restored original base price Rp ${basePrice.toLocaleString('id-ID')}`
      };
      await dataService.recordPriceHistory(historyRecord);
    }

    return restoredProduct;
  }
}

