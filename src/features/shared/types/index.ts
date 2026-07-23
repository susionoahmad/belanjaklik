export type PurchaseMethod = 'self_checkout' | 'owner_checkout' | 'quote_request' | 'coming_soon';

export interface FulfillmentChannel {
  id: string;
  name: string;
  slug: string;
  base_url?: string | null;
  icon_url?: string | null;
  logo?: string | null;
  description?: string;
  settings?: {
    open_new_tab?: boolean;
    allow_cart?: boolean;
    allow_whatsapp?: boolean;
    show_price?: boolean;
    show_stock?: boolean;
  };
  is_active: boolean;
  sort_order?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  sort_order: number;
}

export type SyncStatus = 'pending' | 'synced' | 'failed' | 'paused';

export interface ProductSource {
  id: string;
  product_id?: string;
  source_url: string;
  provider: string;
  external_product_code: string;
  sync_status: SyncStatus;
  last_synced_at?: string;
  next_sync_at?: string;
  sync_interval_hours: number;
  last_error?: string;
  created_at?: string;
  updated_at?: string;
  // Included populated product metadata for UI display
  product_name?: string;
  product_price?: number;
  product_image_url?: string;
}

export interface Product {
  id: string;
  category_id?: string;
  category?: string;
  channel_id?: string;
  name: string;
  slug: string;
  brand?: string;
  barcode?: string;
  description?: string;
  unit: string;
  price: number;
  promo_price?: number;
  is_promo?: boolean;
  is_featured?: boolean;
  is_popular?: boolean;
  is_available?: boolean;
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  thumbnail_url?: string;
  image_url?: string;
  images?: string[];
  search_keywords?: string;
  weight?: string;
  notes?: string;
  purchase_method: PurchaseMethod;
  external_product_code?: string | null;
  sort_order?: number;
}

export interface PromoFile {
  id: string;
  title: string;
  file_url: string;
  file_type: 'image' | 'pdf' | 'excel';
  start_date?: string;
  end_date?: string;
  status: 'active' | 'archived';
  ocr_status?: 'pending' | 'completed' | 'failed';
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  item_notes?: string;
}

export interface CustomerDetails {
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_notes?: string;
  preferred_delivery_time?: string;
  fulfillment_channel_id?: string;
}

export interface ShoppingRequest {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_notes?: string;
  preferred_delivery_time?: string;
  subtotal: number;
  estimated_total: number;
  fulfillment_channel_id?: string;
  status: 'sent_whatsapp' | 'pending' | 'completed';
  created_at: string;
  items: Array<{
    product_id?: string;
    product_name: string;
    brand?: string;
    price: number;
    quantity: number;
    unit: string;
    notes?: string;
  }>;
}

export interface ShoppingTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  is_active: boolean;
  items: Array<{
    product_name: string;
    quantity: number;
    default_price: number;
    unit: string;
  }>;
}

export interface StoreProfile {
  name: string;
  phone: string;
  owner: string;
  address: string;
  business_hours: string;
  delivery_info: string;
}
