import * as XLSX from 'xlsx';
import { supabase, isSupabaseConfigured } from '@/features/shared/db/supabaseClient';
import type { AffiliateProduct } from '../types';
import { saveAffiliateProduct } from './affiliateService';
import { extractSiteIdFromAffiliateUrl, normaliseSiteId, preserveAffiliateUrl } from './affiliateLinkUtils';

export interface ColumnMappingConfig {
  name: string;
  affiliate_url: string;
  product_url?: string;
  image_url?: string;
  price?: string;
  original_price?: string;
  commission_rate?: string;
  shop_name?: string;
  category?: string;
  description?: string;
  external_product_id?: string;
}

export interface ParsedFeedItem {
  rawRowIndex: number;
  name: string;
  rawName: string;
  affiliate_url: string;
  product_url?: string;
  image_url?: string;
  price?: number | null;
  original_price?: number | null;
  discount_percent?: number | null;
  commission_rate?: number | null;
  shop_name?: string;
  category?: string;
  description?: string;
  external_product_id?: string;
  site_id?: string | null;
  site_url?: string | null;
  merchant?: string;
  vertical?: 'marketplace' | 'travel' | 'digital';
  subcategory?: string;
  offer_type?: string;
  isValid: boolean;
  validationError?: string;
}

export interface ImportResultSummary {
  totalRows: number;
  validRows: number;
  successCount: number;
  failedCount: number;
  failures: { row: number; name: string; reason: string }[];
}

/**
 * Clean product title from Shopee bracket tags, slash duplications, and keyword stuffing after '|'
 */
export function cleanProductName(title: string): string {
  if (!title || typeof title !== 'string') return '';
  let str = title.trim();

  // 1. Remove leading bracket tags, e.g. [Tone Up 00-01-02-03], [3PCS], [BPOM], [BUY 1 GET 1], [PROMO]
  str = str.replace(/^(\[[^\]]+\]\s*)+/gi, '');

  // 2. Keep core product title before pipe '|' if present
  const parts = str.split('|').map(p => p.trim()).filter(Boolean);
  if (parts.length > 0) {
    str = parts[0];
  }

  // 3. Remove slash repetitions if first segment is substantial, e.g. 'NUVO Sabun Batang 72gr Paket 3pcs / Sabun Batang Nuvo...'
  const slashParts = str.split(' / ').map(p => p.trim()).filter(Boolean);
  if (slashParts.length > 1 && slashParts[0].length >= 15) {
    str = slashParts[0];
  }

  // 4. Normalize multiple spaces
  str = str.replace(/\s+/g, ' ').trim();
  return str;
}

/**
 * Clean product description from raw HTML tags, unescape HTML entities, and filter promo disclaimers
 */
export function cleanProductDescription(text: string): string {
  if (!text || typeof text !== 'string') return '';

  let str = text;
  // Replace HTML break & line closing tags with newlines
  str = str.replace(/<br\s*\/?>|<\/p>|<\/div>/gi, '\n');
  // Strip all other HTML tags
  str = str.replace(/<[^>]+>/g, '');

  // Unescape common HTML entities
  str = str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'");

  const lines = str.split('\n');
  const cleanedLines: string[] = [];

  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;

    // Filter hashtags
    if (/#(?:[a-zA-Z0-9_]+)/.test(l)) continue;

    // Filter promo/reseller disclaimers & order instructions
    if (/(unboxing|reseller|order sekarang|buka toko|jam operasional|syarat & ketentuan|disclaimer|wajib video|garansi retur|pembelian grosir)/i.test(l)) {
      continue;
    }

    cleanedLines.push(l);
  }

  let res = cleanedLines.join('\n');
  res = res.replace(/\n{3,}/g, '\n\n').trim();
  return res;
}

/**
 * Clean numeric values from strings containing "Rp", dots, or commas
 */
export function cleanNumeric(val: any): number | null {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;

  let str = String(val).trim();
  // Strip currency prefixes & spaces
  str = str.replace(/Rp\s*|\$/gi, '');

  // Handle Indonesian currency format e.g. "150.000,00" vs "150,000.00"
  if (str.includes('.') && str.includes(',')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes('.') && !str.includes(',')) {
    // If e.g. "150.000" (thousands dot without decimals)
    const parts = str.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      str = str.replace(/\./g, '');
    }
  } else if (str.includes(',') && !str.includes('.')) {
    str = str.replace(',', '.');
  }

  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

/**
 * Parse CSV / Excel file into raw rows & headers
 */
export async function parseFeedFile(file: File): Promise<{ headers: string[]; rows: Record<string, any>[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', raw: false });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
        if (jsonRows.length === 0) {
          return resolve({ headers: [], rows: [] });
        }

        const headers = Object.keys(jsonRows[0]);
        resolve({ headers, rows: jsonRows });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Auto-detect mapping between file headers and target fields
 */
export function autoDetectMapping(headers: string[]): ColumnMappingConfig {
  const mapping: ColumnMappingConfig = {
    name: '',
    affiliate_url: '',
    product_url: '',
    image_url: '',
    price: '',
    original_price: '',
    commission_rate: '',
    shop_name: '',
    category: '',
    description: '',
    external_product_id: ''
  };

  const findHeader = (keywords: string[]): string => {
    for (const h of headers) {
      const lower = h.toLowerCase().trim();
      if (keywords.some(k => lower.includes(k))) {
        return h;
      }
    }
    return '';
  };

  mapping.name = findHeader(['merchant product name', 'product name', 'nama produk', 'title', 'judul', 'name']);
  mapping.affiliate_url = findHeader(['affiliate url', 'tracking url', 'affiliate_url', 'deeplink', 'url_affiliate']);
  if (!mapping.affiliate_url) {
    mapping.affiliate_url = headers.find(h => h.toLowerCase().trim() === 'product url web (encoded)') || '';
  }
  mapping.product_url = headers.find(h => {
    const lower = h.toLowerCase().trim();
    return ['product url', 'link produk', 'url produk', 'product_url', 'original url'].some(k => lower === k || lower.includes(k))
      && !lower.includes('affiliate')
      && !lower.includes('tracking')
      && !lower.includes('encoded');
  }) || '';
  mapping.image_url = findHeader(['image url', 'gambar', 'image_url', 'image', 'photo', 'foto']);
  mapping.price = findHeader(['discounted price', 'harga promo', 'promo price', 'price', 'harga']);
  mapping.original_price = findHeader(['original price', 'harga asli', 'harga coret', 'normal price']);
  mapping.commission_rate = findHeader(['commission', 'komisi', 'rate', 'commission_rate']);
  mapping.shop_name = findHeader(['shop name', 'nama toko', 'seller', 'shop_name', 'merchant name']);
  mapping.category = findHeader(['sub category name', 'category name', 'kategori', 'category', 'sub_category']);
  mapping.description = findHeader(['description', 'deskripsi', 'detail', 'desc']);
  mapping.external_product_id = findHeader(['merchant product id', 'product id', 'id produk', 'item_id', 'external_product_id', 'sku']);

  // If affiliate_url is empty but product_url is found, fallback affiliate_url to product_url header
  if (!mapping.affiliate_url && mapping.product_url) {
    mapping.affiliate_url = mapping.product_url;
  }

  return mapping;
}

/**
 * Transform raw file rows into cleaned & validated preview items
 */
function inferAffiliateClassification(input: { name?: string; category?: string; affiliate_url?: string; product_url?: string }, fallback: { merchant: string; vertical: 'marketplace' | 'travel' | 'digital'; subcategory?: string }) {
  const text = `${input.name || ''} ${input.category || ''} ${input.affiliate_url || ''} ${input.product_url || ''}`.toLowerCase();
  const isTraveloka = text.includes('traveloka') || text.includes('travel.prf.hn');
  if (isTraveloka || text.includes('attraction')) {
    const subcategory = text.includes('hotel') ? 'hotel' : text.includes('flight') || text.includes('pesawat') ? 'flight' : 'activity';
    return { merchant: 'traveloka', vertical: 'travel' as const, subcategory, offer_type: 'booking' };
  }
  return { merchant: fallback.merchant, vertical: fallback.vertical, subcategory: fallback.subcategory || undefined, offer_type: fallback.vertical === 'digital' ? 'service' : 'product' };
}
export function transformAndCleanRows(
  rows: Record<string, any>[],
  mapping: ColumnMappingConfig
): ParsedFeedItem[] {
  return rows.map((row, index) => {
    const getValue = (key?: string) => (key && row[key] !== undefined && row[key] !== null) ? String(row[key]).trim() : '';

    const rawName = getValue(mapping.name);
    const cleanedName = cleanProductName(rawName);

    const affiliate_url = preserveAffiliateUrl(getValue(mapping.affiliate_url) || getValue(mapping.product_url));
    const product_url = getValue(mapping.product_url);
    const image_url = getValue(mapping.image_url);
    const rawDesc = getValue(mapping.description);
    const cleanedDesc = cleanProductDescription(rawDesc);

    const price = mapping.price ? cleanNumeric(row[mapping.price]) : null;
    const original_price = mapping.original_price ? cleanNumeric(row[mapping.original_price]) : null;
    const commission_rate = mapping.commission_rate ? cleanNumeric(row[mapping.commission_rate]) : null;
    const shop_name = getValue(mapping.shop_name);
    const category = getValue(mapping.category);
    const external_product_id = getValue(mapping.external_product_id);

    let discount_percent: number | null = null;
    if (original_price && price && original_price > price) {
      discount_percent = Math.round(((original_price - price) / original_price) * 100);
    }

    let isValid = true;
    let validationError: string | undefined = undefined;

    if (!cleanedName) {
      isValid = false;
      validationError = 'Nama produk kosong';
    } else if (!affiliate_url) {
      isValid = false;
      validationError = 'Link affiliate kosong';
    }

    const classification = inferAffiliateClassification(
      { name: cleanedName, category, affiliate_url, product_url },
      { merchant: 'other', vertical: 'marketplace' }
    );

    return {
      rawRowIndex: index + 1,
      name: cleanedName,
      rawName,
      affiliate_url,
      product_url: product_url || undefined,
      image_url: image_url || undefined,
      price,
      original_price,
      discount_percent,
      commission_rate,
      shop_name: shop_name || undefined,
      category: category || undefined,
      description: cleanedDesc || undefined,
      external_product_id: external_product_id || undefined,
      site_id: extractSiteIdFromAffiliateUrl(affiliate_url),
      site_url: null,
      merchant: classification.merchant,
      vertical: classification.vertical,
      subcategory: classification.subcategory,
      offer_type: classification.offer_type,
      isValid,
      validationError
    };
  });
}

/**
 * Bulk Upsert feed items to Supabase affiliate_products & local storage
 */
function stableExternalProductId(url: string | undefined, name: string): string {
  const input = String(url || '') + '|' + String(name || '');
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return 'generated_' + (hash >>> 0).toString(16);
}
export async function bulkUpsertAffiliateFeed(
  items: ParsedFeedItem[],
  options: {
    merchant: string;
    vertical?: 'marketplace' | 'travel' | 'digital';
    subcategory?: string;
    campaignId?: string;
    source?: string;
    siteId?: string;
    siteUrl?: string;
    onProgress?: (processed: number, total: number) => void;
  }
): Promise<ImportResultSummary> {
  const validItems = items.filter(i => i.isValid);
  const now = new Date().toISOString();
  const merchant = options.merchant || 'other';
  const campaign_id = options.campaignId?.trim() || 'manual_feed';
  const source = options.source || 'manual_csv_import';
  const defaultSiteId = normaliseSiteId(options.siteId);
  const defaultSiteUrl = options.siteUrl?.trim() || null;

  const summary: ImportResultSummary = {
    totalRows: items.length,
    validRows: validItems.length,
    successCount: 0,
    failedCount: items.length - validItems.length,
    failures: items
      .filter(i => !i.isValid)
      .map(i => ({ row: i.rawRowIndex, name: i.rawName || 'Tanpa Nama', reason: i.validationError || 'Data tidak valid' }))
  };

  const BATCH_SIZE = 50;
  for (let i = 0; i < validItems.length; i += BATCH_SIZE) {
    const batch = validItems.slice(i, i + BATCH_SIZE);

    const dbPayloads: Partial<AffiliateProduct>[] = batch.map(item => {
      let slug = item.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (slug.length > 80) slug = slug.substring(0, 80).replace(/-+$/, '');

      const external_product_id = item.external_product_id || stableExternalProductId(item.product_url || item.affiliate_url, item.name);
      const site_id = item.site_id || defaultSiteId || extractSiteIdFromAffiliateUrl(item.affiliate_url) || 'legacy';
      const site_url = item.site_url || defaultSiteUrl;

      if (external_product_id) {
        slug += '-' + external_product_id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      } else {
        slug += '-' + Math.random().toString(36).substring(2, 6);
      }
      if (slug.length > 90) slug = slug.substring(0, 90).replace(/-+$/, '');

      return {
        merchant: item.merchant || merchant,
        vertical: item.vertical || options.vertical || 'marketplace',
        subcategory: item.subcategory || options.subcategory || item.category || null,
        offer_type: item.offer_type || (options.vertical === 'travel' ? 'booking' : options.vertical === 'digital' ? 'service' : 'product'),
        campaign_id,
        external_product_id,
        source,
        name: item.name,
        slug,
        description: item.description || null,
        image_url: item.image_url || null,
        product_url: item.product_url || null,
        affiliate_url: preserveAffiliateUrl(item.affiliate_url),
        site_id,
        site_url,
        price: item.price ?? null,
        original_price: item.original_price ?? null,
        discount_percent: item.discount_percent ?? null,
        commission_rate: item.commission_rate ?? null,
        shop_name: item.shop_name || null,
        category: item.category || null,
        is_active: true,
        updated_at: now,
        last_synced_at: now
      };
    });

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('affiliate_products')
          .upsert(dbPayloads, {
            onConflict: 'merchant,campaign_id,external_product_id,site_id',
            ignoreDuplicates: false
          })
          .select();

        if (error) {
          console.warn('[AffiliateImportService] Supabase upsert batch error, falling back to item-by-item save:', error);
          for (const payload of dbPayloads) {
            const res = await saveAffiliateProduct(payload);
            if (res) summary.successCount++;
            else summary.failedCount++;
          }
        } else {
          summary.successCount += data ? data.length : dbPayloads.length;
        }
      } catch (err) {
        console.warn('[AffiliateImportService] Exception in bulk upsert, using local fallback:', err);
        for (const payload of dbPayloads) {
          await saveAffiliateProduct(payload);
          summary.successCount++;
        }
      }
    } else {
      for (const payload of dbPayloads) {
        await saveAffiliateProduct(payload);
        summary.successCount++;
      }
    }

    if (options.onProgress) {
      options.onProgress(Math.min(i + BATCH_SIZE, validItems.length), validItems.length);
    }
  }

  return summary;
}














