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

const DEFAULT_JSM_CONFIG: JsmConfig = {
  startDate: '2026-07-24',
  endDate: '2026-07-26',
  isActive: true,
  title: 'Promo Jumat Sabtu Minggu',
  subtitle: 'Spesial harga hemat produk pilihan Alfamart'
};

export class JsmPromoService {
  /**
   * Get current JSM configuration from localStorage or default
   */
  static getJsmConfig(): JsmConfig {
    if (typeof window === 'undefined') return DEFAULT_JSM_CONFIG;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_JSM_CONFIG;
      return { ...DEFAULT_JSM_CONFIG, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_JSM_CONFIG;
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
   * Check if global JSM campaign has expired based on config & current date
   */
  static isJsmExpired(config?: JsmConfig, currentDateStr?: string): boolean {
    const cfg = config || this.getJsmConfig();
    if (!cfg.isActive) return true;

    const today = currentDateStr || new Date().toISOString().slice(0, 10);
    // If today is strictly past the end date, JSM promo has expired
    return today > cfg.endDate;
  }

  /**
   * Check if a specific product JSM promo is expired
   */
  static isProductJsmExpired(product: Product, config?: JsmConfig, currentDateStr?: string): boolean {
    const isJsmType = product.promo_type === 'JSM' || 
                      product.promo_type === 'GANTUNG' ||
                      String(product.promo_badge || '').toUpperCase().includes('JSM') || 
                      String(product.promo_badge || '').toUpperCase().includes('GANTUNG') || 
                      String(product.promo_badge || '').toUpperCase().includes('GAJIAN') || 
                      String(product.promo_title || '').toUpperCase().includes('JSM') ||
                      String(product.promo_title || '').toUpperCase().includes('GANTUNG') ||
                      String(product.promo_title || '').toUpperCase().includes('GAJIAN');
    
    if (!isJsmType) return false;

    const today = currentDateStr || new Date().toISOString().slice(0, 10);

    // 1. Check individual product promo_end_date if specified
    if (product.promo_end_date && today > product.promo_end_date) {
      return true;
    }

    // 2. Fall back to global JSM config end date / active status
    return this.isJsmExpired(config, today);
  }

  /**
   * Process catalog products: automatically expire JSM promos if end date has passed,
   * remove them from JSM promo status, and revert price to base price (price).
   */
  static async processJsmExpirations(products: Product[]): Promise<{ expiredCount: number; updatedProducts: Product[] }> {
    const config = this.getJsmConfig();
    const today = new Date().toISOString().slice(0, 10);
    let expiredCount = 0;

    const updatedProducts = [...products];

    for (let i = 0; i < updatedProducts.length; i++) {
      const p = updatedProducts[i];
      const isJsmType = p.promo_type === 'JSM' || 
                        p.promo_type === 'GANTUNG' ||
                        String(p.promo_badge || '').toUpperCase().includes('JSM') || 
                        String(p.promo_badge || '').toUpperCase().includes('GANTUNG') || 
                        String(p.promo_badge || '').toUpperCase().includes('GAJIAN') || 
                        String(p.promo_title || '').toUpperCase().includes('JSM') ||
                        String(p.promo_title || '').toUpperCase().includes('GANTUNG') ||
                        String(p.promo_title || '').toUpperCase().includes('GAJIAN');

      if (isJsmType && this.isProductJsmExpired(p, config, today)) {
        // Revert JSM product back to regular non-promo state
        const expiredProd: Product = {
          ...p,
          is_promo: false,
          promo_price: undefined,
          promo_type: undefined,
          promo_badge: undefined,
          promo_title: undefined,
          promo_start_date: undefined,
          promo_end_date: undefined,
          notes: p.notes ? `${p.notes} (Promo Berakhir)` : `Promo Berakhir`
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
    // Set config isActive to false
    this.saveJsmConfig({ isActive: false });

    // Process product expirations
    return this.processJsmExpirations(products);
  }

  /**
   * Filter active JSM products (excluding expired ones)
   */
  static filterActiveJsmProducts(products: Product[]): Product[] {
    const config = this.getJsmConfig();
    if (this.isJsmExpired(config)) return [];

    return products.filter(p => {
      if (!p.is_promo && !p.promo_price) return false;
      const isJsmType = p.promo_type === 'JSM' || 
                        p.promo_type === 'GANTUNG' ||
                        String(p.promo_badge || '').toUpperCase().includes('JSM') || 
                        String(p.promo_badge || '').toUpperCase().includes('GANTUNG') || 
                        String(p.promo_badge || '').toUpperCase().includes('GAJIAN') || 
                        String(p.promo_title || '').toUpperCase().includes('JSM') ||
                        String(p.promo_title || '').toUpperCase().includes('GANTUNG') ||
                        String(p.promo_title || '').toUpperCase().includes('GAJIAN');
      if (!isJsmType) return false;
      return !this.isProductJsmExpired(p, config);
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
