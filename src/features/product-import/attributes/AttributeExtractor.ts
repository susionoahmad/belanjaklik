import type { ExtractedAttributes, NormalizedProductData } from '../types';

export class AttributeExtractor {
  static extract(normalized: NormalizedProductData): ExtractedAttributes {
    const text = `${normalized.normalized_name} ${normalized.normalized_brand} ${normalized.normalized_size}`.toLowerCase();

    let volume: string | undefined = undefined;
    let weight: string | undefined = undefined;
    let packaging = 'Pouch / Pack';
    let usage = 'Kebutuhan Dapur & Memasak Harian';
    let storage = 'Simpan di tempat sejuk dan kering, jauhi sinar matahari langsung.';
    let shelfLife = '12 - 24 Bulan';

    if (/\d+\s*ml|\d+\s*l\b/i.test(normalized.normalized_size)) {
      volume = normalized.normalized_size;
    }
    if (/\d+\s*g|\d+\s*kg\b/i.test(normalized.normalized_size)) {
      weight = normalized.normalized_size;
    }

    if (text.includes('botol')) packaging = 'Botol Plastik';
    if (text.includes('karung')) packaging = 'Karung Plastik';
    if (text.includes('kotak')) packaging = 'Kotak Karton / UHT';
    if (text.includes('sachet')) packaging = 'Sachet / Bungkus Kecil';

    if (text.includes('sabun') || text.includes('lotion')) {
      usage = 'Perawatan Kebersihan Tubuh Mandi Harian';
      shelfLife = '24 - 36 Bulan';
    }

    return {
      brand: normalized.normalized_brand || 'Umum',
      category: 'Sembako & Groceries',
      variant: normalized.variant || 'Standar',
      packaging,
      volume,
      weight,
      unit: normalized.normalized_unit,
      target_audience: 'Keluarga & Rumah Tangga Indonesia',
      usage,
      storage_recommendation: storage,
      shelf_life: shelfLife
    };
  }
}
