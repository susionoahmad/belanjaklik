import type { Product } from '../../shared/types';
import { dataService } from '../../shared/db/dataService';

export interface JsmConfig {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  isActive: boolean;
  title: string;
  subtitle: string;
}

const STORAGE_KEY = 'psa_jsm_config';

/**
 * Dynamically computes the active Friday - Sunday date range for the current week.
 * Prevents hardcoding stale or expired dates.
 */
export function getDynamicJsmConfig(): JsmConfig {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
  
  // Calculate offset to Friday of the current active week
  let diffToFriday = 5 - dayOfWeek;
  if (dayOfWeek === 0) {
    diffToFriday = -2; // Sunday is part of JSM that started 2 days ago
  } else if (dayOfWeek === 1) {
    diffToFriday = -3; // Monday: last JSM was Fri(-3) to Sun(-1)
  }

  const friday = new Date(today);
  friday.setDate(today.getDate() + diffToFriday);

  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);

  const startDate = friday.toISOString().slice(0, 10);
  const endDate = sunday.toISOString().slice(0, 10);

  return {
    startDate,
    endDate,
    isActive: true,
    title: 'Promo Gantung & JSM Alfamart',
    subtitle: 'Spesial harga hemat produk pilihan Alfamart'
  };
}

export class JsmPromoService {
  /**
   * Get current JSM configuration from localStorage or default dynamic period
   */
  static getJsmConfig(): JsmConfig {
    const defaultConfig = getDynamicJsmConfig();
    if (typeof window === 'undefined') return defaultConfig;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultConfig;
      const parsed = JSON.parse(raw);
      const today = new Date().toISOString().slice(0, 10);
      if (parsed.endDate && parsed.endDate < today) {
        // Refresh expired localStorage config to fresh dynamic dates
        localStorage.removeItem(STORAGE_KEY);
        return defaultConfig;
      }
      return { ...defaultConfig, ...parsed };
    } catch {
      return defaultConfig;
    }
  }

  /**
   * Save updated JSM configuration
   */
  static saveJsmConfig(config: Partial<JsmConfig>): JsmConfig {
    const current = this.getJsmConfig();
    const updated = { ...current, ...config };
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    return updated;
  }

  /**
   * Check if global JSM campaign is currently active
   */
  static isJsmActive(config?: JsmConfig, currentDateStr?: string): boolean {
    const cfg = config || this.getJsmConfig();
    if (!cfg.isActive) return false;

    const today = currentDateStr || new Date().toISOString().slice(0, 10);
    return today >= cfg.startDate && today <= cfg.endDate;
  }

  /**
   * Check if global JSM campaign is expired based on current date
   */
  static isJsmExpired(config?: JsmConfig, currentDateStr?: string): boolean {
    return !this.isJsmActive(config, currentDateStr);
  }

  /**
   * Check if a specific product JSM / GANTUNG promo is expired
   */
  static isProductJsmExpired(product: Product, config?: JsmConfig, currentDateStr?: string): boolean {
    const isPromoType = product.promo_type === 'JSM' || 
                        product.promo_type === 'GANTUNG' ||
                        String(product.promo_badge || '').toUpperCase().includes('JSM') || 
                        String(product.promo_badge || '').toUpperCase().includes('GANTUNG') || 
                        String(product.promo_badge || '').toUpperCase().includes('GAJIAN') || 
                        String(product.promo_title || '').toUpperCase().includes('JSM') ||
                        String(product.promo_title || '').toUpperCase().includes('GANTUNG') ||
                        String(product.promo_title || '').toUpperCase().includes('GAJIAN');
    
    if (!isPromoType) return false;

    const today = currentDateStr || new Date().toISOString().slice(0, 10);

    // 1. Check individual product promo dates if specified
    if (product.promo_start_date && today < product.promo_start_date) {
      return true;
    }
    if (product.promo_end_date && today > product.promo_end_date) {
      return true;
    }

    // 2. Fall back to global JSM config active window
    return this.isJsmExpired(config, today);
  }

  /**
   * Universal check to evaluate whether any product promo is currently ACTIVE on the given date.
   */
  static isProductPromoActive(product: Product, currentDateStr?: string): boolean {
    if (!product.is_promo && !product.promo_price) return false;
    const today = currentDateStr || new Date().toISOString().slice(0, 10);

    // 1. Check start date bounds
    if (product.promo_start_date && today < product.promo_start_date) {
      return false;
    }

    // 2. Check end date bounds
    if (product.promo_end_date && today > product.promo_end_date) {
      return false;
    }

    // 3. Check JSM / GANTUNG expiration rules
    const isJsmType = product.promo_type === 'JSM' || 
                      product.promo_type === 'GANTUNG' ||
                      String(product.promo_badge || '').toUpperCase().includes('JSM') || 
                      String(product.promo_badge || '').toUpperCase().includes('GANTUNG') || 
                      String(product.promo_badge || '').toUpperCase().includes('GAJIAN') || 
                      String(product.promo_title || '').toUpperCase().includes('JSM') ||
                      String(product.promo_title || '').toUpperCase().includes('GANTUNG') ||
                      String(product.promo_title || '').toUpperCase().includes('GAJIAN');

    if (isJsmType && this.isProductJsmExpired(product, undefined, today)) {
      return false;
    }

    return true;
  }

  /**
   * Process all catalog products: automatically expire JSM and date-bounded promos if period has passed,
   * remove them from promo status, and revert price to base price (price).
   */
  static async processJsmExpirations(products: Product[]): Promise<{ expiredCount: number; updatedProducts: Product[] }> {
    return this.processAllExpirations(products);
  }

  /**
   * Universal expiration process for all promo types. Reverts expired promo products to normal base pricing.
   */
  static async processAllExpirations(products: Product[]): Promise<{ expiredCount: number; updatedProducts: Product[] }> {
    const today = new Date().toISOString().slice(0, 10);
    let expiredCount = 0;

    const updatedProducts = [...products];

    for (let i = 0; i < updatedProducts.length; i++) {
      const p = updatedProducts[i];
      const isPromoCandidate = Boolean(p.is_promo || p.promo_price || p.promo_end_date || p.promo_type);

      if (isPromoCandidate && !this.isProductPromoActive(p, today)) {
        // Revert product back to regular non-promo state
        const expiredProd: Product = {
          ...p,
          is_promo: false,
          promo_price: undefined,
          promo_type: undefined,
          promo_badge: undefined,
          promo_title: undefined,
          promo_start_date: undefined,
          promo_end_date: undefined,
          notes: p.notes && !p.notes.includes('Promo Berakhir') ? `${p.notes} (Promo Berakhir)` : p.notes || `Promo Berakhir`
        };

        updatedProducts[i] = expiredProd;
        expiredCount++;

        // Save reverted price to persistent database
        try {
          await dataService.saveProduct(expiredProd);
        } catch (err) {
          console.warn(`[JsmPromoService] Failed to save expired product ${p.id}:`, err);
        }
      }
    }

    return { expiredCount, updatedProducts };
  }

  /**
   * Manually force expire all JSM promo products and restore original prices
   */
  static async forceExpireAllJsmPromos(products: Product[]): Promise<{ expiredCount: number; updatedProducts: Product[] }> {
    this.saveJsmConfig({ isActive: false });
    return this.processAllExpirations(products);
  }

  /**
   * Filter active Promo Gantung (#GajianUntungAlfamart) products strictly based on active promo status
   */
  static filterActiveGantungProducts(products: Product[]): Product[] {
    return products.filter(p => {
      if (!this.isProductPromoActive(p)) return false;
      const isGantung = p.promo_type === 'GANTUNG' ||
                        String(p.promo_badge || '').toUpperCase().includes('GANTUNG') || 
                        String(p.promo_badge || '').toUpperCase().includes('GAJIAN') || 
                        String(p.promo_title || '').toUpperCase().includes('GANTUNG') ||
                        String(p.promo_title || '').toUpperCase().includes('GAJIAN');
      return isGantung;
    });
  }

  /**
   * Filter active JSM products strictly based on active promo status
   */
  static filterActiveJsmProducts(products: Product[]): Product[] {
    if (this.isJsmExpired()) return [];

    return products.filter(p => {
      if (!this.isProductPromoActive(p)) return false;
      const isJsm = p.promo_type === 'JSM' || 
                    String(p.promo_badge || '').toUpperCase().includes('JSM') || 
                    String(p.promo_title || '').toUpperCase().includes('JSM');
      return isJsm;
    });
  }

  /**
   * Format JSM date period for display (e.g., "24 - 26 Juli 2026")
   */
  static formatJsmDateRange(startDateStr: string, endDateStr: string): string {
    try {
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return `${startDateStr} - ${endDateStr}`;
      }

      const startDay = start.getDate();
      const endDay = end.getDate();
      const endMonth = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(end);
      const endYear = end.getFullYear();

      return `${startDay} - ${endDay} ${endMonth} ${endYear}`;
    } catch {
      return `${startDateStr} - ${endDateStr}`;
    }
  }
}

