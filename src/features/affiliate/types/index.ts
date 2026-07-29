export interface AffiliateProduct {
  id: string;
  source: string;
  merchant: 'shopee' | 'tiktok_shop' | 'tokopedia' | string;
  vertical: 'marketplace' | 'travel' | 'digital' | string;
  subcategory?: string | null;
  offer_type?: 'product' | 'booking' | 'service' | 'application' | string;
  campaign_name?: string | null;
  advertiser_name?: string | null;
  campaign_id: string;
  site_id?: string | null;
  site_url?: string | null;
  external_product_id?: string | null;
  name: string;
  slug?: string | null;
  description?: string | null;
  image_url?: string | null;
  product_url?: string | null;
  affiliate_url: string;
  price?: number | null;
  original_price?: number | null;
  discount_percent?: number | null;
  commission_rate?: number | null;
  shop_name?: string | null;
  category?: string | null;
  is_active: boolean;
  item_sold?: number | null;
  item_rating?: number | null;
  raw_data?: any;
  last_synced_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AffiliateClick {
  id: string;
  product_id?: string | null;
  clicked_at: string;
}

