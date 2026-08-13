import type { Product } from '../types';

export function getApiBaseUrl(): string {
  const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
  const isLocalHost = typeof window === 'undefined' || ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  if (configured && (isLocalHost || !/localhost|127\.0\.0\.1/.test(configured))) return configured;

  if (!isLocalHost) {
    return 'https://api.belanjaklik.my.id';
  }

  return 'http://localhost:8081';
}

export const localApiBaseUrl = getApiBaseUrl();

export interface LocalProductResponse {
  status: string;
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  data: Product[];
}

export async function fetchLocalProducts(options: {
  page?: number;
  limit?: number;
  type?: 'own' | 'affiliate';
  search?: string; active?: "all" | "active";
  category?: string;
} = {}): Promise<LocalProductResponse> {
  const params = new URLSearchParams({
    page: String(options.page || 1),
    limit: String(options.limit || 1000),
  });
  if (options.type) params.set('type', options.type);
  if (options.search) params.set('search', options.search);
  if (options.category) params.set('category', options.category);
  const response = await fetch(`${localApiBaseUrl}/api/v1/products?${params}`);
  if (!response.ok) throw new Error(`Local API returned ${response.status}`);
  return response.json();
}

export async function fetchLocalAffiliateProducts(options: {
  page?: number; limit?: number; merchant?: string; vertical?: string; category?: string; search?: string; sort?: string; active?: "all" | "active"; timeoutMs?: number; retries?: number;
} = {}): Promise<{ data: any[]; total: number; total_pages: number }> {
  const params = new URLSearchParams({ page: String(options.page || 1), limit: String(options.limit || 50) });
  for (const [key, value] of Object.entries(options)) if (value && !['timeoutMs', 'retries'].includes(key)) params.set(key, String(value));
  const timeoutMs = options.timeoutMs ?? 15000;
  const maxAttempts = (options.retries ?? 1) + 1;
  const attempt = async (): Promise<{ data: any[]; total: number; total_pages: number }> => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${localApiBaseUrl}/api/v1/affiliate-products?${params}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Local affiliate API returned ${response.status}`);
      return await response.json();
    } finally {
      window.clearTimeout(timeoutId);
    }
  };
  let lastErr: any;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await attempt();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}