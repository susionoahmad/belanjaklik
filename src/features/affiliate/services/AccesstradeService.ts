/**
 * AccesstradeService
 * Automatic Deep Link Transformer & Affiliate Tracking Engine for Accesstrade Indonesia
 */

export interface AccesstradeConfig {
  siteId: string; // Publisher Site ID from Accesstrade
  rkId?: string;  // RK ID / Custom SubID
  isEnabled: boolean;
}

const STORAGE_KEY = 'psa_accesstrade_config';

export class AccesstradeEngine {
  /**
   * Retrieves saved Accesstrade config from localStorage or env.
   */
  static getConfig(): AccesstradeConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}

    const envSiteId = import.meta.env.VITE_ACCESSTRADE_SITE_ID || '';
    const envRkId = import.meta.env.VITE_ACCESSTRADE_RK_ID || '';

    return {
      siteId: envSiteId,
      rkId: envRkId,
      isEnabled: !!envSiteId
    };
  }

  /**
   * Saves updated Accesstrade Publisher configuration.
   */
  static saveConfig(config: AccesstradeConfig): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }

  /**
   * Transforms raw merchant URL (Shopee, Tokopedia, Lazada, Toko Saya, dsb.)
   * into a trackable Accesstrade Affiliate Deep Link.
   */
  static convertToAffiliateUrl(targetUrl: string, customSubId?: string): string {
    if (!targetUrl || !targetUrl.startsWith('http')) return targetUrl;

    const config = this.getConfig();
    const siteId = config.siteId || '127950';

    const lowerUrl = targetUrl.toLowerCase().trim();

    // Never wrap Blibli URLs, Shopee shortlinks (shope.ee / s.shopee.co.id), or existing accesstrade.co.id/click links
    if (
      lowerUrl.includes('blibli.com') ||
      lowerUrl.includes('blibli.pxf.io') ||
      lowerUrl.includes('accesstrade.co.id/click') ||
      lowerUrl.includes('shope.ee') ||
      lowerUrl.includes('s.shopee.co.id')
    ) {
      return targetUrl;
    }

    try {
      const encodedUrl = encodeURIComponent(targetUrl.trim());
      const subId = customSubId || config.rkId || 'belanjaklik_app';

      // Official Accesstrade Universal Deep Link Redirection URL
      return `https://accesstrade.co.id/click?site_id=${encodeURIComponent(siteId)}&url=${encodedUrl}&sub_id=${encodeURIComponent(subId)}`;
    } catch (e) {
      return targetUrl;
    }
  }
}

export const AccesstradeService = AccesstradeEngine;

