import type { CampaignLifecycleStatus, CampaignSchedule } from '../types/enterpriseTypes';
import { dataService } from '../../shared/db/dataService';
import { PriceUpdateEngine } from '../price-engine/PriceUpdateEngine';
import { ImportEventBus } from '../../product-import/events/ImportEventBus';

export class CampaignSchedulerService {
  /**
   * Evaluates current timestamp against campaign start/end dates & times (Asia/Jakarta UTC+7)
   */
  static evaluateLifecycleStatus(
    schedule: CampaignSchedule,
    now: Date = new Date()
  ): CampaignLifecycleStatus {
    const rawStart = schedule.start_date.includes('T')
      ? schedule.start_date
      : `${schedule.start_date}T${schedule.start_time || '00:00'}:00`;
    const rawEnd = schedule.end_date.includes('T')
      ? schedule.end_date
      : `${schedule.end_date}T${schedule.end_time || '23:59'}:59`;

    const startMs = new Date(rawStart).getTime();
    const endMs = new Date(rawEnd).getTime();
    const nowMs = now.getTime();

    if (isNaN(startMs) || isNaN(endMs)) {
      return schedule.lifecycle_status || 'DRAFT';
    }

    if (nowMs < startMs) {
      return 'SCHEDULED';
    } else if (nowMs >= startMs && nowMs <= endMs) {
      // If within 24 hours of ending, tag as ENDING_SOON
      const remainingMs = endMs - nowMs;
      if (remainingMs <= 24 * 60 * 60 * 1000) {
        return 'ENDING_SOON';
      }
      return 'ACTIVE';
    } else if (nowMs > endMs) {
      // Check if candidate for archiving (> 30 days after expiration)
      if (nowMs - endMs > 30 * 24 * 60 * 60 * 1000) {
        return 'ARCHIVED';
      }
      return 'EXPIRED';
    }

    return schedule.lifecycle_status || 'DRAFT';
  }

  /**
   * Automated cron/interval scheduler task to transition campaign lifecycles
   */
  static async runAutomatedScheduler(): Promise<{ transitionedCount: number }> {
    let transitionedCount = 0;
    const campaigns = await dataService.fetchPromotionCampaigns();
    const now = new Date();

    for (const campaign of campaigns) {
      const schedule: CampaignSchedule = {
        start_date: campaign.start_date,
        start_time: campaign.start_time || '00:00',
        end_date: campaign.end_date,
        end_time: campaign.end_time || '23:59',
        timezone: campaign.timezone || 'Asia/Jakarta',
        auto_unpublish: campaign.auto_unpublish ?? true,
        lifecycle_status: campaign.status
      };

      const newStatus = this.evaluateLifecycleStatus(schedule, now);

      if (newStatus !== campaign.status) {
        const oldStatus = campaign.status;
        campaign.status = newStatus;
        await dataService.savePromotionCampaign(campaign);
        transitionedCount++;

        // Emit Lifecycle Domain Events
        if (newStatus === 'ACTIVE') {
          ImportEventBus.emit('PromotionActivated', { campaignId: campaign.id, title: campaign.title });
        } else if (newStatus === 'EXPIRED' || newStatus === 'ARCHIVED') {
          // Auto-Unpublish & Price Restoration
          if (schedule.auto_unpublish) {
            const promoProducts = await dataService.fetchPromotionProducts(campaign.id);
            const allProducts = await dataService.fetchProducts();

            for (const pp of promoProducts) {
              const prod = allProducts.find(p => p.id === pp.product_id);
              if (prod && prod.is_promo) {
                await PriceUpdateEngine.restoreBasePrice(prod, campaign.id);
              }
            }
          }
          ImportEventBus.emit('PromotionExpired', { campaignId: campaign.id, title: campaign.title });
        }
      }
    }

    return { transitionedCount };
  }
}
