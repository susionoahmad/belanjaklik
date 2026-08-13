import { supabase, isSupabaseConfigured } from '@/features/shared/db/supabaseClient';
import type { AffiliateProduct } from '../types';
import { extractSiteIdFromAffiliateUrl, normaliseSiteId } from './affiliateLinkUtils';
import { fetchLocalAffiliateProducts, getApiBaseUrl } from '@/features/shared/db/localApi';

const OFFLINE_AFFILIATE_KEY = 'psa_offline_affiliate_products';

const matchesMerchant = (productMerchant: string | undefined, merchant: string): boolean =>
  (productMerchant || '').trim().toLowerCase() === merchant.trim().toLowerCase();

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
  page?: number;
  limit?: number;
  sort?: 'latest' | 'sold' | 'discount' | 'price_low' | 'price_high';
  category?: string;
  merchant?: string;
  vertical?: string;
  subcategory?: string;
  search?: string;
  mixMerchants?: boolean;
}): Promise<AffiliateProduct[]> {
  try {
    const fetchLimit = options?.limit || 40;
    const page = options?.page || 1;
    const local = await fetchLocalAffiliateProducts({ 
      page, 
      limit: fetchLimit, 
      merchant: options?.merchant, 
      vertical: options?.vertical, 
      category: options?.category, 
      search: options?.search, 
      sort: options?.sort 
    });
    if (local.data && Array.isArray(local.data) && local.data.length > 0) {
      return local.data as AffiliateProduct[];
    }
  } catch (err) {
    console.warn('[AffiliateService] Local API unavailable, using fallback:', err);
  }
  if (!isSupabaseConfigured) {
    let list = getOfflineProducts().filter(p => p.is_active);
    if (options?.merchant) list = list.filter(p => matchesMerchant(p.merchant, options.merchant!));
    if (options?.vertical) list = list.filter(p => p.vertical === options.vertical);
    if (options?.subcategory) list = list.filter(p => p.subcategory === options.subcategory);
    if (options?.category) list = list.filter(p => p.category === options.category);
    if (options?.search) {
      const search = options.search.trim().toLowerCase();
      list = list.filter(p => [p.name, p.category, p.shop_name, p.brand].some(value => value?.toLowerCase().includes(search)));
    }
    if (options?.limit) list = list.slice(0, options.limit);
    return list;
  }

  try {
    const fetchLimit = options?.limit || 40;

    if (options?.mixMerchants && options?.vertical && !options?.merchant) {
      const merchants = options.vertical === 'marketplace'
        ? ['shopee', 'tokopedia', 'blibli']
        : options.vertical === 'travel'
          ? ['traveloka']
          : [];
      if (merchants.length > 0) {
        const perMerchant = Math.ceil(fetchLimit / merchants.length);
        const responses = await Promise.all(merchants.map(merchant =>
          supabase
            .from('affiliate_products')
            .select('*')
            .eq('is_active', true)
            .eq('merchant', merchant)
            .eq('vertical', options.vertical)
            .order('last_synced_at', { ascending: false })
            .limit(perMerchant)
        ));
        const lists = responses.map(response => response.data || []);
        const combined: AffiliateProduct[] = [];
        const maxLen = Math.max(...lists.map(list => list.length), 0);
        for (let i = 0; i < maxLen; i++) {
          for (const list of lists) {
            if (i < list.length) combined.push(list[i]);
          }
        }
        if (combined.length > 0) return combined.slice(0, fetchLimit);
      }
    }

    if (options?.mixMerchants || !options?.merchant) {
      const perVertical = Math.ceil(fetchLimit / 3);
      const verticals = ['marketplace', 'travel', 'digital'];
      const responses = await Promise.all(verticals.map(vertical => {
        let query = supabase
          .from('affiliate_products')
          .select('*')
          .eq('is_active', true);
        query = vertical === 'marketplace'
          ? query.or('vertical.eq.marketplace,vertical.is.null')
          : query.eq('vertical', vertical);
        return query
          .order('last_synced_at', { ascending: false })
          .limit(perVertical);
      }));

      const lists = responses.map(response => response.data || []);
      const combined: AffiliateProduct[] = [];
      const maxLen = Math.max(...lists.map(list => list.length), 0);
      for (let i = 0; i < maxLen; i++) {
        for (const list of lists) {
          if (i < list.length) combined.push(list[i]);
        }
      }
      if (combined.length > 0) return combined.slice(0, fetchLimit);
    }

    let query = supabase
      .from('affiliate_products')
      .select('*')
      .eq('is_active', true)
      .order('discount_percent', { ascending: false, nullsFirst: false })
      .order('last_synced_at', { ascending: false });

    if (options?.merchant) {
      query = query.ilike('merchant', options.merchant);
    }
    if (options?.category) {
      query = query.eq('category', options.category);
    }
    if (options?.search) {
      const search = options.search.trim();
      query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%,shop_name.ilike.%${search}%,brand.ilike.%${search}%`);
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

export async function getAffiliateProductByIdAdmin(id: string): Promise<AffiliateProduct | null> {
  if (!id) return null;
  const offline = getOfflineProducts().find(p => p.id === id) || null;
  if (!isSupabaseConfigured) {
    return offline;
  }

  try {
    const { data, error } = await supabase
      .from('affiliate_products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.warn('[AffiliateService] Error fetching single admin product from Supabase:', error);
      return offline;
    }

    return data as AffiliateProduct;
  } catch (err) {
    console.warn('[AffiliateService] Exception fetching single admin product:', err);
    return offline;
  }
}

export async function getAffiliateProductsCount(options?: { is_active?: boolean }): Promise<number> {
  // 1. Try Go Backend API (Local / GCP VM) - short timeout so it never blocks the UI
  try {
    const local = await fetchLocalAffiliateProducts({ page: 1, limit: 1, active: options?.is_active === true ? 'active' : 'all', timeoutMs: 5000, retries: 0 });
    if (local && typeof local.total === 'number') {
      return local.total;
    }
  } catch (err) {
    console.warn('[AffiliateService] Local API product count failed, trying fallback:', err);
  }

  // 2. Fallback to Supabase / localStorage
  if (!isSupabaseConfigured) {
    let list = getOfflineProducts();
    if (options?.is_active !== undefined) {
      list = list.filter(p => p.is_active === options.is_active);
    }
    return list.length;
  }

  try {
    let query = supabase.from('affiliate_products').select('*', { count: 'exact', head: true });
    if (options?.is_active !== undefined) {
      query = query.eq('is_active', options.is_active);
    }
    const { count, error } = await query;
    if (error) {
      console.warn('[AffiliateService] Error fetching product count:', error);
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    console.warn('[AffiliateService] Exception fetching product count:', err);
    return 0;
  }
}

export async function getAffiliateProductBySlug(slug: string): Promise<AffiliateProduct | null> {
  if (!slug) return null;

  const mapItem = (found: any): AffiliateProduct => ({
    id: found.id,
    source: found.source || 'accesstrade',
    merchant: found.merchant || 'shopee',
    campaign_id: found.campaign_id || 'direct_csv',
    site_id: found.site_id || 'legacy',
    external_product_id: found.id,
    name: found.name,
    slug: found.slug || slug,
    description: found.description || found.name,
    image_url: found.image_url || found.thumbnail_url,
    product_url: found.product_url || found.affiliate_url,
    affiliate_url: found.affiliate_url || found.product_url,
    price: found.price,
    original_price: found.promo_price || found.price,
    discount_percent: found.discount_percent || 0,
    commission_rate: 0,
    shop_name: found.shop_name || '',
    category: found.category || 'General',
    vertical: found.vertical || 'marketplace',
    brand: found.brand || '',
    item_sold: found.item_sold || 0,
    item_rating: found.item_rating || 0,
    is_active: true,
  } as unknown as AffiliateProduct);

  // 1. Try Go Backend API (Local / GCP VM) by exact slug
  try {
    const apiBase = getApiBaseUrl();
    let res = await fetch(`${apiBase}/api/v1/affiliate-products?slug=${encodeURIComponent(slug)}&active=all&limit=1`);
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        return mapItem(json.data[0]);
      }
    }

    res = await fetch(`${apiBase}/api/v1/products?slug=${encodeURIComponent(slug)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        return mapItem(json.data[0]);
      }
    }

    // 1b. Fallback search by keyword derived from slug
    const keyword = slug.replace(/-/g, ' ').slice(0, 30);
    res = await fetch(`${apiBase}/api/v1/products?search=${encodeURIComponent(keyword)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        const matched = json.data.find((p: any) => p.slug === slug || (p.slug && slug.includes(p.slug.slice(0, 20)))) || json.data[0];
        return mapItem(matched);
      }
    }
  } catch (err) {
    console.warn('[AffiliateService] Local API slug lookup failed, falling back:', err);
  }

  // 2. Fallback to Supabase
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('affiliate_products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (!error && data) {
        return data as AffiliateProduct;
      }
    } catch (err) {}
  }

  return getOfflineProducts().find(p => p.slug === slug) || null;
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

export async function getAllAffiliateProductsAdmin(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  merchant?: string;
  vertical?: string;
  source?: string;
  sort?: string;
}): Promise<{ data: AffiliateProduct[]; total: number }> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 50;

  // 1. Try Go Backend API (Local / GCP VM) - short timeout, no retry for admin responsiveness
  try {
    const local = await fetchLocalAffiliateProducts({
      page,
      limit: pageSize,
      search: options?.search,
      merchant: options?.merchant,
      vertical: options?.vertical,
      sort: options?.sort,
      active: 'all',
      timeoutMs: 8000,
      retries: 0,
    });
    if (local && Array.isArray(local.data) && (local.data.length > 0 || (!options?.merchant && !options?.search))) {
      return { data: local.data as AffiliateProduct[], total: local.total };
    }
  } catch (err) {
    console.warn('[AffiliateService] Local API admin products fetch failed:', err);
  }

  // 2. Fallback to Supabase / localStorage
  const localList = getOfflineProducts();
  if (!isSupabaseConfigured) {
    let list = localList;
    if (options?.merchant) list = list.filter(p => matchesMerchant(p.merchant, options.merchant!));
    if (options?.vertical) list = list.filter(p => p.vertical === options.vertical);
    if (options?.source) list = list.filter(p => p.source === options.source);
    if (options?.search) {
      const s = options.search.toLowerCase();
      list = list.filter(p => p.name?.toLowerCase().includes(s));
    }
    list = sortAdminAffiliateList(list, options?.sort);
    const start = (page - 1) * pageSize;
    return { data: list.slice(start, start + pageSize), total: list.length };
  }

  try {
    const ADMIN_LIST_COLUMNS = `
      id, name, slug, image_url, merchant, vertical, subcategory,
      category, price, original_price, discount_percent, item_sold,
      item_rating, is_active, source, campaign_id, campaign_name,
      advertiser_name, site_id, created_at, updated_at, last_synced_at
    `;

    let query = supabase
      .from('affiliate_products')
      .select(ADMIN_LIST_COLUMNS, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (options?.merchant) query = query.ilike('merchant', options.merchant);
    if (options?.vertical) query = query.eq('vertical', options.vertical);
    if (options?.source) query = query.eq('source', options.source);
    if (options?.search) {
      const search = options.search.trim();
      query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%,shop_name.ilike.%${search}%,brand.ilike.%${search}%`);
    }

    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error || !data) {
      console.warn('[AffiliateService] Error fetching admin products from Supabase:', error);
      const start = (page - 1) * pageSize;
      return { data: localList.slice(start, start + pageSize), total: localList.length };
    }

    let result = data as AffiliateProduct[];
    if (page === 1 && localList.length > 0) {
      const existingIds = new Set(result.map(p => p.id));
      const unsyncedLocal = localList.filter(p => !existingIds.has(p.id));
      result = [...unsyncedLocal, ...result];
    }

    return { data: result, total: count ?? result.length };
  } catch (err) {
    console.warn('[AffiliateService] Exception fetching admin products:', err);
    const start = (page - 1) * pageSize;
    return { data: localList.slice(start, start + pageSize), total: localList.length };
  }
}

function sortAdminAffiliateList(list: AffiliateProduct[], sort?: string): AffiliateProduct[] {
  switch (sort) {
    case 'sold':
      return [...list].sort((a, b) => (b.item_sold ?? 0) - (a.item_sold ?? 0) || (b.created_at || '').localeCompare(a.created_at || ''));
    case 'discount':
      return [...list].sort((a, b) => (b.discount_percent ?? 0) - (a.discount_percent ?? 0) || (b.created_at || '').localeCompare(a.created_at || ''));
    case 'rating':
      return [...list].sort((a, b) => (b.item_rating ?? 0) - (a.item_rating ?? 0) || (b.item_sold ?? 0) - (a.item_sold ?? 0));
    case 'price_low':
      return [...list].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    case 'price_high':
      return [...list].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    default:
      return [...list].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  }
}

export async function saveAffiliateProduct(payload: Partial<AffiliateProduct>): Promise<AffiliateProduct | null> {
  const now = new Date().toISOString();
  
  let discount_percent = payload.discount_percent;
  if (payload.original_price && payload.price && payload.original_price > payload.price) {
    discount_percent = Math.round(((payload.original_price - payload.price) / payload.original_price) * 100);
  }

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
    vertical: payload.vertical || 'marketplace',
    subcategory: payload.subcategory?.trim() || null,
    offer_type: payload.offer_type || 'product',
    campaign_name: payload.campaign_name?.trim() || null,
    advertiser_name: payload.advertiser_name?.trim() || null,
    source: payload.source || 'manual_link',
    campaign_id: payload.campaign_id?.trim() || 'manual',
    site_id: normaliseSiteId(payload.site_id) || extractSiteIdFromAffiliateUrl(payload.affiliate_url) || 'legacy',
    site_url: payload.site_url?.trim() || null,
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

  const apiBaseUrl = getApiBaseUrl();
  if (apiBaseUrl) {
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/affiliate-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData)
      });
      if (res.ok) {
        return saveToLocal(cleanData);
      }
    } catch (err) {
      console.warn('[AffiliateService] Go API save error, using fallback:', err);
    }
  }

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
