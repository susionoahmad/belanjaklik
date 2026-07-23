import type { Product } from '../../shared/types';
import type { NormalizedProductData } from '../types';

export class BarcodeMatcher {
  static match(data: NormalizedProductData, catalog: Product[]): Product | null {
    if (!data.barcode) return null;
    return catalog.find(p => p.barcode && p.barcode.trim() === data.barcode?.trim()) || null;
  }
}
