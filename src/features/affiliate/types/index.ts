export interface AffiliateProduct {
  id: string;
  source: string;
  merchant: 'shopee' | 'tiktok_shop' | 'tokopedia' | string;
  campaign_id: string;
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
