import type { AICategoryRecommendation, AICorrectedData, NormalizedProductData } from '../types';

export class AICorrection {
  static correct(normalized: NormalizedProductData): {
    aiCorrectedData: AICorrectedData;
    aiCategoryRecommendation: AICategoryRecommendation;
  } {
    let name = normalized.normalized_name || '';
    let brand = normalized.normalized_brand || '';
    let isCorrected = false;
    const notes: string[] = [];

    // --- OCR Typo Corrections ---
    const corrections: [RegExp, string][] = [
      [/fortuna/gi, 'Fortune'],
      [/mynk/gi, 'Minyak'],
      [/shmp\b/gi, 'Shampoo'],
      [/dtjr\b|dtrj\b/gi, 'Deterjen'],
    ];

    corrections.forEach(([pattern, replacement]) => {
      if (pattern.test(name)) {
        name = name.replace(pattern, replacement);
        isCorrected = true;
        notes.push(`Typo: ${pattern} → ${replacement}`);
      }
    });

    // --- AI Category Recommendation from product name/brand ---
    type CategoryDef = { category: string; subcategory: string; shelfGroup: string; tags: string[] };

    const categoryRules: [RegExp, CategoryDef][] = [
      [/mie|indomie|sedaap|bakmi/i, { category: 'Bahan Pokok & Sembako', subcategory: 'Mie Instan', shelfGroup: 'Rak Makanan Instan', tags: ['mie', 'instan'] }],
      [/beras|nasi|ramos/i, { category: 'Bahan Pokok & Sembako', subcategory: 'Beras', shelfGroup: 'Area Beras & Karungan', tags: ['beras', 'sembako'] }],
      [/gula|gulaku|pemanis/i, { category: 'Bahan Pokok & Sembako', subcategory: 'Gula & Pemanis', shelfGroup: 'Rak Sembako Utama', tags: ['gula', 'sembako'] }],
      [/minyak|goreng|bimoli|sania|fortune|filma|vipco/i, { category: 'Bahan Pokok & Sembako', subcategory: 'Minyak Goreng', shelfGroup: 'Rak Sembako Utama', tags: ['minyak', 'memasak'] }],
      [/kopi|kapal api|torabika|luwak|nescafe/i, { category: 'Minuman & Kopi', subcategory: 'Kopi & Minuman Serbuk', shelfGroup: 'Rak Minuman Serbuk', tags: ['kopi', 'minuman'] }],
      [/teh|sosro|sariwangi/i, { category: 'Minuman & Kopi', subcategory: 'Teh', shelfGroup: 'Rak Minuman Serbuk', tags: ['teh', 'minuman'] }],
      [/susu|milk|dancow|frisian|milo/i, { category: 'Susu & Produk Susu', subcategory: 'Susu & Minuman Susu', shelfGroup: 'Rak Susu & Minuman', tags: ['susu', 'minuman'] }],
      [/snack|chitato|pilus|taro|chitos|coklat|wafer|biskuit/i, { category: 'Snack & Camilan', subcategory: 'Snack & Camilan', shelfGroup: 'Rak Snack', tags: ['snack', 'camilan'] }],
      [/sabun|lifebuoy|dettol|mandi/i, { category: 'Perawatan Diri & Mandi', subcategory: 'Sabun Mandi', shelfGroup: 'Rak Toiletries', tags: ['sabun', 'mandi'] }],
      [/shampoo|sunsilk|clear|pantene|rejoice|rambut/i, { category: 'Perawatan Diri & Mandi', subcategory: 'Perawatan Rambut', shelfGroup: 'Rak Toiletries', tags: ['shampoo', 'rambut'] }],
      [/lotion|hbl|hand body|vaseline|citra|marina|nivea/i, { category: 'Perawatan Diri & Mandi', subcategory: 'Pelembab & Body Lotion', shelfGroup: 'Rak Toiletries', tags: ['lotion', 'body care'] }],
      [/pasta gigi|sikat gigi|odol|pepsodent|sensodyne/i, { category: 'Perawatan Diri & Mandi', subcategory: 'Perawatan Gigi & Mulut', shelfGroup: 'Rak Toiletries', tags: ['gigi', 'oral care'] }],
      [/deterjen|rinso|sunlight|sabun cuci|pembersih/i, { category: 'Perawatan Rumah', subcategory: 'Deterjen & Pembersih', shelfGroup: 'Rak Pembersih Rumah', tags: ['deterjen', 'kebersihan'] }],
      [/air mineral|aqua|vit |club |le minerale/i, { category: 'Minuman & Kopi', subcategory: 'Air Mineral', shelfGroup: 'Rak Minuman Botol', tags: ['air', 'minuman'] }],
      [/kursi|meja|wadah|plastik|olymplast/i, { category: 'Perlengkapan Rumah', subcategory: 'Perabotan Plastik', shelfGroup: 'Rak Perlengkapan Rumah', tags: ['rumah', 'plastik'] }],
    ];

    // Match based on Strikethrough first (Promo detection)
    const isPromoDetected = normalized.is_promo ||
      normalized.has_strikethrough_price ||
      (!!normalized.original_price && normalized.original_price > normalized.current_price);

    let matched: CategoryDef | null = null;
    const nameLower = name.toLowerCase();
    const brandLower = brand.toLowerCase();
    const combinedText = `${nameLower} ${brandLower}`;

    for (const [pattern, def] of categoryRules) {
      if (pattern.test(combinedText)) {
        matched = def;
        break;
      }
    }

    let category = matched?.category || 'Produk Umum';
    let subcategory = matched?.subcategory || 'Lainnya';
    let shelfGroup = matched?.shelfGroup || 'Rak Lainnya';
    let tags = [...(matched?.tags || ['produk'])];
    const keywords = [nameLower, brandLower].filter(Boolean);

    if (isPromoDetected) {
      category = 'Promo Merchant';
      subcategory = `Promo (${matched?.subcategory || 'Harga Coret'})`;
      shelfGroup = 'Rak Promo & Harga Coret';
      tags = [...tags, 'promo', 'harga-coret'];
      notes.push(`Deteksi Harga Coret (Promo Rp ${normalized.normalized_price?.toLocaleString('id-ID')} vs Normal Rp ${normalized.original_price?.toLocaleString('id-ID') || 0})`);
      isCorrected = true;
    }

    return {
      aiCorrectedData: {
        corrected_name: name,
        corrected_brand: brand || 'Generik',
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
        confidence: matched ? 92 : 55
      }
    };
  }
}

