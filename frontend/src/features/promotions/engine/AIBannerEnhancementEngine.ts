import type { BannerVariant, BannerVariantType } from '../types/enterpriseTypes';

export class AIBannerEnhancementEngine {
  private static variantSpecs: Array<{ type: BannerVariantType; width: number; height: number }> = [
    { type: 'DESKTOP_HERO', width: 1200, height: 400 },
    { type: 'MOBILE_HERO', width: 600, height: 300 },
    { type: 'HOMEPAGE_SLIDER', width: 1200, height: 450 },
    { type: 'CATEGORY_BANNER', width: 800, height: 250 },
    { type: 'SIDEBAR_BANNER', width: 300, height: 600 },
    { type: 'POPUP_BANNER', width: 600, height: 600 },
    { type: 'THUMBNAIL', width: 300, height: 150 },
    { type: 'APP_BANNER', width: 400, height: 200 }
  ];

  static generateAllVariants(
    campaignId: string,
    sourceImageUrl: string,
    campaignTitle: string
  ): BannerVariant[] {
    return this.variantSpecs.map((spec, idx) => {
      // Determine AI text safe area crop box
      const textSafeArea = {
        top: Math.round(spec.height * 0.1),
        left: Math.round(spec.width * 0.05),
        width: Math.round(spec.width * 0.9),
        height: Math.round(spec.height * 0.3)
      };

      // Construct responsive image URL parameter for optimization
      const imageUrl = sourceImageUrl.includes('unsplash')
        ? `${sourceImageUrl.split('?')[0]}?w=${spec.width}&h=${spec.height}&fit=crop`
        : sourceImageUrl;

      return {
        id: `bv_${campaignId}_${spec.type}_${idx}`,
        campaign_id: campaignId,
        variant_type: spec.type,
        width: spec.width,
        height: spec.height,
        image_url: imageUrl,
        text_safe_area: textSafeArea,
        is_ai_enhanced: true,
        alt_text: `${campaignTitle} - Variant ${spec.type} (${spec.width}x${spec.height})`
      };
    });
  }
}
