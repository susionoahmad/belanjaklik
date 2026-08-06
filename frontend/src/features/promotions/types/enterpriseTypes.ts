export type CampaignLifecycleStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'ENDING_SOON' | 'EXPIRED' | 'ARCHIVED';

export type PlacementType = 
  | 'HOMEPAGE_HERO'
  | 'HOMEPAGE_SLIDER'
  | 'CATEGORY_BANNER'
  | 'PRODUCT_DETAIL'
  | 'SEARCH_RESULT'
  | 'RECOMMENDATION_SECTION'
  | 'SHOPPING_CART'
  | 'CHECKOUT_PAGE'
  | 'MOBILE_APP_HOME'
  | 'PUSH_NOTIFICATION_BANNER';

export type NotificationChannel = 'PUSH' | 'EMAIL' | 'WHATSAPP' | 'SMS' | 'IN_APP' | 'WEB';

export interface CampaignSchedule {
  start_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_date: string;   // YYYY-MM-DD
  end_time: string;   // HH:mm
  timezone: string;   // e.g. 'Asia/Jakarta'
  auto_unpublish: boolean;
  lifecycle_status: CampaignLifecycleStatus;
}

export interface CampaignPlacement {
  id: string;
  campaign_id: string;
  placement_type: PlacementType;
  display_priority: number;
  is_active: boolean;
  target_category_id?: string;
  custom_badge_text?: string;
}

export interface PromotionRule {
  id: string;
  campaign_id: string;
  min_purchase_amount?: number;
  member_only: boolean;
  allowed_regions?: string[]; // e.g. ['DKI Jakarta', 'Jawa Barat']
  payment_methods?: string[]; // e.g. ['QRIS', 'COD', 'TRANSFER']
  customer_segments?: string[]; // e.g. ['NEW_USER', 'VIP_MEMBER']
  time_window_start?: string; // HH:mm (e.g. Happy Hour 14:00)
  time_window_end?: string;   // HH:mm (e.g. 17:00)
  max_redemptions?: number;
  current_redemptions: number;
  per_customer_limit?: number;
}

export type BannerVariantType = 
  | 'DESKTOP_HERO'
  | 'MOBILE_HERO'
  | 'HOMEPAGE_SLIDER'
  | 'CATEGORY_BANNER'
  | 'SIDEBAR_BANNER'
  | 'POPUP_BANNER'
  | 'THUMBNAIL'
  | 'APP_BANNER';

export interface BannerVariant {
  id: string;
  campaign_id: string;
  variant_type: BannerVariantType;
  width: number;
  height: number;
  image_url: string;
  text_safe_area: { top: number; left: number; width: number; height: number };
  is_ai_enhanced: boolean;
  alt_text: string;
}

export interface CampaignTemplate {
  template_id: string;
  name: string;
  description: string;
  campaign_type: string;
  default_color_theme: { primary: string; secondary: string };
  default_banner_layout: string;
  preloaded_rules: Partial<PromotionRule>;
}

export interface SEOMarketingMeta {
  seo_title: string;
  meta_description: string;
  meta_keywords: string[];
  og_title: string;
  og_description: string;
  og_image: string;
  twitter_card: string;
  canonical_url: string;
  json_ld_schema: Record<string, any>;
}

export interface CampaignAnalytics {
  campaign_id: string;
  impressions: number;
  banner_clicks: number;
  landing_page_visits: number;
  ctr_percentage: number;
  products_clicked: number;
  cart_additions: number;
  orders_count: number;
  total_revenue: number;
  total_discount_given: number;
  conversion_rate: number;
  roi_percentage: number;
}

export interface ABTestExperiment {
  id: string;
  campaign_id: string;
  experiment_name: string;
  variant_a_name: string;
  variant_a_url: string;
  variant_b_name: string;
  variant_b_url: string;
  clicks_a: number;
  clicks_b: number;
  impressions_a: number;
  impressions_b: number;
  ctr_a: number;
  ctr_b: number;
  status: 'RUNNING' | 'CONCLUDED';
  winner_variant?: 'VARIANT_A' | 'VARIANT_B';
  recommendation_reason?: string;
}

export interface CampaignAsset {
  id: string;
  campaign_id: string;
  asset_type: 'ORIGINAL_FLYER' | 'DESKTOP_BANNER' | 'MOBILE_BANNER' | 'THUMBNAIL' | 'LOGO' | 'BACKGROUND' | 'COLOR_PALETTE';
  file_url: string;
  file_size?: number;
  created_at: string;
}

export interface PromotionNotification {
  id: string;
  campaign_id: string;
  title: string;
  message: string;
  channels: NotificationChannel[];
  scheduled_at: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sent_count: number;
}
