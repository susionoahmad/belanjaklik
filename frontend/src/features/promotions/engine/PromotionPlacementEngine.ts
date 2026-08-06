import type { PlacementType, CampaignPlacement } from '../types/enterpriseTypes';
import type { PromotionBanner, PromotionCampaign } from '../types/campaignTypes';
import { dataService } from '../../shared/db/dataService';

export class PromotionPlacementEngine {
  /**
   * Filters and sorts campaign banners targeting a specific placement surface
   */
  static async getBannersForPlacement(
    placementType: PlacementType,
    categoryId?: string
  ): Promise<PromotionBanner[]> {
    const campaigns = await dataService.fetchPromotionCampaigns();
    const activeCampaigns = campaigns.filter((c: any) => c.status === 'ACTIVE' || c.status === 'ENDING_SOON');
    const activeIds = activeCampaigns.map((c: any) => c.id);

    const allBanners = await dataService.fetchPromotionBanners();
    const placements = (await dataService.fetchCampaignPlacements()) as CampaignPlacement[];

    // Filter banners whose campaign is active and mapped to this placement type
    const matchingBanners = allBanners.filter((banner: PromotionBanner) => {
      if (!activeIds.includes(banner.campaign_id) || !banner.is_active) return false;

      // Check explicit placement configuration if present
      const matchedPlacement = placements.find(
        p => p.campaign_id === banner.campaign_id && p.placement_type === placementType && p.is_active
      );

      if (matchedPlacement) {
        if (placementType === 'CATEGORY_BANNER' && categoryId && matchedPlacement.target_category_id) {
          return matchedPlacement.target_category_id === categoryId;
        }
        return true;
      }

      // Default fallback mappings
      if (placementType === 'HOMEPAGE_HERO' || placementType === 'HOMEPAGE_SLIDER') {
        return banner.banner_type === 'HERO_DESKTOP' || banner.banner_type === 'HOMEPAGE_SLIDER';
      }
      if (placementType === 'MOBILE_APP_HOME') {
        return banner.banner_type === 'HERO_MOBILE';
      }
      return true;
    });

    return matchingBanners.sort((a, b) => a.display_order - b.display_order);
  }
}
