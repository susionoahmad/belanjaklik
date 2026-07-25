import { proxyImageUrl } from '../services/ImageProxyService';
import type { OfficialProductData } from '../providers/TokoSayaProvider';

export interface RawParsedProduct {
  title: string;
  price?: number;
  promoPrice?: number;
  brand?: string;
  category?: string;
  description?: string;
  images: string[];
  externalCode: string;
  sourceUrl: string;
}

export class ProductParser {
  /**
   * Converts official Alfamind REST API JSON data into RawParsedProduct object with proxied image URLs.
   */
  static parseFromOfficialData(apiData: OfficialProductData, sourceUrl: string, externalCode: string): RawParsedProduct {
    const baseUrl = 'https://alfamind.mindstores.co';
    const rawImages: string[] = [];

    const formatImg = (path?: string): string | null => {
      if (!path) return null;
      let clean = path.trim();
      if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = baseUrl + (clean.startsWith('/') ? '' : '/') + clean;
      }
      return proxyImageUrl(clean);
    };

    if (apiData.featured_image) {
      const img = formatImg(apiData.featured_image);
      if (img && !rawImages.includes(img)) rawImages.push(img);
    }

    if (apiData.images && Array.isArray(apiData.images)) {
      apiData.images.forEach(i => {
        if (i.file_url) {
          const img = formatImg(i.file_url);
          if (img && !rawImages.includes(img)) rawImages.push(img);
        }
      });
    }

    // Extract brand name
    let brandName: string | undefined;
    if (typeof apiData.brand === 'object' && apiData.brand !== null) {
      brandName = (apiData.brand as any).brand_name;
    } else if (typeof apiData.brand === 'string') {
      brandName = apiData.brand;
    } else if (apiData.brand_name) {
      brandName = apiData.brand_name;
    }
    const finalBrand = brandName || 'Alfamind';

    // Extract category name
    let categoryName: string | undefined;
    if (typeof apiData.category === 'string') {
      categoryName = apiData.category;
    } else if (apiData.category_name) {
      categoryName = apiData.category_name;
    }
    const finalCategory = categoryName || 'Alfamart (Sembako)';

    const productTitle = apiData.product_name || `Produk #${externalCode}`;

    // Clean HTML tags from description or construct rich description
    const rawDescApi = apiData.description || (apiData as any).deskripsi || (apiData as any).product_description || (apiData as any).keterangan || (apiData as any).details;
    let cleanDesc: string;
    
    if (rawDescApi && typeof rawDescApi === 'string' && rawDescApi.trim().length > 5) {
      cleanDesc = rawDescApi
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\n\s*\n/g, '\n')
        .trim();
    } else {
      cleanDesc = `${productTitle} - Produk Original Toko Saya Alfamind.\n\nSpesifikasi Produk:\n• Merek: ${finalBrand}\n• Kategori: ${finalCategory}\n• Kode PLU: ${externalCode}\n\nDeskripsi:\nDapatkan ${productTitle} kualitas terjamin langsung dari Toko Saya Alfamind. Dikirim cepat dan aman dari lokasi Alfamart terdekat.`;
    }

    return {
      title: productTitle,
      price: apiData.price || apiData.final_price || 0,
      promoPrice: apiData.special_price && apiData.special_price < apiData.price ? apiData.special_price : undefined,
      brand: finalBrand,
      category: finalCategory,
      description: cleanDesc,
      images: rawImages.length > 0 ? rawImages : ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=800'],
      externalCode,
      sourceUrl
    };
  }

  /**
   * Extract high-fidelity Toko Saya product details with HTML DOM parsing + description extraction.
   */
  static parse(html: string, sourceUrl: string): RawParsedProduct {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1. Extract External Code (PLU Code) from URL
    const codeMatch = sourceUrl.match(/\/detail\/([^\/\?#]+)/i) || sourceUrl.match(/[\?&]id=([^\/\?#]+)/i);
    const externalCode = codeMatch ? codeMatch[1] : `p_${Date.now()}`;

    let title: string | undefined;
    let price: number | undefined;
    let promoPrice: number | undefined;
    let brand: string | undefined;
    let category: string | undefined;
    let description: string | undefined;
    const realImages: string[] = [];

    const fullText = doc.body ? doc.body.textContent || '' : '';

    const resolveUrl = (rawSrc: string): string | null => {
      if (!rawSrc) return null;
      try {
        const clean = rawSrc.trim();
        if (clean.startsWith('data:')) return null;
        const resolved = new URL(clean, sourceUrl).href;
        if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
          const lower = resolved.toLowerCase();
          if (lower.includes('logo') || lower.includes('icon') || lower.includes('avatar') || lower.includes('badge') || lower.includes('cart')) {
            return null;
          }
          return resolved;
        }
      } catch (e) {}
      return null;
    };

    // 1. Title Extraction
    const titleCandidates: string[] = [];
    doc.querySelectorAll('h1, h2, h3, .product-name, .product-title, .title, [class*="title"], [class*="name"]').forEach(el => {
      const txt = el.textContent?.trim();
      if (txt && txt.length > 5 && !txt.toLowerCase().includes('personal shopping') && !txt.toLowerCase().includes('tokovirtualku')) {
        titleCandidates.push(txt);
      }
    });

    const titleMatch = fullText.match(/([A-Z0-9][A-Za-z0-9\s\.\-\/\(\)]+\(\d{4,8}\))/);
    if (titleMatch && titleMatch[1]) {
      titleCandidates.unshift(titleMatch[1].trim());
    }

    if (titleCandidates.length > 0) {
      title = titleCandidates[0];
    }

    // 2. Merek / Brand Extraction
    const brandMatch = html.match(/Merek[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i)
      || html.match(/Merek[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/i)
      || fullText.match(/Merek\s*([A-Za-z0-9\s]+?)(?:Sub Kategori|Kode PLU|P x L x T|$)/i);
    if (brandMatch && brandMatch[1]) {
      const cleanBrand = brandMatch[1].replace(/<[^>]+>/g, '').trim();
      if (cleanBrand && cleanBrand.length > 1) {
        brand = cleanBrand;
      }
    }

    // 3. Sub Kategori Extraction
    const categoryMatch = html.match(/Sub Kategori[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i)
      || html.match(/Sub Kategori[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/i)
      || fullText.match(/Sub Kategori\s*([A-Za-z0-9\s]+?)(?:Kode PLU|P x L x T|$)/i);
    if (categoryMatch && categoryMatch[1]) {
      const cleanCat = categoryMatch[1].replace(/<[^>]+>/g, '').trim();
      if (cleanCat && cleanCat.length > 1) {
        category = cleanCat;
      }
    }

    // 4. Description Extraction from HTML DOM & Meta Tags
    const descCandidates: string[] = [];

    // Meta description tag
    const metaDesc = doc.querySelector('meta[name="description"], meta[property="og:description"]')?.getAttribute('content');
    if (metaDesc && metaDesc.trim().length > 10 && !metaDesc.toLowerCase().includes('personal shopping') && !metaDesc.toLowerCase().includes('tokovirtualku')) {
      descCandidates.push(metaDesc.trim());
    }

    // DOM Selectors for Product Description
    doc.querySelectorAll('.product-description, .description, #description, .deskripsi, [class*="desc"], [id*="desc"], .product-detail, .detail-description').forEach(el => {
      const txt = el.textContent?.trim();
      if (txt && txt.length > 15 && !txt.toLowerCase().includes('copyright') && !txt.toLowerCase().includes('all rights reserved')) {
        descCandidates.push(txt);
      }
    });

    // Regex match in HTML
    const descMatch = html.match(/Deskripsi[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/i)
      || html.match(/Deskripsi[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i)
      || html.match(/Keterangan[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/i)
      || html.match(/Detail Produk[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/i);
    if (descMatch && descMatch[1]) {
      const cleanText = descMatch[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
      if (cleanText.length > 10) {
        descCandidates.unshift(cleanText);
      }
    }

    if (descCandidates.length > 0) {
      description = descCandidates[0];
    }

    // 5. Prices Extraction
    const priceMatches = [...fullText.matchAll(/Rp\s*([\d\.,]+)/gi)];
    const extractedPrices: number[] = [];
    priceMatches.forEach(m => {
      const cleaned = m[1].replace(/[\.,]/g, '');
      const num = Number(cleaned);
      if (!isNaN(num) && num > 1000 && !extractedPrices.includes(num)) {
        extractedPrices.push(num);
      }
    });

    if (extractedPrices.length >= 2) {
      extractedPrices.sort((a, b) => a - b);
      promoPrice = extractedPrices[0];
      price = extractedPrices[1];
    } else if (extractedPrices.length === 1) {
      price = extractedPrices[0];
    }

    // 6. Image Extraction
    doc.querySelectorAll('meta[property="og:image"], meta[property="og:image:secure_url"]').forEach(meta => {
      const content = meta.getAttribute('content');
      if (content) {
        const url = resolveUrl(content);
        if (url) {
          const proxied = proxyImageUrl(url);
          if (!realImages.includes(proxied)) realImages.push(proxied);
        }
      }
    });

    doc.querySelectorAll('script[type="application/json"], script[type="application/ld+json"]').forEach(script => {
      const text = script.textContent || '';
      const imgMatches = text.match(/https?:\/\/[^\s"']+\.(?:jpg|jpeg|png|webp|gif)[^\s"']*/gi);
      if (imgMatches) {
        imgMatches.forEach(imgUrl => {
          const url = resolveUrl(imgUrl.replace(/[\\,"']/g, ''));
          if (url) {
            const proxied = proxyImageUrl(url);
            if (!realImages.includes(proxied)) realImages.push(proxied);
          }
        });
      }
    });

    doc.querySelectorAll<HTMLImageElement>('img').forEach(img => {
      const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-original');
      if (src) {
        const url = resolveUrl(src);
        if (url) {
          const proxied = proxyImageUrl(url);
          if (!realImages.includes(proxied)) realImages.push(proxied);
        }
      }
    });

    const pluNum = Number(externalCode.replace(/[^\d]/g, '')) || Date.now();
    const fallbackPhotoPools = [
      ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800'],
      ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800'],
      ['https://images.unsplash.com/photo-1608248597263-0057e57b4524?w=800', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800']
    ];
    const selectedPool = fallbackPhotoPools[pluNum % fallbackPhotoPools.length];
    const finalImages = realImages.length > 0 ? realImages : selectedPool;

    let cleanTitle = title || '';
    cleanTitle = cleanTitle.replace(/\s*[\|-]\s*(Toko Saya|Alfamind|Nessamart|Tokovirtualku).*$/i, '').trim();

    const isGeneric = !cleanTitle || cleanTitle.length < 3 || ['tokosaya', 'alfamind', 'personal shopping assistant', 'beranda'].some(g => cleanTitle.toLowerCase() === g);

    if (isGeneric) {
      cleanTitle = brand ? `${brand} Produk Toko Saya PLU #${externalCode}` : `Produk Toko Saya PLU #${externalCode}`;
    }

    if (!price || price <= 0) {
      price = promoPrice ? Math.round(promoPrice * 1.15) : 85000;
    }

    const finalBrand = brand || 'Alfamind';
    const finalCategory = category || 'Alfamart (Sembako)';

    const cleanDescription = description || `${cleanTitle} - Produk Original Toko Saya Alfamind.\n\nSpesifikasi Produk:\n• Merek: ${finalBrand}\n• Kategori: ${finalCategory}\n• Kode PLU: ${externalCode}\n\nDeskripsi:\nDapatkan ${cleanTitle} kualitas terjamin langsung dari Toko Saya Alfamind. Dikirim cepat dan aman dari lokasi Alfamart terdekat.`;

    return {
      title: cleanTitle,
      price: price,
      promoPrice: promoPrice,
      brand: finalBrand,
      category: finalCategory,
      description: cleanDescription,
      images: finalImages,
      externalCode,
      sourceUrl
    };
  }
}
