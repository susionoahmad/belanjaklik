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

    // Check if URL is a bare or invalid atid.me root link (e.g. "https://atid.me" or "https://atid.me/")
    const lowerUrl = targetUrl.toLowerCase().trim();
    const isBareAtid = lowerUrl === 'https://atid.me' || lowerUrl === 'https://atid.me/' || lowerUrl === 'http://atid.me' || lowerUrl === 'http://atid.me/';

    // Check if URL is already a valid Accesstrade tracking click URL or specific tracking path
    if (!isBareAtid && (lowerUrl.includes('accesstrade.co.id/click') || (lowerUrl.includes('atid.me/') && !lowerUrl.endsWith('atid.me/')))) {
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

