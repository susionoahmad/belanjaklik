import { supabase, isSupabaseConfigured } from '@/features/shared/db/supabaseClient';
import type { AffiliateProduct } from '../types';

export async function getActiveAffiliateProducts(options?: {
  limit?: number;
  category?: string;
  merchant?: string;
}): Promise<AffiliateProduct[]> {
  if (!isSupabaseConfigured) return [];

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
    if (error) {
      console.error('[AffiliateService] Error fetching active products:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[AffiliateService] Exception fetching active products:', err);
    return [];
  }
}

export async function getAffiliateProductBySlug(slug: string): Promise<AffiliateProduct | null> {
  if (!isSupabaseConfigured || !slug) return null;

  try {
    const { data, error } = await supabase
      .from('affiliate_products')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('[AffiliateService] Error fetching product by slug:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('[AffiliateService] Exception fetching product by slug:', err);
    return null;
  }
}

export async function getRelatedAffiliateProducts(
  category?: string | null,
  excludeId?: string,
  limit = 4
): Promise<AffiliateProduct[]> {
  if (!isSupabaseConfigured) return [];

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
      console.error('[AffiliateService] Error fetching related products:', error);
      return [];
    }

    // Fallback jika produk kategori sejenis kurang dari limit, ambil produk populer lainnya
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
    console.error('[AffiliateService] Exception fetching related products:', err);
    return [];
  }
}

export async function trackAffiliateClick(productId: string): Promise<void> {
  if (!isSupabaseConfigured || !productId) return;
  try {
    await supabase.from('affiliate_clicks').insert({ product_id: productId });
  } catch (err) {
    console.error('[AffiliateService] Failed to track affiliate click:', err);
  }
}
