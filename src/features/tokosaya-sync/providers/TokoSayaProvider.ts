/**
 * TokoSayaProvider
 * Downloads raw product page HTML or official REST API JSON from Alfamind / Toko Saya
 * using a multi-proxy fallback pipeline to bypass browser CORS restrictions.
 */

export interface OfficialProductData {
  plu: string;
  product_name: string;
  price: number;
  special_price?: number;
  final_price: number;
  brand_name?: string;
  brand?: { brand_name?: string } | string;
  category_name?: string;
  category?: string;
  description?: string;
  featured_image?: string;
  images?: Array<{ file_url: string; file_name?: string }>;
}

export class TokoSayaProvider {
  /**
   * Fetches official product data directly from Alfamind REST API by PLU code.
   */
  static async fetchProductByPlu(plu: string): Promise<OfficialProductData | null> {
    const targetUrl = `https://alfamind.mindstores.co/api/method/alfamind.produk.doctype.produk.produk.get_product_details?plu=${encodeURIComponent(plu)}`;

    const fetchers = [
      // 1. Direct fetch
      async () => {
        const res = await fetch(targetUrl, { headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          const json = await res.json();
          if (json && json.message && json.message.product_name) return json.message;
        }
        throw new Error('Direct API fetch failed');
      },
      // 2. CodeTabs Proxy
      async () => {
        const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`);
        if (res.ok) {
          const json = await res.json();
          if (json && json.message && json.message.product_name) return json.message;
        }
        throw new Error('CodeTabs API proxy failed');
      },
      // 3. AllOrigins RAW
      async () => {
        const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
        if (res.ok) {
          const json = await res.json();
          if (json && json.message && json.message.product_name) return json.message;
        }
        throw new Error('AllOrigins API proxy failed');
      }
    ];

    for (const fn of fetchers) {
      try {
        const data = await fn();
        if (data) return data;
      } catch (err) {
        // try next fallback
      }
    }
    return null;
  }

  /**
   * Downloads raw product page HTML content using a multi-proxy fallback pipeline.
   */
  static async downloadProductPage(sourceUrl: string): Promise<string> {
    const proxies = [
      async () => {
        const res = await fetch(sourceUrl, { headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' } });
        if (res.ok) return await res.text();
        throw new Error('Direct fetch HTTP status not OK');
      },
      async () => {
        const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(sourceUrl)}`);
        if (res.ok) return await res.text();
        throw new Error('CodeTabs proxy failed');
      },
      async () => {
        const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(sourceUrl)}`);
        if (res.ok) return await res.text();
        throw new Error('AllOrigins RAW failed');
      }
    ];

    for (const proxyFn of proxies) {
      try {
        const html = await proxyFn();
        if (html && html.length > 200) {
          return html;
        }
      } catch (err) {
        // Continue to next proxy provider
      }
    }

    throw new Error(`Gagal mengunduh halaman produk Toko Saya dari URL: ${sourceUrl}. Mohon periksa koneksi internet Anda.`);
  }
}
