import type { Product } from '../../shared/types';
import type { NormalizedProductData } from '../types';

export class TextMatcher {
  static extractSize(name: string): string | null {
    const norm = name.toLowerCase();
    const match = norm.match(/(\d+(?:\.\d+)?\s*(?:kg|g|gr|l|litur|ltr|ml|pack|pcs))/i);
    return match ? match[1].replace(/\s+/g, '').toLowerCase() : null;
  }

  static extractVariantTokens(name: string): Set<string> {
    const genericWords = new Set([
      'indomie', 'sedaap', 'sarimi', 'supermi', 'pop', 'abc', 'roma', 'khong', 'guan',
      'mi', 'mie', 'instan', 'instant', 'makanan', 'minuman', 'minyak', 'beras',
      'g', 'gr', 'gram', 'kg', 'l', 'ml', 'pcs', 'pack', 'bungkus'
    ]);
    const words = name
      .toLowerCase()
      .split(/\s+/)
      .map(w => w.replace(/[^a-z0-9]/g, ''))
      .filter(w => w.length > 1 && !genericWords.has(w));
    return new Set(words);
  }

  static isVariantConflict(name1: string, name2: string): boolean {
    const size1 = this.extractSize(name1);
    const size2 = this.extractSize(name2);

    if (size1 && size2 && size1 !== size2) {
      return true; // Size conflict (e.g. 120g vs 86g)
    }

    const v1 = this.extractVariantTokens(name1);
    const v2 = this.extractVariantTokens(name2);

    if (v1.size > 0 && v2.size > 0) {
      const common = [...v1].filter(x => v2.has(x));
      if (common.length === 0) {
        return true; // Distinct variant conflict (e.g. cabe ijo vs tori miso)
      }
    }

    return false;
  }

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

  static match(data: NormalizedProductData, catalog: Product[]): { candidate: Product | null; score: number; hasConflict: boolean } {
    let bestProduct: Product | null = null;
    let maxScore = 0;
    let bestConflict = false;

    const brand1 = (data.normalized_brand || '').toLowerCase().trim();

    for (const p of catalog) {
      const brand2 = (p.brand || '').toLowerCase().trim();
      let score = this.calculateStringSimilarity(data.normalized_name, p.name);

      // If brands are specified and completely different (e.g. FILMA vs Bimoli), apply penalty
      if (brand1 && brand2 && brand1 !== brand2 && !p.name.toLowerCase().includes(brand1)) {
        score = score * 0.4;
      }

      const conflict = this.isVariantConflict(data.normalized_name, p.name);

      if (score > maxScore) {
        maxScore = score;
        bestProduct = p;
        bestConflict = conflict;
      }
    }

    return { candidate: bestProduct, score: maxScore, hasConflict: bestConflict };
  }
}
