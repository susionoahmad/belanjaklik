import type { Product } from '../../shared/types';
import type { NormalizedProductData } from '../types';

export class TextMatcher {
  static calculateStringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    if (s1 === s2) return 1.0;

    const words1 = new Set(s1.split(/\s+/).filter(w => w.length > 1));
    const words2 = new Set(s2.split(/\s+/).filter(w => w.length > 1));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }

  static match(data: NormalizedProductData, catalog: Product[]): { candidate: Product | null; score: number } {
    let bestProduct: Product | null = null;
    let maxScore = 0;

    const brand1 = (data.normalized_brand || '').toLowerCase().trim();

    for (const p of catalog) {
      const brand2 = (p.brand || '').toLowerCase().trim();
      let score = this.calculateStringSimilarity(data.normalized_name, p.name);

      // If brands are specified and completely different (e.g. FILMA vs Bimoli), apply penalty
      if (brand1 && brand2 && brand1 !== brand2 && !p.name.toLowerCase().includes(brand1)) {
        score = score * 0.4;
      }

      if (score > maxScore) {
        maxScore = score;
        bestProduct = p;
      }
    }

    return { candidate: bestProduct, score: maxScore };
  }
}
