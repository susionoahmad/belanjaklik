import { get, set } from 'idb-keyval';
import type { Product, Category, FulfillmentChannel, ShoppingTemplate, CartItem, ShoppingRequest, ProductSource } from '../types';

const KEYS = {
  PRODUCTS: 'psa_products',
  CATEGORIES: 'psa_categories',
  CHANNELS: 'psa_channels',
  TEMPLATES: 'psa_templates',
  CART: 'psa_cart',
  FAVORITES: 'psa_favorites',
  REQUESTS: 'psa_requests',
  SETTINGS: 'psa_settings',
  SOURCES: 'psa_sources',
  IMPORT_SESSIONS: 'psa_import_sessions',
  IMPORT_JOBS: 'psa_import_jobs',
  IMPORT_RESULTS: 'psa_import_results',
  IMPORT_AUDIT: 'psa_import_audit',
  CATALOG_VERSIONS: 'psa_catalog_versions',
  PRODUCT_ATTRIBUTES: 'psa_product_attributes',
  PRODUCT_SYNONYMS: 'psa_product_synonyms',
  PRODUCT_EMBEDDINGS: 'psa_product_embeddings',
  PRODUCT_RELATIONSHIPS: 'psa_product_relationships',
  SEARCH_INDEX: 'psa_search_index',
  CAMPAIGNS: 'psa_promotion_campaigns',
  PROMO_PRODUCTS: 'psa_promotion_products',
  PROMO_BANNERS: 'psa_promotion_banners',
  PRICE_HISTORY: 'psa_price_history',
  CAMPAIGN_TEMPLATES: 'psa_campaign_templates',
  CAMPAIGN_RULES: 'psa_campaign_rules',
  CAMPAIGN_PLACEMENTS: 'psa_campaign_placements',
  CAMPAIGN_NOTIFICATIONS: 'psa_campaign_notifications',
  CAMPAIGN_ASSETS: 'psa_campaign_assets',
  CAMPAIGN_ANALYTICS: 'psa_campaign_analytics',
  CAMPAIGN_AB_TESTS: 'psa_campaign_ab_tests'
};

// Helper to strip Vue 3 reactive proxies so IndexedDB structuredClone algorithm never throws DataCloneError
function toPlainObject<T>(data: T): T {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (e) {
    return data;
  }
}

export const offlineDb = {
  // PRODUCTS
  async getProducts(): Promise<Product[] | undefined> {
    return await get<Product[]>(KEYS.PRODUCTS);
  },
  async setProducts(products: Product[]): Promise<void> {
    await set(KEYS.PRODUCTS, toPlainObject(products));
  },

  // CATEGORIES
  async getCategories(): Promise<Category[] | undefined> {
    return await get<Category[]>(KEYS.CATEGORIES);
  },
  async setCategories(categories: Category[]): Promise<void> {
    await set(KEYS.CATEGORIES, toPlainObject(categories));
  },

  // CHANNELS
  async getChannels(): Promise<FulfillmentChannel[] | undefined> {
    return await get<FulfillmentChannel[]>(KEYS.CHANNELS);
  },
  async setChannels(channels: FulfillmentChannel[]): Promise<void> {
    await set(KEYS.CHANNELS, toPlainObject(channels));
  },

  // TEMPLATES
  async getTemplates(): Promise<ShoppingTemplate[] | undefined> {
    return await get<ShoppingTemplate[]>(KEYS.TEMPLATES);
  },
  async setTemplates(templates: ShoppingTemplate[]): Promise<void> {
    await set(KEYS.TEMPLATES, toPlainObject(templates));
  },

  // CART
  async getCart(): Promise<CartItem[] | undefined> {
    return await get<CartItem[]>(KEYS.CART);
  },
  async setCart(cart: CartItem[]): Promise<void> {
    await set(KEYS.CART, toPlainObject(cart));
  },

  // FAVORITES
  async getFavorites(): Promise<string[] | undefined> {
    return await get<string[]>(KEYS.FAVORITES);
  },
  async setFavorites(favorites: string[]): Promise<void> {
    await set(KEYS.FAVORITES, toPlainObject(favorites));
  },

  // SHOPPING REQUESTS HISTORY
  async getRequests(): Promise<ShoppingRequest[] | undefined> {
    return await get<ShoppingRequest[]>(KEYS.REQUESTS);
  },
  async setRequests(requests: ShoppingRequest[]): Promise<void> {
    await set(KEYS.REQUESTS, toPlainObject(requests));
  },
  async addRequest(request: ShoppingRequest): Promise<void> {
    const current = (await this.getRequests()) || [];
    current.unshift(request);
    await set(KEYS.REQUESTS, toPlainObject(current));
  },

  // PRODUCT SOURCES
  async getSources(): Promise<ProductSource[] | undefined> {
    return await get<ProductSource[]>(KEYS.SOURCES);
  },
  async setSources(sources: ProductSource[]): Promise<void> {
    await set(KEYS.SOURCES, toPlainObject(sources));
  },

  // PROMOTION CAMPAIGNS
  async getCampaigns<T = any>(): Promise<T[] | undefined> {
    return await get<T[]>(KEYS.CAMPAIGNS);
  },
  async setCampaigns<T = any>(campaigns: T[]): Promise<void> {
    await set(KEYS.CAMPAIGNS, toPlainObject(campaigns));
  },

  // PROMO PRODUCTS
  async getPromoProducts<T = any>(): Promise<T[] | undefined> {
    return await get<T[]>(KEYS.PROMO_PRODUCTS);
  },
  async setPromoProducts<T = any>(products: T[]): Promise<void> {
    await set(KEYS.PROMO_PRODUCTS, toPlainObject(products));
  },

  // PROMO BANNERS
  async getPromoBanners<T = any>(): Promise<T[] | undefined> {
    return await get<T[]>(KEYS.PROMO_BANNERS);
  },
  async setPromoBanners<T = any>(banners: T[]): Promise<void> {
    await set(KEYS.PROMO_BANNERS, toPlainObject(banners));
  },

  // PRICE HISTORY
  async getPriceHistory<T = any>(): Promise<T[] | undefined> {
    return await get<T[]>(KEYS.PRICE_HISTORY);
  },
  async setPriceHistory<T = any>(history: T[]): Promise<void> {
    await set(KEYS.PRICE_HISTORY, toPlainObject(history));
  },

  // ENTERPRISE CAMPAIGN STORES
  async getCampaignRules<T = any>(): Promise<T[] | undefined> {
    return await get<T[]>(KEYS.CAMPAIGN_RULES);
  },
  async setCampaignRules<T = any>(rules: T[]): Promise<void> {
    await set(KEYS.CAMPAIGN_RULES, toPlainObject(rules));
  },

  async getCampaignPlacements<T = any>(): Promise<T[] | undefined> {
    return await get<T[]>(KEYS.CAMPAIGN_PLACEMENTS);
  },
  async setCampaignPlacements<T = any>(placements: T[]): Promise<void> {
    await set(KEYS.CAMPAIGN_PLACEMENTS, toPlainObject(placements));
  },

  async getCampaignAnalytics<T = any>(): Promise<T[] | undefined> {
    return await get<T[]>(KEYS.CAMPAIGN_ANALYTICS);
  },
  async setCampaignAnalytics<T = any>(analytics: T[]): Promise<void> {
    await set(KEYS.CAMPAIGN_ANALYTICS, toPlainObject(analytics));
  },

  async getCampaignABTests<T = any>(): Promise<T[] | undefined> {
    return await get<T[]>(KEYS.CAMPAIGN_AB_TESTS);
  },
  async setCampaignABTests<T = any>(tests: T[]): Promise<void> {
    await set(KEYS.CAMPAIGN_AB_TESTS, toPlainObject(tests));
  },

  // GENERIC STORE ACCESS
  async getItem<T>(key: string): Promise<T | undefined> {
    return await get<T>(key);
  },
  async setItem<T>(key: string, value: T): Promise<void> {
    await set(key, toPlainObject(value));
  }
};

