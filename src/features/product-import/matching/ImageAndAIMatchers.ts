import type { Product } from '../../shared/types';
import type { NormalizedProductData } from '../types';
import { ImageEmbeddingService } from '../embeddings/ImageEmbeddingService';

export class ImageMatcher {
  static match(cropImageUrl: string, data: NormalizedProductData, catalog: Product[]): { candidate: Product | null; score: number } {
    if (!cropImageUrl || !catalog || catalog.length === 0) return { candidate: null, score: 0 };

    const targetName = (data.normalized_name || '').toLowerCase().trim();
    const targetBrand = (data.normalized_brand || '').toLowerCase().trim();

    if (!targetName) return { candidate: null, score: 0 };

    let bestProduct: Product | null = null;
    let maxScore = 0;

    for (const p of catalog) {
      const pName = p.name.toLowerCase().trim();
      const pBrand = (p.brand || '').toLowerCase().trim();

      // Sanity Check 1: Reject different explicit brands (e.g. Indomie vs FILMA)
      if (targetBrand && pBrand && targetBrand !== pBrand && !pName.includes(targetBrand)) {
        continue;
      }

      // Sanity Check 2: Reject products with zero word overlap in product name
      const targetWords = targetName.split(/\s+/).filter(w => w.length >= 3);
      const candidateWords = pName.split(/\s+/).filter(w => w.length >= 3);
      const hasWordOverlap = targetWords.some(w => candidateWords.includes(w));

      if (!hasWordOverlap) {
        continue;
      }

      const cropVector = ImageEmbeddingService.generateEmbedding(cropImageUrl);
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
