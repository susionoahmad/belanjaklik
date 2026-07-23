import type { Product } from '../../shared/types';

export type CampaignType = 'DISCOUNT' | 'FLASH_SALE' | 'FAIR' | 'WEEKEND_PROMO' | 'CLEARANCE' | 'SEASONAL';
export type CampaignStatus = 'DRAFT' | 'NEEDS_REVIEW' | 'PUBLISHED' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
export type BannerType = 'HERO_DESKTOP' | 'HERO_MOBILE' | 'THUMBNAIL' | 'HOMEPAGE_SLIDER' | 'CATEGORY_HEADER' | 'POPUP';
export type MatchStatus = 'MATCHED_EXACT' | 'MATCHED_SIMILAR' | 'UNMATCHED_REQUIRES_CATALOG_PRODUCT';

export interface PromotionCampaign {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  theme?: string;
  description?: string;
  terms_conditions?: string;
  banner_image?: string;
  mobile_banner?: string;
  desktop_banner?: string;
  start_date: string;
  end_date: string;
  campaign_type: CampaignType;
  priority: number; // e.g. 10 high priority, 1 low priority
  status: CampaignStatus;
  primary_color?: string;
  secondary_color?: string;
  created_at: string;
}

export interface PromotionProduct {
  id: string;
  campaign_id: string;
  product_id: string;
  base_price: number;
  promo_price: number;
  discount_amount: number;
  discount_percentage: number;
  badge?: string;
  display_order: number;
  is_active: boolean;
  product_name?: string;
  product_brand?: string;
  product_image?: string;
}

export interface PromotionBanner {
  id: string;
  campaign_id: string;
  banner_type: BannerType;
  image: string;
  alt_text: string;
  target_url: string;
  display_order: number;
  is_active: boolean;
}

export interface PriceHistoryRecord {
  id: string;
  product_id: string;
  campaign_id?: string;
  product_name: string;
  old_base_price: number;
  new_promo_price: number;
  discount_percentage: number;
  change_type: 'CAMPAIGN_ACTIVATED' | 'CAMPAIGN_EXPIRED' | 'BASE_PRICE_UPDATED' | 'MANUAL_RESTORE';
  timestamp: string;
  notes?: string;
}

export type FlyerProductAction = 'UPDATE_PROMO' | 'CREATE_NEW' | 'IGNORE';

export interface ExtractedFlyerProduct {
  id: string;
  raw_name: string;
  brand?: string;
  size?: string;
  variant?: string;
  flyer_promo_price: number;
  flyer_original_price?: number;
  discount_badge?: string;
  crop_image_url?: string;
  matched_product?: Product;
  match_status: MatchStatus;
  match_confidence: number;
  action?: FlyerProductAction; // Admin decision per product row
}

export interface CampaignParsedData {
  title: string;
  subtitle?: string;
  theme?: string;
  start_date: string;
  end_date: string;
  campaign_type: CampaignType;
  terms_conditions?: string;
  primary_color?: string;
  secondary_color?: string;
  extracted_products: ExtractedFlyerProduct[];
  cropped_banners: {
    desktop: string;
    mobile: string;
    thumbnail: string;
  };
}

export interface CampaignReviewItem {
  id: string;
  sessionId: string;
  parsedData: CampaignParsedData;
  flyerImageUrl: string;
  status: 'NEEDS_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'REJECTED';
}
