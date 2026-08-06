import type { NormalizedProductData, ParsedProductData } from '../types';

export class ProductNormalizer {
  private static abbreviationMap: Record<string, string> = {
    'HBL': 'Hand Body Lotion',
    'Mynk': 'Minyak',
    'Grg': 'Goreng',
    'Spsl': 'Spesial',
    'Prm': 'Premium',
    'Shmp': 'Shampoo',
    'Dtrj': 'Deterjen',
    'Litr': 'Liter',
    'Litur': 'Liter',
    'Btl': 'Botol',
    'Pch': 'Pouch'
  };

  static normalize(parsed: ParsedProductData): NormalizedProductData {
    let name = parsed.extracted_name || '';

    // Expand abbreviations
    Object.keys(this.abbreviationMap).forEach(abbr => {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      name = name.replace(regex, this.abbreviationMap[abbr]);
    });

    // Clean duplicate spaces
    name = name.replace(/\s+/g, ' ').trim();

    // Normalize unit size strings (2ltr -> 2 L, 600ml -> 600 ml, 250gr -> 250 g, 5kg -> 5 kg)
    let normalizedSize = parsed.package_size || '';
    if (normalizedSize) {
      normalizedSize = normalizedSize
        .replace(/(\d+)\s*(ltr|litur|liter|l)\b/gi, '$1 L')
        .replace(/(\d+)\s*(ml)\b/gi, '$1 ml')
        .replace(/(\d+)\s*(gr|g|gram)\b/gi, '$1 g')
        .replace(/(\d+)\s*(kg|kilo)\b/gi, '$1 kg');
    }

    // Extract unit type
    let unit = 'pcs';
    if (/l\b|liter|pouch/i.test(normalizedSize + ' ' + (parsed.variant || ''))) {
      unit = 'pouch';
    } else if (/ml\b|botol/i.test(normalizedSize + ' ' + (parsed.variant || ''))) {
      unit = 'botol';
    } else if (/kg\b|karung/i.test(normalizedSize + ' ' + (parsed.variant || ''))) {
      unit = 'karung';
    } else if (/g\b|bungkus/i.test(normalizedSize + ' ' + (parsed.variant || ''))) {
      unit = 'bungkus';
    }

    // Format brand
    let brand = parsed.extracted_brand || '';
    if (brand) {
      brand = brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
    }

    return {
      ...parsed,
      normalized_name: name,
      normalized_brand: brand,
      normalized_unit: unit,
      normalized_size: normalizedSize,
      normalized_price: Math.round(parsed.current_price || 0)
    };
  }
}
