import type { Product } from '../../shared/types';
import type { NormalizedProductData } from '../types';
import { ImageEmbeddingService } from '../embeddings/ImageEmbeddingService';

export class ImageMatcher {
  static match(cropImageUrl: string, data: NormalizedProductData, catalog: Product[]): { candidate: Product | null; score: number } {
    if (!cropImageUrl) return { candidate: null, score: 0 };
    const cropVector = ImageEmbeddingService.generateEmbedding(cropImageUrl);

    let bestProduct: Product | null = null;
    let maxScore = 0;

    const cat1 = (data.normalized_name + ' ' + (data.normalized_brand || '')).toLowerCase();

    for (const p of catalog) {
      const cat2 = (p.name + ' ' + (p.brand || '') + ' ' + (p.category || '')).toLowerCase();

      // Category sanity check: avoid matching food/oil to plastic furniture
      if ((cat1.includes('minyak') || cat1.includes('goreng')) && !cat2.includes('minyak') && !cat2.includes('goreng') && !cat2.includes('sembako')) {
        continue;
      }

      const prodVector = ImageEmbeddingService.generateEmbedding(p.image_url || p.name);
      const sim = ImageEmbeddingService.cosineSimilarity(cropVector, prodVector);
      if (sim > maxScore) {
        maxScore = sim;
        bestProduct = p;
      }
    }

    return { candidate: bestProduct, score: maxScore };
  }
}

export class AIMatcher {
  static match(data: NormalizedProductData, catalog: Product[]): { candidate: Product | null; confidence: number } {
    const matchedBrand = catalog.find(p => p.brand && data.normalized_brand && p.brand.toLowerCase() === data.normalized_brand.toLowerCase());
    if (matchedBrand) {
      return { candidate: matchedBrand, confidence: 0.88 };
    }
    return { candidate: null, confidence: 0 };
  }
}
