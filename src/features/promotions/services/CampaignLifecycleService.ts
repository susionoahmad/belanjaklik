import { dataService } from '../../shared/db/dataService';
import { PriceUpdateEngine } from '../price-engine/PriceUpdateEngine';
import { ImportEventBus } from '../../product-import/events/ImportEventBus';

export class CampaignLifecycleService {
  private static isRunning = false;

  static async checkAndSyncCampaignLifecycles(): Promise<{ activatedCount: number; restoredCount: number }> {
    if (this.isRunning) return { activatedCount: 0, restoredCount: 0 };
    this.isRunning = true;

    let activatedCount = 0;
    let restoredCount = 0;

    try {
      const campaigns = await dataService.fetchPromotionCampaigns();
      const nowIso = new Date().toISOString().slice(0, 10);

      for (const campaign of campaigns) {
        // 1. Activate Draft/Published campaigns reaching start_date
        if ((campaign.status === 'PUBLISHED' || campaign.status === 'DRAFT') && campaign.start_date <= nowIso && campaign.end_date >= nowIso) {
          campaign.status = 'ACTIVE';
          await dataService.savePromotionCampaign(campaign);
          activatedCount++;
          ImportEventBus.emit('PromotionActivated', { campaignId: campaign.id, title: campaign.title });
        }

        // 2. Automatically restore prices for expired campaigns reaching end_date
        if (campaign.end_date < nowIso && campaign.status !== 'EXPIRED') {
          campaign.status = 'EXPIRED';
          await dataService.savePromotionCampaign(campaign);

          const promoProducts = await dataService.fetchPromotionProducts(campaign.id);
          const allProducts = await dataService.fetchProducts();

          for (const pp of promoProducts) {
            const prod = allProducts.find(p => p.id === pp.product_id);
            if (prod && prod.is_promo) {
              await PriceUpdateEngine.restoreBasePrice(prod, campaign.id);
              restoredCount++;
            }
          }

          ImportEventBus.emit('PromotionExpired', { campaignId: campaign.id, title: campaign.title, restoredCount });
        }
      }
    } catch (err) {
      console.warn('[CampaignLifecycleService] Sync error:', err);
    } finally {
      this.isRunning = false;
    }

    return { activatedCount, restoredCount };
  }
}
