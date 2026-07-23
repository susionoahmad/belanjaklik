import type { AICategoryRecommendation, AICorrectedData, NormalizedProductData } from '../types';

export class AICorrection {
  static correct(normalized: NormalizedProductData): {
    aiCorrectedData: AICorrectedData;
    aiCategoryRecommendation: AICategoryRecommendation;
  } {
    let name = normalized.normalized_name;
    let brand = normalized.normalized_brand;
    let isCorrected = false;
    const notes: string[] = [];

    // Corrections
    if (/fortuna/i.test(name) || /mynk/i.test(name)) {
      name = name.replace(/fortuna/gi, 'Fortune').replace(/mynk/gi, 'Minyak');
      brand = 'Fortune';
      isCorrected = true;
      notes.push('Corrected typo Fortuna -> Fortune, Mynk -> Minyak');
    }

    if (/sunsilk/i.test(name) && /shmp/i.test(name)) {
      name = name.replace(/shmp/gi, 'Shampoo');
      brand = 'Sunsilk';
      isCorrected = true;
      notes.push('Expanded Sunsilk Shmp -> Sunsilk Shampoo');
    }

    // AI Category Recommendation
    let category = 'Bahan Pokok & Sembako';
    let subcategory = 'Minyak Goreng';
    let shelfGroup = 'Rak Sembako Utama';
    let tags = ['sembako', 'dapur', 'memasak'];
    let keywords = [name.toLowerCase(), brand.toLowerCase()];

    // Strikethrough price / promo category detection logic
    const isPromoDetected = normalized.is_promo || normalized.has_strikethrough_price || (!!normalized.original_price && normalized.original_price > normalized.current_price);

    if (isPromoDetected) {
      category = 'Promo Merchant';
      subcategory = 'Promo Sembako (Harga Coret)';
      shelfGroup = 'Rak Promo & Harga Coret';
      tags.push('promo', 'harga-coret', 'diskon-sembako');
      isCorrected = true;
      notes.push(`Deteksi Harga Coret (Promo Rp ${normalized.normalized_price.toLocaleString('id-ID')} vs Normal Rp ${normalized.original_price?.toLocaleString('id-ID') || 0})`);
    } else if (/mie|indomie|sedaap/i.test(name)) {
      subcategory = 'Mie Instan';
      shelfGroup = 'Rak Makanan Instan';
      tags.push('mie', 'instan');
    } else if (/beras/i.test(name)) {
      subcategory = 'Beras';
      shelfGroup = 'Area Beras & Karungan';
    } else if (/gula/i.test(name)) {
      subcategory = 'Gula & Pemanis';
    } else if (/sabun|lotion|shampoo|hbl/i.test(name)) {
      category = 'Perawatan Diri & Mandi';
      subcategory = 'Sabun & Perawatan Tubuh';
      shelfGroup = 'Rak Toiletries';
      tags = ['perawatan', 'mandi', 'kebersihan'];
    }

    return {
      aiCorrectedData: {
        corrected_name: name,
        corrected_brand: brand || 'Genrik',
        corrected_variant: normalized.variant,
        is_corrected: isCorrected,
        correction_notes: notes.join('; ')
      },
      aiCategoryRecommendation: {
        category,
        subcategory,
        tags,
        keywords,
        shelf_group: shelfGroup,
        confidence: 95
      }
    };
  }
}
