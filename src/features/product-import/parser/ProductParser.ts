import type { ParsedProductData, RawOCRResult } from '../types';

export class ProductParser {
  private static knownBrands = [
    // Minyak & Sembako
    'Fortune', 'Bimoli', 'Sania', 'FILMA', 'Filma', 'Vipco', 'Tropical', 'Hemart',
    'Gulaku', 'Minyakita', 'Beras Sania',
    // Minuman & Kopi
    'Kapal Api', 'Torabika', 'Luwak White Koffie', 'Nescafe', 'Good Day',
    'Aqua', 'Le Minerale', 'Club', 'Vit', 'Sosro', 'Teh Botol', 'Sariwangi',
    // Susu
    'Ultra Milk', 'Dancow', 'Frisian Flag', 'Indomilk', 'Milo', 'Ovomaltine', 'Bear Brand',
    // Mie & Makanan Instan
    'Indomie', 'Sedaap', 'Supermi', 'Sarimi', 'Pop Mie', 'ABC',
    // Snack & Biskuit
    'Chitato', 'Taro', 'Pilus', 'Chitos', 'Oreo', 'Roma', 'Khong Guan',
    // Perawatan Diri
    'Rinso', 'Attack', 'Surf', 'Soklin', 'Sunlight',
    'Lifebuoy', 'Dettol', 'Biore', 'Sabun Cair',
    'Vaseline', 'Citra', 'Marina', 'Nivea',
    'Sunsilk', 'Clear', 'Pantene', 'Rejoice',
    "Pond's", 'Garnier', 'Olay',
    'Pepsodent', 'Sensodyne', 'Ciptadent',
    // Bumbu & Dapur
    'Bango', 'Royco', 'Masako', 'Indofood', 'Blue Band', 'Sania', 'Kunci Mas'
  ];

  static parse(ocrResult: RawOCRResult): ParsedProductData {
    const lines = ocrResult.lines || ocrResult.text.split('\n');
    let titleLine = lines[0] || 'Unknown Product';
    let brand: string | undefined = undefined;
    let variant: string | undefined = undefined;
    let packageSize: string | undefined = undefined;
    let currentPrice = 0;
    let originalPrice: number | undefined = undefined;
    let promoBadge: string | undefined = undefined;
    let discountBadge: string | undefined = undefined;

    // Detect known brands
    for (const b of this.knownBrands) {
      if (titleLine.toLowerCase().includes(b.toLowerCase())) {
        brand = b;
        break;
      }
    }

    // Detect prices & explicit strikethrough indicators
    const priceMatches: number[] = [];
    let hasStrikethroughPrice = false;
    let strikethroughExplicitPrice: number | undefined = undefined;

    for (const line of lines) {
      // Check explicit strikethrough price indicators in line text
      if (/coret|harga coret|normal|asli|sebelumnya|<s>|<del>|~/i.test(line)) {
        hasStrikethroughPrice = true;
        const match = line.match(/(?:Rp\.?\s*)?(\d{1,3}(?:[\.,]\d{3})+|\d{3,7})/i);
        if (match) {
          const num = parseInt(match[1].replace(/[\.,]/g, ''), 10);
          if (!isNaN(num) && num > 100) {
            strikethroughExplicitPrice = num;
          }
        }
      }

      // Robust per-line price matching using matchAll (avoids stateful regex lastIndex bug)
      const matches = line.matchAll(/(?:Rp\.?\s*)?(\d{1,3}(?:[\.,]\d{3})+|\d{3,7})(?:\s*,-)?/gi);
      for (const match of matches) {
        if (match[1]) {
          const numeric = parseInt(match[1].replace(/[\.,]/g, ''), 10);
          // Filter out package weight/sizes (e.g. 85g, 68g, 2L, 5kg)
          if (!isNaN(numeric) && numeric >= 100 && numeric <= 10000000) {
            priceMatches.push(numeric);
          }
        }
      }

      // Detect Badges
      if (/promo|spesial|best seller/i.test(line)) {
        promoBadge = line.trim();
      }
      if (/diskon|\%/i.test(line)) {
        discountBadge = line.trim();
      }
    }

    if (priceMatches.length >= 2) {
      // Multiple prices on card (e.g. promo selling price & strikethrough original price)
      currentPrice = Math.min(...priceMatches);
      originalPrice = Math.max(...priceMatches);
      hasStrikethroughPrice = true;
    } else if (hasStrikethroughPrice || strikethroughExplicitPrice) {
      currentPrice = priceMatches[0] || (strikethroughExplicitPrice ? strikethroughExplicitPrice * 0.9 : 0);
      originalPrice = strikethroughExplicitPrice || currentPrice * 1.15;
      hasStrikethroughPrice = true;
    } else {
      currentPrice = priceMatches[0] || 0;
      originalPrice = undefined;
      hasStrikethroughPrice = false;
    }

    const isPromo = hasStrikethroughPrice && (!!originalPrice && originalPrice > currentPrice);
    let discountPercentage: number | undefined = undefined;

    if (isPromo && originalPrice && originalPrice > currentPrice && currentPrice > 0) {
      discountPercentage = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
      if (!discountBadge && discountPercentage > 0) {
        discountBadge = `Diskon ${discountPercentage}%`;
      }
    }

    // Extract size patterns (e.g. 2L, 85g, 5kg, 1kg, 200ml, 600ml)
    const sizeMatch = titleLine.match(/(\d+(?:\.\d+)?\s*(?:kg|g|gr|l|litur|ltr|ml|pack|pcs))/i);
    if (sizeMatch) {
      packageSize = sizeMatch[1];
    }

    // Extract variant
    if (/pouch|botol|sachet|kotak|karung|refill|spesial|goreng/i.test(titleLine)) {
      const varMatch = titleLine.match(/(pouch|botol|sachet|kotak|karung|refill|spesial|goreng)/i);
      if (varMatch) variant = varMatch[1];
    }

    return {
      extracted_brand: brand,
      extracted_name: titleLine.trim(),
      variant,
      package_size: packageSize,
      current_price: currentPrice,
      original_price: originalPrice,
      has_strikethrough_price: hasStrikethroughPrice,
      strikethrough_price: originalPrice,
      discount_percentage: discountPercentage,
      is_promo: isPromo,
      promo_badge: promoBadge || (isPromo ? 'PROMO HARGA CORET' : undefined),
      discount_badge: discountBadge
    };
  }
}
