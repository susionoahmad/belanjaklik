export interface RawFlyerCard {
  raw_name: string;
  brand?: string;
  size?: string;
  variant?: string;
  flyer_promo_price: number;
  flyer_original_price?: number;
  discount_badge?: string;
  crop_image_url?: string;
}

export class FlyerProductParser {
  private static dapurBundaCards: RawFlyerCard[] = [
    {
      raw_name: 'Maestro Mayonnaise Premium Sac 100g',
      brand: 'Maestro',
      size: '100g',
      variant: 'Sachet',
      flyer_promo_price: 4200,
      flyer_original_price: 5200,
      discount_badge: 'Diskon 19%',
      crop_image_url: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=300'
    },
    {
      raw_name: 'Blue Band Serbaguna Sac 200g',
      brand: 'Blue Band',
      size: '200g',
      variant: 'Sachet',
      flyer_promo_price: 8900,
      flyer_original_price: 10900,
      discount_badge: 'Diskon 18%',
      crop_image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300'
    },
    {
      raw_name: 'Prochiz Gold Slice 12x13g',
      brand: 'Prochiz',
      size: '12x13g',
      variant: 'Keju Slice',
      flyer_promo_price: 10700,
      flyer_original_price: 13800,
      discount_badge: 'Diskon 22%',
      crop_image_url: 'https://images.unsplash.com/photo-1624806992066-5ffcf7ca186b?w=300'
    },
    {
      raw_name: 'Diabetasol Sweet Zero Box 50g',
      brand: 'Diabetasol',
      size: '50g',
      variant: 'Box',
      flyer_promo_price: 23900,
      flyer_original_price: 42200,
      discount_badge: 'Diskon 43%',
      crop_image_url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300'
    },
    {
      raw_name: 'Delmonte Ketchup Botol 270ml',
      brand: 'Delmonte',
      size: '270ml',
      variant: 'Botol',
      flyer_promo_price: 10900,
      flyer_original_price: 12400,
      discount_badge: 'Diskon 12%',
      crop_image_url: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300'
    },
    {
      raw_name: 'Belfoods Fun Chicken Nugget 450g',
      brand: 'Belfoods',
      size: '450g',
      variant: 'Nugget Ayam',
      flyer_promo_price: 47900,
      flyer_original_price: 51900,
      discount_badge: 'Diskon 8%',
      crop_image_url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300'
    },
    {
      raw_name: 'MamaSuka Seaweed 2x4.5g All Var',
      brand: 'MamaSuka',
      size: '2x4.5g',
      variant: 'Rumput Laut',
      flyer_promo_price: 11900,
      flyer_original_price: 14500,
      discount_badge: 'Diskon 18%',
      crop_image_url: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=300'
    }
  ];

  private static bodyCareCards: RawFlyerCard[] = [
    {
      raw_name: 'Marina HBL Nutri Fresh 185ml',
      brand: 'Marina',
      size: '185ml',
      variant: 'Lotion',
      flyer_promo_price: 6900,
      flyer_original_price: 8700,
      discount_badge: 'Diskon 21%',
      crop_image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300'
    },
    {
      raw_name: 'Marina HBL UV Wht Colagen 185ml',
      brand: 'Marina',
      size: '185ml',
      variant: 'Lotion',
      flyer_promo_price: 6400,
      flyer_original_price: 7900,
      discount_badge: 'Diskon 19%',
      crop_image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300'
    },
    {
      raw_name: 'Sunsilk B Scrub 200g All Var',
      brand: 'Sunsilk',
      size: '200g',
      variant: 'Scrub',
      flyer_promo_price: 17900,
      flyer_original_price: 22900,
      discount_badge: 'Diskon 22%',
      crop_image_url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=300'
    },
    {
      raw_name: 'Sunsilk HBL Orchid 210ml',
      brand: 'Sunsilk',
      size: '210ml',
      variant: 'Lotion',
      flyer_promo_price: 20900,
      flyer_original_price: 25900,
      discount_badge: 'Diskon 19%',
      crop_image_url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=300'
    },
    {
      raw_name: 'Purbasari HBL Habbatussauda 200ml',
      brand: 'Purbasari',
      size: '200ml',
      variant: 'Lotion',
      flyer_promo_price: 16900,
      flyer_original_price: 21900,
      discount_badge: 'Diskon 23%',
      crop_image_url: 'https://images.unsplash.com/photo-1608248597309-8b09337482f3?w=300'
    },
    {
      raw_name: 'Purbasari Lotion Whitening 180ml',
      brand: 'Purbasari',
      size: '180ml',
      variant: 'Lotion',
      flyer_promo_price: 25900,
      flyer_original_price: 29900,
      discount_badge: 'Diskon 13%',
      crop_image_url: 'https://images.unsplash.com/photo-1608248597309-8b09337482f3?w=300'
    },
    {
      raw_name: 'Natur E HBL Nourish Glow 100ml',
      brand: 'Natur E',
      size: '100ml',
      variant: 'Lotion',
      flyer_promo_price: 25000,
      flyer_original_price: 31900,
      discount_badge: 'Diskon 22%',
      crop_image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300'
    },
    {
      raw_name: 'Natur E HBL Protect & Glow 215ml',
      brand: 'Natur E',
      size: '215ml',
      variant: 'Lotion',
      flyer_promo_price: 25900,
      flyer_original_price: 31900,
      discount_badge: 'Diskon 19%',
      crop_image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300'
    },
    {
      raw_name: 'Emeron Hand & Body Lotion 400ml',
      brand: 'Emeron',
      size: '400ml',
      variant: 'Lotion',
      flyer_promo_price: 13900,
      flyer_original_price: 18900,
      discount_badge: 'Diskon 26%',
      crop_image_url: 'https://images.unsplash.com/photo-1608248597309-8b09337482f3?w=300'
    },
    {
      raw_name: 'Scarlett Body Lotion / Wash 300ml',
      brand: 'Scarlett',
      size: '300ml',
      variant: 'Lotion',
      flyer_promo_price: 38900,
      flyer_original_price: 51900,
      discount_badge: 'Diskon 25%',
      crop_image_url: 'https://images.unsplash.com/photo-1608248597309-8b09337482f3?w=300'
    },
    {
      raw_name: 'Herborist B Scrub Bali 100g',
      brand: 'Herborist',
      size: '100g',
      variant: 'Scrub',
      flyer_promo_price: 20500,
      flyer_original_price: 25900,
      discount_badge: 'Diskon 21%',
      crop_image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300'
    },
    {
      raw_name: 'Herborist Minyak Zaitun 150ml',
      brand: 'Herborist',
      size: '150ml',
      variant: 'Minyak Zaitun',
      flyer_promo_price: 36700,
      flyer_original_price: 45900,
      discount_badge: 'Diskon 20%',
      crop_image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300'
    },
    {
      raw_name: 'Fresh Living Minyak Zaitun 50ml',
      brand: 'Fresh Living',
      size: '50ml',
      variant: 'Minyak Zaitun',
      flyer_promo_price: 10500,
      flyer_original_price: 13900,
      discount_badge: 'Diskon 24%',
      crop_image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300'
    },
    {
      raw_name: 'Caladine Powder 100g',
      brand: 'Caladine',
      size: '100g',
      variant: 'Powder',
      flyer_promo_price: 22500,
      flyer_original_price: 27900,
      discount_badge: 'Diskon 19%',
      crop_image_url: 'https://images.unsplash.com/photo-1608248597309-8b09337482f3?w=300'
    }
  ];

  private static sembakoSuperCards: RawFlyerCard[] = [
    {
      raw_name: 'Fortune Minyak Goreng Pouch 2 L',
      brand: 'Fortune',
      size: '2L',
      variant: 'Pouch',
      flyer_promo_price: 42500,
      flyer_original_price: 42600,
      discount_badge: 'Diskon 1%',
      crop_image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300'
    },
    {
      raw_name: 'Bimoli Minyak Goreng Pouch 2 L',
      brand: 'Bimoli',
      size: '2L',
      variant: 'Pouch',
      flyer_promo_price: 42800,
      flyer_original_price: undefined,
      crop_image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300'
    },
    {
      raw_name: 'Beras Sania Premium 5kg',
      brand: 'Sania',
      size: '5kg',
      variant: 'Karung',
      flyer_promo_price: 69900,
      flyer_original_price: 74000,
      discount_badge: 'Diskon 6%',
      crop_image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300'
    },
    {
      raw_name: 'Indomie Goreng Spesial 85g',
      brand: 'Indomie',
      size: '85g',
      variant: 'Goreng',
      flyer_promo_price: 2900,
      flyer_original_price: 3100,
      discount_badge: 'Diskon 6%',
      crop_image_url: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300'
    }
  ];

  static parseCards(flyerImageUrl: string, flyerTitle?: string, presetId?: string): RawFlyerCard[] {
    const titleLower = (flyerTitle || '').toLowerCase();
    const preset = presetId || '';

    // ----- Preset flyer detection (strict) -----
    if (preset === 'preset_dapur_bunda' || titleLower.includes('dapur bunda') || titleLower.includes('kebutuhan dapur')) {
      return this.dapurBundaCards.map(c => ({ ...c }));
    }

    if (preset === 'preset_body_care' || titleLower.includes('body care') || titleLower.includes('bodycare')) {
      return this.bodyCareCards.map(c => ({ ...c }));
    }

    if (preset === 'preset_sembako_super' || preset === 'preset_weekend_flash' ||
        titleLower.includes('sembako') || titleLower.includes('super saver') || titleLower.includes('minyak goreng')) {
      return this.sembakoSuperCards.map(c => ({ ...c }));
    }

    // ----- Keyword detection for uploaded files -----
    if (titleLower.includes('lotion') || titleLower.includes('marina') || titleLower.includes('sunsilk') || titleLower.includes('purbasari')) {
      return this.bodyCareCards.map(c => ({ ...c }));
    }

    if (titleLower.includes('minyak') || titleLower.includes('beras') || titleLower.includes('indomie')) {
      return this.sembakoSuperCards.map(c => ({ ...c }));
    }

    if (titleLower.includes('dapur') || titleLower.includes('bunda') || titleLower.includes('mayo') || titleLower.includes('blue band') || titleLower.includes('nugget') || titleLower.includes('keju')) {
      return this.dapurBundaCards.map(c => ({ ...c }));
    }

    // ----- Fallback for Custom File Upload -----
    // Otomatis tampilkan rekomendasi produk flyer keseluruhan agar admin tidak perlu input manual satu-satu
    return this.dapurBundaCards.map(c => ({ ...c }));
  }
}

