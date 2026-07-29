import { supabase, isSupabaseConfigured } from '@/features/shared/db/supabaseClient';
import { AccesstradeService } from './AccesstradeService';

export interface MerchantProductMetadata {
  name?: string;
  description?: string;
  image_url?: string;
  price?: number;
  original_price?: number;
  shop_name?: string;
  category?: string;
  merchant?: string;
  product_url: string;
  affiliate_url: string;
  site_id: string;
}

const detectMerchant = (url: string): string => {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes('shopee')) return 'shopee';
  if (host.includes('tokopedia')) return 'tokopedia';
  if (host.includes('lazada')) return 'lazada';
  if (host.includes('tiktok')) return 'tiktok_shop';
  return 'other';
};

export async function importMerchantProductFromUrl(productUrl: string): Promise<MerchantProductMetadata> {
  const normalizedUrl = productUrl.trim();
  try {
    new URL(normalizedUrl);
  } catch {
    throw new Error('URL produk tidak valid. Gunakan URL lengkap dengan https://');
  }

  if (!isSupabaseConfigured) {
    throw new Error('Supabase belum dikonfigurasi, sehingga metadata merchant belum dapat dibaca.');
  }

  const { data, error } = await supabase.functions.invoke('merchant-product-metadata', {
    body: { url: normalizedUrl }
  });
  if (error) throw new Error(error.message || 'Gagal membaca metadata produk merchant.');
  if (!data?.product_url) throw new Error('Merchant tidak mengembalikan metadata produk yang valid.');

  const siteId = '127950';
  return {
    ...data,
    merchant: data.merchant || detectMerchant(normalizedUrl),
    product_url: normalizedUrl,
    affiliate_url: `https://accesstrade.co.id/click?site_id=${siteId}&url=${encodeURIComponent(normalizedUrl)}&sub_id=belanjaklik_app`,
    site_id: siteId
  };
}