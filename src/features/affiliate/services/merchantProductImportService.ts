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

const inferCategory = (metadata: { name?: string; description?: string; category?: string }): string | undefined => {
  if (metadata.category?.trim()) return metadata.category.trim();
  const text = (metadata.name || '') + ' ' + (metadata.description || '');
  if (/mesin cuci|kulkas|vacuum|setrika|dispenser|peralatan rumah|cleaning|tissue|sabun|deterjen/i.test(text)) return 'Rumah Tangga';
  if (/laptop|komputer|handphone|smartphone|tablet|televisi|tv |kamera|headphone|earphone|speaker|charger/i.test(text)) return 'Gadget & Elektronik';
  if (/makeup|skincare|kosmetik|parfum|shampoo|sabun wajah|beauty/i.test(text)) return 'Kecantikan & Skincare';
  if (/popok|bayi|baby|mainan anak|susu formula/i.test(text)) return 'Ibu & Bayi';
  if (/peralatan elektronik|electronic appliance|mesin elektronik|kettle listrik|ketel listrik|toaster listrik|peralatan listrik|toaster|kettle|rice cooker|magic com|electric kettle|sandwich maker|air fryer|microwave|microwave oven|air cooler|water heater/i.test(text)) return 'Peralatan Elektronik'
  if (/panci|wajan|blender|rice cooker|dapur|makanan|minuman|snack/i.test(text)) return 'Dapur & Kuliner';
  if (/baju|kaos|sepatu|sandal|hijab|fashion|tas|dompet/i.test(text)) return 'Fashion & Hijab';
  return undefined;
};
const detectMerchant = (url: string): string => {
  const source = url.toLowerCase();
  const host = new URL(url).hostname.toLowerCase();
  if (source.includes('blibli')) return 'blibli';
  if (host.includes('shopee')) return 'shopee';
  if (host.includes('tokopedia')) return 'tokopedia';
  if (host.includes('blibli')) return 'blibli';
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
    merchant: data.merchant && data.merchant !== 'other' ? data.merchant : detectMerchant(data.product_url || normalizedUrl),
    category: inferCategory(data),
    product_url: normalizedUrl,
    affiliate_url: `https://accesstrade.co.id/click?site_id=${siteId}&url=${encodeURIComponent(normalizedUrl)}&sub_id=belanjaklik_app`,
    site_id: siteId
  };
}