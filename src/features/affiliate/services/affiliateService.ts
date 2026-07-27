import { supabase, isSupabaseConfigured } from '@/features/shared/db/supabaseClient';
import type { AffiliateProduct } from '../types';

const OFFLINE_AFFILIATE_KEY = 'psa_offline_affiliate_products';

function getOfflineProducts(): AffiliateProduct[] {
  try {
    const raw = localStorage.getItem(OFFLINE_AFFILIATE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveOfflineProducts(products: AffiliateProduct[]): void {
  try {
    localStorage.setItem(OFFLINE_AFFILIATE_KEY, JSON.stringify(products));
  } catch (e) {}
}

export async function getActiveAffiliateProducts(options?: {
  limit?: number;
  category?: string;
  merchant?: string;
}): Promise<AffiliateProduct[]> {
  if (!isSupabaseConfigured) {
    let list = getOfflineProducts().filter(p => p.is_active);
    if (options?.merchant) list = list.filter(p => p.merchant === options.merchant);
    if (options?.category) list = list.filter(p => p.category === options.category);
    if (options?.limit) list = list.slice(0, options.limit);
    return list;
  }

  try {
    let query = supabase
      .from('affiliate_products')
      .select('*')
      .eq('is_active', true)
      .order('last_synced_at', { ascending: false });

    if (options?.merchant) {
      query = query.eq('merchant', options.merchant);
    }
    if (options?.category) {
      query = query.eq('category', options.category);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error || !data) {
      console.warn('[AffiliateService] Error fetching active products from Supabase, falling back to local storage:', error);
      return getOfflineProducts().filter(p => p.is_active);
    }
    return data;
  } catch (err) {
    console.warn('[AffiliateService] Exception fetching active products:', err);
    return getOfflineProducts().filter(p => p.is_active);
  }
}

export async function getAllAffiliateProductsAdmin(): Promise<AffiliateProduct[]> {
  const localList = getOfflineProducts();

  if (!isSupabaseConfigured) {
    return localList;
  }

  try {
    const { data, error } = await supabase
      .from('affiliate_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('[AffiliateService] Error fetching admin products from Supabase:', error);
      return localList;
    }

    // Merge Supabase products with local items that haven't synced yet
    const mergedMap = new Map<string, AffiliateProduct>();
    data.forEach(p => mergedMap.set(p.id, p));
    localList.forEach(p => {
      if (!mergedMap.has(p.id)) {
        mergedMap.set(p.id, p);
      }
    });

    return Array.from(mergedMap.values());
  } catch (err) {
    console.warn('[AffiliateService] Exception fetching admin products:', err);
    return localList;
  }
}

export async function getAffiliateProductBySlug(slug: string): Promise<AffiliateProduct | null> {
  if (!isSupabaseConfigured || !slug) {
    return getOfflineProducts().find(p => p.slug === slug) || null;
  }

  try {
    const { data, error } = await supabase
      .from('affiliate_products')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) {
      return getOfflineProducts().find(p => p.slug === slug) || null;
    }
    return data;
  } catch (err) {
    return getOfflineProducts().find(p => p.slug === slug) || null;
  }
}

export async function getRelatedAffiliateProducts(
  category?: string | null,
  excludeId?: string,
  limit = 4
): Promise<AffiliateProduct[]> {
  if (!isSupabaseConfigured) {
    return getOfflineProducts()
      .filter(p => p.is_active && p.id !== excludeId)
      .slice(0, limit);
  }

  try {
    let query = supabase
      .from('affiliate_products')
      .select('*')
      .eq('is_active', true)
      .order('last_synced_at', { ascending: false });

    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    if (category) {
      query = query.eq('category', category);
    }
    query = query.limit(limit);

    const { data, error } = await query;
    if (error) {
      return [];
    }

    if ((!data || data.length < limit) && category) {
      const { data: fallbackData } = await supabase
        .from('affiliate_products')
        .select('*')
        .eq('is_active', true)
        .neq('id', excludeId || '')
        .order('last_synced_at', { ascending: false })
        .limit(limit);
      return fallbackData || data || [];
    }

    return data || [];
  } catch (err) {
    return [];
  }
}

export async function saveAffiliateProduct(payload: Partial<AffiliateProduct>): Promise<AffiliateProduct | null> {
  const now = new Date().toISOString();
  
  // Calculate discount_percent if price and original_price exist
  let discount_percent = payload.discount_percent;
  if (payload.original_price && payload.price && payload.original_price > payload.price) {
    discount_percent = Math.round(((payload.original_price - payload.price) / payload.original_price) * 100);
  }

  // Generate & cap slug length (max 90 chars)
  let slug = payload.slug?.trim();
  if (slug && slug.length > 90) {
    slug = slug.substring(0, 90).replace(/-+$/, '');
  }
  if (!slug && payload.name) {
    let base = payload.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (base.length > 70) base = base.substring(0, 70).replace(/-+$/, '');
    slug = base + '-' + Date.now().toString(36);
  }

  const cleanData: Partial<AffiliateProduct> = {
    ...payload,
    merchant: payload.merchant || 'other',
    source: payload.source || 'manual_link',
    campaign_id: payload.campaign_id?.trim() || 'manual',
    external_product_id: payload.external_product_id?.trim() || null,
    name: payload.name?.trim() || 'Produk Afiliasi',
    slug: slug || undefined,
    description: payload.description?.trim() || null,
    image_url: payload.image_url?.trim() || null,
    product_url: payload.product_url?.trim() || null,
    affiliate_url: payload.affiliate_url?.trim() || '',
    price: payload.price !== undefined && payload.price !== null ? Number(payload.price) : null,
    original_price: payload.original_price !== undefined && payload.original_price !== null ? Number(payload.original_price) : null,
    discount_percent: discount_percent ?? null,
    commission_rate: payload.commission_rate !== undefined && payload.commission_rate !== null ? Number(payload.commission_rate) : null,
    shop_name: payload.shop_name?.trim() || null,
    category: payload.category?.trim() || null,
    is_active: payload.is_active ?? true,
    updated_at: now,
    last_synced_at: now
  };

  // Helper to save offline
  const saveToLocal = (item: Partial<AffiliateProduct>): AffiliateProduct => {
    const list = getOfflineProducts();
    const savedItem: AffiliateProduct = {
      id: item.id || ('aff-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7)),
      created_at: now,
      ...cleanData
    } as AffiliateProduct;
    const idx = list.findIndex(p => p.id === savedItem.id);
    if (idx !== -1) list[idx] = savedItem;
    else list.unshift(savedItem);
    saveOfflineProducts(list);
    return savedItem;
  };

  if (!isSupabaseConfigured) {
    return saveToLocal(payload);
  }

  try {
    if (payload.id) {
      const { data, error } = await supabase
        .from('affiliate_products')
        .update(cleanData)
        .eq('id', payload.id)
        .select();

      if (error || !data || data.length === 0) {
        console.warn('[AffiliateService] Supabase update returned 0 rows or RLS blocked (Status 406/403), saving locally:', error);
        return saveToLocal(payload);
      }
      saveToLocal(data[0]);
      return data[0];
    } else {
      const { data, error } = await supabase
        .from('affiliate_products')
        .insert({ created_at: now, ...cleanData })
        .select();

      if (error || !data || data.length === 0) {
        console.warn('[AffiliateService] Supabase insert failed or RLS blocked, saving locally:', error);
        return saveToLocal(payload);
      }
      saveToLocal(data[0]);
      return data[0];
    }
  } catch (err) {
    console.warn('[AffiliateService] Exception saving product to Supabase, falling back to local:', err);
    return saveToLocal(payload);
  }
}

export async function deleteAffiliateProduct(id: string): Promise<boolean> {
  if (!id) return false;

  // Always sync local storage
  const list = getOfflineProducts().filter(p => p.id !== id);
  saveOfflineProducts(list);

  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase
      .from('affiliate_products')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('[AffiliateService] Error deleting product from Supabase:', error);
    }
    return true;
  } catch (err) {
    console.warn('[AffiliateService] Exception deleting product:', err);
    return true;
  }
}

export async function toggleAffiliateProductStatus(id: string, is_active: boolean): Promise<boolean> {
  if (!id) return false;
  return !!(await saveAffiliateProduct({ id, is_active }));
}

export async function trackAffiliateClick(productId: string): Promise<void> {
  if (!isSupabaseConfigured || !productId) return;
  try {
    await supabase.from('affiliate_clicks').insert({ product_id: productId });
  } catch (err) {
    console.error('[AffiliateService] Failed to track affiliate click:', err);
  }
}
