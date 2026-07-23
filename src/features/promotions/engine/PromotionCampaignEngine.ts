import type { Product } from '../../shared/types';
import type {
  CampaignParsedData,
  ExtractedFlyerProduct,
  PromotionCampaign,
  PromotionProduct,
  PromotionBanner
} from '../types/campaignTypes';
import type {
  CampaignPlacement,
  CampaignTemplate,
  PlacementType,
  PromotionRule,
  SEOMarketingMeta
} from '../types/enterpriseTypes';

import { dataService } from '../../shared/db/dataService';
import { ImportEventBus } from '../../product-import/events/ImportEventBus';

import { CampaignParser } from './CampaignParser';
import { FlyerBannerDetector } from './FlyerBannerDetector';
import { FlyerLayoutDetector } from './FlyerLayoutDetector';
import { FlyerProductParser } from './FlyerProductParser';
import { CatalogMatcherOnly } from './CatalogMatcherOnly';
import { CampaignTemplateLibrary } from './CampaignTemplateLibrary';
import { SEOMarketingGenerator } from './SEOMarketingGenerator';
import { PriceUpdateEngine, type CalculatedPromotionPrice } from '../price-engine/PriceUpdateEngine';
import { PromotionRulesEngine, type RuleEvaluationContext, type PromotionRuleEvaluationResult } from './PromotionRulesEngine';
import { PromotionPlacementEngine } from './PromotionPlacementEngine';
import { PromotionKnowledgeEngine, type CampaignKnowledgeChunk } from './PromotionKnowledgeEngine';
import { CampaignAnalyticsEngine } from './CampaignAnalyticsEngine';
import { CampaignABTestingEngine } from './CampaignABTestingEngine';
import { AIBannerEnhancementEngine } from './AIBannerEnhancementEngine';
import { CampaignLifecycleService } from '../services/CampaignLifecycleService';
import { CampaignSchedulerService } from '../services/CampaignSchedulerService';

export interface ProcessedFlyerResult {
  parsedData: CampaignParsedData;
  layoutRegions: ReturnType<typeof FlyerLayoutDetector.detectLayout>;
  seoMeta: SEOMarketingMeta;
  appliedTemplate?: CampaignTemplate;
}

export interface CampaignPublishResult {
  campaign: PromotionCampaign;
  publishedProductsCount: number;
  createdProductsCount: number;
  updatedProductsCount: number;
}

export class PromotionCampaignEngine {
  /**
   * 1. End-to-end Flyer OCR Extraction & Processing Pipeline
   */
  static async processFlyerCampaign(
    flyerImageUrl: string,
    flyerTitle?: string,
    presetId?: string,
    catalogProducts?: Product[]
  ): Promise<ProcessedFlyerResult> {
    const products = catalogProducts && catalogProducts.length > 0
      ? catalogProducts
      : await dataService.fetchProducts();

    // Stage A: Metadata Extraction
    const meta = CampaignParser.parseText(flyerTitle || flyerImageUrl);

    // Stage B: Layout & Banner Crop Detection
    const layoutRegions = FlyerLayoutDetector.detectLayout(1200, 1600);
    const croppedBanners = await FlyerBannerDetector.extractAndGenerateBanners(flyerImageUrl);

    // Stage C: OCR Product Card Extraction
    const rawCards = FlyerProductParser.parseCards(flyerImageUrl, flyerTitle, presetId);

    // Stage D: Fuzzy Catalog Product Matcher
    const extractedProducts = CatalogMatcherOnly.matchAgainstCatalog(rawCards, products);

    // Stage E: Template & Rules Setup
    let appliedTemplate: CampaignTemplate | undefined = undefined;
    if (presetId) {
      appliedTemplate = CampaignTemplateLibrary.getTemplate(presetId.toUpperCase());
    }
    if (!appliedTemplate) {
      appliedTemplate = CampaignTemplateLibrary.templates[0];
    }

    const parsedData: CampaignParsedData = {
      title: flyerTitle || meta.title,
      subtitle: meta.subtitle,
      theme: meta.theme,
      start_date: meta.start_date,
      end_date: meta.end_date,
      campaign_type: meta.campaign_type,
      terms_conditions: meta.terms_conditions,
      primary_color: croppedBanners.primaryColor,
      secondary_color: croppedBanners.secondaryColor,
      extracted_products: extractedProducts,
      cropped_banners: croppedBanners
    };

    const seoMeta = SEOMarketingGenerator.generateMeta({
      title: parsedData.title,
      subtitle: parsedData.subtitle,
      slug: this.slugify(parsedData.title),
      start_date: parsedData.start_date,
      end_date: parsedData.end_date,
      desktop_banner: croppedBanners.desktop
    });

    return {
      parsedData,
      layoutRegions,
      seoMeta,
      appliedTemplate
    };
  }

  /**
   * 2. Publishes parsed campaign data to store & catalog
   */
  static async publishCampaign(
    parsedData: CampaignParsedData,
    existingCampaignId?: string
  ): Promise<CampaignPublishResult> {
    const campaignId = existingCampaignId || `camp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const slug = this.slugify(parsedData.title);

    const campaignObj: PromotionCampaign = {
      id: campaignId,
      title: parsedData.title,
      slug,
      subtitle: parsedData.subtitle,
      theme: parsedData.theme,
      description: parsedData.subtitle,
      terms_conditions: parsedData.terms_conditions,
      banner_image: parsedData.cropped_banners.desktop,
      desktop_banner: parsedData.cropped_banners.desktop,
      mobile_banner: parsedData.cropped_banners.mobile,
      start_date: parsedData.start_date,
      end_date: parsedData.end_date,
      campaign_type: parsedData.campaign_type,
      priority: parsedData.campaign_type === 'FLASH_SALE' ? 15 : 10,
      status: 'ACTIVE',
      primary_color: parsedData.primary_color,
      secondary_color: parsedData.secondary_color,
      created_at: new Date().toISOString()
    };

    await dataService.savePromotionCampaign(campaignObj);

    let createdProductsCount = 0;
    let updatedProductsCount = 0;

    const promoProductsBatch: PromotionProduct[] = [];
    const promoBannersBatch: PromotionBanner[] = [
      {
        id: `pb_${campaignId}_hero_desktop`,
        campaign_id: campaignId,
        banner_type: 'HERO_DESKTOP',
        image: parsedData.cropped_banners.desktop,
        alt_text: `${parsedData.title} Desktop Hero`,
        target_url: `/campaign/${slug}`,
        display_order: 1,
        is_active: true
      },
      {
        id: `pb_${campaignId}_hero_mobile`,
        campaign_id: campaignId,
        banner_type: 'HERO_MOBILE',
        image: parsedData.cropped_banners.mobile,
        alt_text: `${parsedData.title} Mobile Hero`,
        target_url: `/campaign/${slug}`,
        display_order: 1,
        is_active: true
      }
    ];

    for (let i = 0; i < parsedData.extracted_products.length; i++) {
      const item = parsedData.extracted_products[i];
      const decision = item.action || (item.matched_product ? 'UPDATE_PROMO' : 'CREATE_NEW');

      if (decision === 'IGNORE') continue;

      let resolvedProduct = item.matched_product;

      if (decision === 'CREATE_NEW' || !resolvedProduct) {
        const basePrice = item.flyer_original_price || Math.round(item.flyer_promo_price * 1.25);
        const prodSlug = this.slugify(item.raw_name) || `prod-${Date.now()}`;
        resolvedProduct = await dataService.saveProduct({
          id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          category_id: 'c2222222-2222-2222-2222-222222222222',
          category: 'Promo Merchant',
          name: item.raw_name,
          slug: prodSlug,
          brand: item.brand || 'Generik',
          unit: item.size || 'pcs',
          price: basePrice,
          promo_price: item.flyer_promo_price,
          is_promo: true,
          is_available: true,
          is_featured: true,
          stock_status: 'in_stock',
          image_url: item.crop_image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
          purchase_method: 'owner_checkout',
          notes: `Dibuat via Flyer Campaign: ${parsedData.title}`
        });
        item.matched_product = resolvedProduct;
        item.match_status = 'MATCHED_EXACT';
        createdProductsCount++;
      } else if (decision === 'UPDATE_PROMO' && resolvedProduct) {
        await PriceUpdateEngine.activateCampaignPromotion(
          resolvedProduct,
          campaignObj,
          item.flyer_promo_price
        );
        updatedProductsCount++;
      }

      if (resolvedProduct) {
        const base = resolvedProduct.price;
        const promo = item.flyer_promo_price;
        const discAmt = Math.max(0, base - promo);
        const discPct = Math.round((discAmt / base) * 100 * 10) / 10;

        promoProductsBatch.push({
          id: `pp_${Date.now()}_${i}`,
          campaign_id: campaignId,
          product_id: resolvedProduct.id,
          base_price: base,
          promo_price: promo,
          discount_amount: discAmt,
          discount_percentage: discPct,
          badge: `Diskon ${discPct}% • ${parsedData.title}`,
          display_order: i + 1,
          is_active: true,
          product_name: resolvedProduct.name,
          product_brand: resolvedProduct.brand,
          product_image: resolvedProduct.image_url
        });
      }
    }

    await dataService.savePromotionProductsBatch(promoProductsBatch);
    await dataService.savePromotionBannersBatch(promoBannersBatch);

    ImportEventBus.emit('PromotionActivated', {
      campaignId,
      title: parsedData.title,
      productsCount: promoProductsBatch.length
    });

    return {
      campaign: campaignObj,
      publishedProductsCount: promoProductsBatch.length,
      createdProductsCount,
      updatedProductsCount
    };
  }

  /**
   * 3. Price Evaluation Engine Delegation
   */
  static async evaluateEffectiveProductPrice(product: Product): Promise<CalculatedPromotionPrice> {
    const campaigns = await dataService.fetchPromotionCampaigns();
    const promoProducts = await dataService.fetchPromotionProducts();
    return PriceUpdateEngine.calculateEffectivePrice(product, campaigns, promoProducts);
  }

  /**
   * 4. Promotion Rules Evaluation
   */
  static evaluateCartRules(
    rule: Partial<PromotionRule>,
    context: RuleEvaluationContext
  ): PromotionRuleEvaluationResult {
    return PromotionRulesEngine.evaluateRules(rule, context);
  }

  /**
   * 5. Placement & Banner Surface Resolution
   */
  static async getBannersForPlacement(
    placementType: PlacementType,
    categoryId?: string
  ): Promise<PromotionBanner[]> {
    return PromotionPlacementEngine.getBannersForPlacement(placementType, categoryId);
  }

  /**
   * 6. Automated Lifecycle Sync & Scheduler
   */
  static async syncCampaignLifecycles(): Promise<{ activatedCount: number; restoredCount: number }> {
    const lifecycleResult = await CampaignLifecycleService.checkAndSyncCampaignLifecycles();
    await CampaignSchedulerService.runAutomatedScheduler();
    return lifecycleResult;
  }

  /**
   * 7. RAG Knowledge Chunks Generation for AI Assistant
   */
  static async getPromotionKnowledge(): Promise<CampaignKnowledgeChunk[]> {
    return PromotionKnowledgeEngine.getActiveCampaignKnowledge();
  }

  /**
   * 8. AI Responsive Banner Variants Generator
   */
  static generateAIBannerVariants(
    campaignId: string,
    sourceImageUrl: string,
    campaignTitle: string
  ) {
    return AIBannerEnhancementEngine.generateAllVariants(campaignId, sourceImageUrl, campaignTitle);
  }

  /**
   * 9. Campaign Analytics & Tracking
   */
  static async getAnalytics(campaignId: string) {
    return CampaignAnalyticsEngine.getAnalytics(campaignId);
  }

  static async trackImpression(campaignId: string) {
    return CampaignAnalyticsEngine.trackImpression(campaignId);
  }

  static async trackClick(campaignId: string) {
    return CampaignAnalyticsEngine.trackClick(campaignId);
  }

  /**
   * Helper: Slugifier
   */
  private static slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || `campaign-${Date.now()}`;
  }
}
