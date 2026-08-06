import type { Product } from '../types';

export const localApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

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
  page?: number; limit?: number; merchant?: string; vertical?: string; category?: string; search?: string; active?: "all" | "active";
} = {}): Promise<{ data: any[]; total: number; total_pages: number }> {
  const params = new URLSearchParams({ page: String(options.page || 1), limit: String(options.limit || 50) });
  for (const [key, value] of Object.entries(options)) if (value) params.set(key, String(value));
  const response = await fetch(`${localApiBaseUrl}/api/v1/affiliate-products?${params}`);
  if (!response.ok) throw new Error(`Local affiliate API returned ${response.status}`);
  return response.json();
}