import { supabase, isSupabaseConfigured } from './supabaseClient';
import { offlineDb } from './offlineDb';
import type { Product, Category, FulfillmentChannel, ShoppingTemplate, ShoppingRequest, StoreProfile, ProductSource } from '../types';

// INITIAL FALLBACK DATASET FOR IMMEDIATE OFFLINE / MOCK DEMO EXECUTION
const DEFAULT_CHANNELS: FulfillmentChannel[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Alfamind Official (Toko Saya)',
    slug: 'alfamind-official',
    base_url: 'https://tokovirtualku.id/nessamart/detail/',
    icon_url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=150',
    logo: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=150',
    description: 'Toko Resmi Alfamind - Beli Langsung di Toko Virtual Saya',
    is_active: true,
    sort_order: 1
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Alfamind Grocery',
    slug: 'alfamind-grocery',
    base_url: null,
    icon_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150',
    logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150',
    description: 'Asisten Belanja Sembako Alfamind diproses Store Owner',
    is_active: true,
    sort_order: 2
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Pasar Tradisional',
    slug: 'pasar-tradisional',
    base_url: null,
    icon_url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=150',
    logo: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=150',
    description: 'Bahan Segar & Sayuran Langsung dari Pasar',
    is_active: true,
    sort_order: 3
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Supermarket Lokal',
    slug: 'supermarket-lokal',
    base_url: null,
    icon_url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=150',
    logo: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=150',
    description: 'Supermarket Terdekat dengan Pilihan Lengkap',
    is_active: true,
    sort_order: 4
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Marketplace Partner (Shopee / Tokopedia)',
    slug: 'marketplace-partner',
    base_url: 'https://shopee.co.id/product/',
    icon_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150',
    logo: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150',
    description: 'Official Marketplace Partner',
    is_active: true,
    sort_order: 5
  }
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c1111111-1111-1111-1111-111111111111', name: 'Alfamart (Sembako)', slug: 'alfamart-sembako', icon: 'shopping-bag', sort_order: 1 },
  { id: 'c2222222-2222-2222-2222-222222222222', name: 'Promo Merchant', slug: 'promo-merchant', icon: 'percent', sort_order: 2 },
  { id: 'c3030303-3333-3333-3333-333333333333', name: 'DAN+DAN', slug: 'dan-dan', icon: 'sparkles', sort_order: 3 },
  { id: 'c4040404-4444-4444-4444-444444444444', name: 'Fashion', slug: 'fashion', icon: 'shirt', sort_order: 4 },
  { id: 'c5050505-5555-5555-5555-555555555555', name: 'Peralatan Masak', slug: 'peralatan-masak', icon: 'utensils-crossed', sort_order: 5 },
  { id: 'c4444444-4444-4444-4444-444444444444', name: 'Gadget & Elektronik', slug: 'gadget-elektronik', icon: 'tv', sort_order: 6 },
  { id: 'c7070707-7777-7777-7777-777777777777', name: 'Aksesori & Perhiasan', slug: 'aksesori-perhiasan', icon: 'watch', sort_order: 7 },
  { id: 'c8080808-8888-8888-8888-888888888888', name: 'Buku, Mainan & Edukasi', slug: 'buku-mainan-edukasi', icon: 'book-open', sort_order: 8 },
  { id: 'c9090909-9999-9999-9999-999999999999', name: 'Perlengkapan Ibadah', slug: 'perlengkapan-ibadah', icon: 'heart', sort_order: 9 },
  { id: 'c6666666-6666-6666-6666-666666666666', name: 'Health & Beauty', slug: 'health-beauty', icon: 'heart-pulse', sort_order: 10 },
  { id: 'ca111111-1111-1111-1111-111111111111', name: 'Ibu dan Anak', slug: 'ibu-dan-anak', icon: 'baby', sort_order: 11 },
  { id: 'c3333333-3333-3333-3333-333333333333', name: 'Makanan & Minuman', slug: 'makanan-minuman', icon: 'coffee', sort_order: 12 },
  { id: 'ca131313-1313-1313-1313-131313131313', name: 'Peralatan Makan & Minum', slug: 'peralatan-makan-minum', icon: 'coffee', sort_order: 13 },
  { id: 'c5555555-5555-5555-5555-555555555555', name: 'Peralatan Rumah Tangga', slug: 'peralatan-rumah-tangga', icon: 'home', sort_order: 14 },
  { id: 'ca151515-1515-1515-1515-151515151515', name: 'Hobby & Olahraga', slug: 'hobby-olahraga', icon: 'activity', sort_order: 15 },
  { id: 'ca161616-1616-1616-1616-161616161616', name: 'Tas & Dompet', slug: 'tas-dompet', icon: 'briefcase', sort_order: 16 },
  { id: 'ca171717-1717-1717-1717-171717171717', name: 'Produk KOTA', slug: 'produk-kota', icon: 'building', sort_order: 17 },
  { id: 'ca181818-1818-1818-1818-181818181818', name: 'DEPO Grosir', slug: 'depo-grosir', icon: 'package', sort_order: 18 },
  { id: 'ca191919-1919-1919-1919-191919191919', name: 'Produk Virtual (PPOB)', slug: 'produk-virtual-ppob', icon: 'smartphone', sort_order: 19 }
];

const DEFAULT_PRODUCTS: Product[] = [];

const DEFAULT_TEMPLATES: ShoppingTemplate[] = [
  {
    id: 'd1111111-1111-1111-1111-111111111111',
    name: 'Paket Anak Kos Hemat',
    slug: 'paket-anak-kos',
    description: 'Kebutuhan instan hemat & praktis untuk anak kos dan mahasiswa',
    category: 'Hemat',
    icon: 'sparkles',
    is_active: true,
    items: [
      { product_name: 'Indomie Goreng Spesial 85g', quantity: 10, default_price: 2900, unit: 'bungkus' },
      { product_name: 'Kapal Api Kopi Bubuk Special 165g', quantity: 1, default_price: 14200, unit: 'pack' }
    ]
  },
  {
    id: 'd2222222-2222-2222-2222-222222222222',
    name: 'Paket Sembako Dapur Keluarga',
    slug: 'paket-sembako-keluarga',
    description: 'Bumbu & bahan masak esensial lengkap untuk sajian lezat keluarga',
    category: 'Keluarga',
    icon: 'shopping-bag',
    is_active: true,
    items: [
      { product_name: 'Fortune Minyak Goreng Pouch 2L', quantity: 1, default_price: 34500, unit: 'pouch' },
      { product_name: 'Blue Band Serbaguna Sac 200g', quantity: 2, default_price: 8900, unit: 'sachet' },
      { product_name: 'Prochiz Gold Slice 12x13g', quantity: 1, default_price: 10700, unit: 'pack' },
      { product_name: 'Delmonte Ketchup Botol 270ml', quantity: 1, default_price: 10900, unit: 'botol' }
    ]
  },
  {
    id: 'd3333333-3333-3333-3333-333333333333',
    name: 'Paket Kebersihan Rumah Tangga',
    slug: 'paket-kebersihan-rumah',
    description: 'Perlengkapan cuci baju & kebersihan mandi bersih higienis',
    category: 'Rumah',
    icon: 'package',
    is_active: true,
    items: [
      { product_name: 'Rinso Anti Noda Deterjen 770g', quantity: 1, default_price: 21900, unit: 'pack' },
      { product_name: 'Lifebuoy Sabun Mandi Bar 110g', quantity: 3, default_price: 7500, unit: 'pcs' }
    ]
  }
];

export const dataService = {
  // CATEGORIES
  async fetchCategories(): Promise<Category[]> {
    let list: Category[] = [];
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
        if (!error && data && data.length > 0) {
          list = data;
        }
      } catch (err) {
        console.warn('Supabase fetchCategories failed', err);
      }
    }
    if (list.length === 0) {
      list = (await offlineDb.getCategories()) || [];
    }
    if (list.length === 0) {
      list = [...DEFAULT_CATEGORIES];
    }

    // Merge missing official 19 categories (e.g. Health & Beauty, DAN+DAN, etc.)
    DEFAULT_CATEGORIES.forEach(def => {
      if (!list.some(c => c.slug === def.slug || c.name.toLowerCase() === def.name.toLowerCase())) {
        list.push(def);
      }
    });

    // Prioritize categories containing active products so they appear FIRST on screen
    const allProducts = await this.fetchProducts();
    list.sort((a, b) => {
      const countA = allProducts.filter(p => {
        if (p.category_id === a.id) return true;
        if (p.category && (p.category.toLowerCase().includes(a.name.toLowerCase()) || a.name.toLowerCase().includes(p.category.toLowerCase()))) return true;
        const text = `${p.name} ${p.brand || ''} ${p.description || ''}`.toLowerCase();
        if (a.slug.includes('health') && (text.includes('lip') || text.includes('wardah') || text.includes('beauty'))) return true;
        return false;
      }).length;

      const countB = allProducts.filter(p => {
        if (p.category_id === b.id) return true;
        if (p.category && (p.category.toLowerCase().includes(b.name.toLowerCase()) || b.name.toLowerCase().includes(p.category.toLowerCase()))) return true;
        const text = `${p.name} ${p.brand || ''} ${p.description || ''}`.toLowerCase();
        if (b.slug.includes('health') && (text.includes('lip') || text.includes('wardah') || text.includes('beauty'))) return true;
        return false;
      }).length;

      if (countA > 0 && countB === 0) return -1;
      if (countA === 0 && countB > 0) return 1;
      return (a.sort_order || 99) - (b.sort_order || 99);
    });

    await offlineDb.setCategories(list);
    return list;
  },

  // FULFILLMENT CHANNELS
  async fetchFulfillmentChannels(): Promise<FulfillmentChannel[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('fulfillment_channels').select('*').eq('is_active', true).order('sort_order', { ascending: true });
        if (!error && data && data.length > 0) {
          await offlineDb.setChannels(data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase fetchFulfillmentChannels failed', err);
      }
    }
    await offlineDb.setChannels(DEFAULT_CHANNELS);
    return DEFAULT_CHANNELS;
  },

  async saveFulfillmentChannel(channel: Partial<FulfillmentChannel>): Promise<FulfillmentChannel> {
    if (isSupabaseConfigured) {
      try {
        if (channel.id && !channel.id.startsWith('ch_')) {
          const { data, error } = await supabase.from('fulfillment_channels').update(channel).eq('id', channel.id).select().single();
          if (!error && data) return data;
        } else {
          const { id, ...newCh } = channel;
          const { data, error } = await supabase.from('fulfillment_channels').insert([newCh]).select().single();
          if (!error && data) return data;
        }
      } catch (err) {
        console.warn('Supabase saveFulfillmentChannel error', err);
      }
    }
    const channels = (await this.fetchFulfillmentChannels()) || [];
    let updated: FulfillmentChannel;
    if (channel.id) {
      const idx = channels.findIndex(c => c.id === channel.id);
      if (idx !== -1) {
        channels[idx] = { ...channels[idx], ...channel } as FulfillmentChannel;
        updated = channels[idx];
      } else {
        updated = { ...channel, id: `ch_${Date.now()}` } as FulfillmentChannel;
        channels.push(updated);
      }
    } else {
      updated = { ...channel, id: `ch_${Date.now()}` } as FulfillmentChannel;
      channels.push(updated);
    }
    await offlineDb.setChannels(channels);
    return updated;
  },

  // PRODUCT SOURCES (TOKO SAYA SYNC ENGINE)
  async fetchProductSources(): Promise<ProductSource[]> {
    let rawSources: ProductSource[] = [];
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('product_sources').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          rawSources = data;
        }
      } catch (err) {
        console.warn('Supabase fetchProductSources failed', err);
      }
    }
    if (rawSources.length === 0) {
      rawSources = (await offlineDb.getSources()) || [];
    }

    // Populate UI metadata (product_name, product_price, product_image_url) from products catalog
    const allProducts = await this.fetchProducts();
    const populated = rawSources.map(src => {
      const prod = allProducts.find(p => p.id === src.product_id || p.external_product_code === src.external_product_code);
      return {
        ...src,
        product_name: prod?.name || src.product_name || 'Toko Saya Product',
        product_price: prod?.price || src.product_price || 0,
        product_image_url: prod?.image_url || src.product_image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150'
      };
    });

    await offlineDb.setSources(populated);
    return populated;
  },

  async saveProductSource(source: Partial<ProductSource>): Promise<ProductSource> {
    // Strip UI-only metadata before writing to Supabase table
    const { product_name, product_price, product_image_url, ...dbPayload } = source;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (isSupabaseConfigured) {
      try {
        // Query existing source by external_product_code to reuse valid UUID
        if (dbPayload.external_product_code) {
          const { data: existing } = await supabase
            .from('product_sources')
            .select('id')
            .eq('external_product_code', dbPayload.external_product_code)
            .maybeSingle();

          if (existing?.id) {
            dbPayload.id = existing.id;
          }
        }

        // Verify product_id exists in Supabase products table to prevent FK constraint 23503
        if (dbPayload.product_id && uuidRegex.test(dbPayload.product_id)) {
          const { data: prodCheck } = await supabase
            .from('products')
            .select('id')
            .eq('id', dbPayload.product_id)
            .maybeSingle();

          if (!prodCheck) {
            delete dbPayload.product_id;
          }
        } else {
          delete dbPayload.product_id;
        }

        const isValidUuid = dbPayload.id ? uuidRegex.test(dbPayload.id) : false;

        if (isValidUuid) {
          const { data, error } = await supabase.from('product_sources').upsert([dbPayload], { onConflict: 'id' }).select().single();
          if (!error && data) return data;
          if (error) console.error('Supabase saveProductSource upsert error:', error);
        }
        
        const { id, ...newSrc } = dbPayload;
        const { data, error } = await supabase.from('product_sources').insert([newSrc]).select().single();
        if (!error && data) return data;
        if (error) console.error('Supabase saveProductSource insert error:', error);
      } catch (err) {
        console.warn('Supabase saveProductSource exception:', err);
      }
    }

    const sources = (await this.fetchProductSources()) || [];
    let updated: ProductSource;
    if (source.id) {
      const idx = sources.findIndex(s => s.id === source.id);
      if (idx !== -1) {
        sources[idx] = { ...sources[idx], ...source } as ProductSource;
        updated = sources[idx];
      } else {
        updated = { ...source, id: `src_${Date.now()}` } as ProductSource;
        sources.unshift(updated);
      }
    } else {
      updated = { ...source, id: `src_${Date.now()}` } as ProductSource;
      sources.unshift(updated);
    }
    await offlineDb.setSources(sources);
    return updated;
  },

  async deleteProductSource(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('product_sources').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteProductSource error', err);
      }
    }
    const sources = (await this.fetchProductSources()) || [];
    const filtered = sources.filter(s => s.id !== id);
    await offlineDb.setSources(filtered);
  },

  // PRODUCTS
  async fetchProducts(): Promise<Product[]> {
    const sanitizeImageUrls = (prods: Product[]): Product[] => {
      return prods.map(p => {
        let updated = { ...p };
        if (p.images && Array.isArray(p.images) && p.images.length > 0) {
          const realImg = p.images.find(img => img && !img.includes('1542838132-92c53300491e') && !img.includes('1595428774223-ef52624120d2') && !img.includes('1544816155-12df9643f363'));
          if (realImg && (!p.image_url || p.image_url.includes('1542838132-92c53300491e') || p.image_url.includes('1595428774223-ef52624120d2') || p.image_url.includes('1544816155-12df9643f363'))) {
            updated.image_url = realImg;
          }
        }
        if (p.category_id) {
          const matchedCat = DEFAULT_CATEGORIES.find(c => c.id === p.category_id);
          if (matchedCat) {
            updated.category = matchedCat.name;
          }
        }
        return updated;
      });
    };

    let baseList: Product[] = [];
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('products').select('*').is('deleted_at', null).order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          baseList = data;
        }
      } catch (err) {
        console.warn('Supabase fetchProducts failed', err);
      }
    }
    if (baseList.length === 0) {
      baseList = (await offlineDb.getProducts()) || [];
    }

    // Filter out user-deleted product IDs, slugs, or names
    const getDeletedIds = (): string[] => {
      try {
        const raw = localStorage.getItem('psa_deleted_product_ids');
        return raw ? JSON.parse(raw) : [];
      } catch (e) { return []; }
    };
    const deletedIds = getDeletedIds();

    // Always merge default products unless user explicitly deleted them
    const mergedList = [...baseList];
    DEFAULT_PRODUCTS.forEach(def => {
      if (
        !deletedIds.includes(def.id) &&
        !deletedIds.includes(def.slug) &&
        !deletedIds.includes(def.name.toLowerCase()) &&
        !mergedList.some(p => p.id === def.id || p.name.toLowerCase() === def.name.toLowerCase())
      ) {
        mergedList.push(def);
      }
    });

    const finalFiltered = mergedList.filter(p => 
      !deletedIds.includes(p.id) && 
      (!p.slug || !deletedIds.includes(p.slug)) && 
      !deletedIds.includes(p.name.toLowerCase())
    );

    const sanitized = sanitizeImageUrls(finalFiltered);
    await offlineDb.setProducts(sanitized);
    return sanitized;
  },

  // SHOPPING TEMPLATES
  async fetchTemplates(): Promise<ShoppingTemplate[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('shopping_templates').select('*').eq('is_active', true);
        if (!error && data && data.length > 0) {
          await offlineDb.setTemplates(data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase fetchTemplates failed', err);
      }
    }
    const cached = await offlineDb.getTemplates();
    if (cached && cached.length > 0) return cached;
    await offlineDb.setTemplates(DEFAULT_TEMPLATES);
    return DEFAULT_TEMPLATES;
  },

  async saveTemplate(template: Partial<ShoppingTemplate>): Promise<ShoppingTemplate> {
    const payload: ShoppingTemplate = {
      id: template.id || `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: template.name || 'Paket Belanja Hemat Baru',
      slug: template.slug || (template.name ? template.name.toLowerCase().replace(/\s+/g, '-') : `paket-${Date.now()}`),
      description: template.description || '',
      category: template.category || 'Hemat',
      icon: template.icon || 'package',
      is_active: template.is_active ?? true,
      items: template.items || []
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('shopping_templates').upsert(payload);
      } catch (err) {
        console.warn('Supabase saveTemplate error', err);
      }
    }

    const cached = (await offlineDb.getTemplates()) || [];
    const idx = cached.findIndex(t => t.id === payload.id);
    if (idx >= 0) {
      cached[idx] = payload;
    } else {
      cached.unshift(payload);
    }
    await offlineDb.setTemplates(cached);
    return payload;
  },

  async deleteTemplate(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('shopping_templates').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteTemplate error', err);
      }
    }

    const cached = (await offlineDb.getTemplates()) || [];
    const filtered = cached.filter(t => t.id !== id);
    await offlineDb.setTemplates(filtered);
    return true;
  },

  // SAVE PRODUCT (ADMIN)
  async saveProduct(product: Partial<Product>): Promise<Product> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Clean payload for Supabase insertion/upsert
    const payload = { ...product };
    if (payload.images && Array.isArray(payload.images) && payload.images.length > 0) {
      const firstReal = payload.images.find(img => img && !img.includes('1542838132-92c53300491e') && !img.includes('1595428774223-ef52624120d2') && !img.includes('1544816155-12df9643f363'));
      if (firstReal) {
        payload.image_url = firstReal;
      } else if (payload.images[0]) {
        payload.image_url = payload.images[0];
      }
    }

    // Sync category name string whenever category_id is assigned
    if (payload.category_id) {
      const foundCat = DEFAULT_CATEGORIES.find(c => c.id === payload.category_id);
      if (foundCat) {
        payload.category = foundCat.name;
      }
    }

    if (isSupabaseConfigured) {
      try {
        // Query existing product by external_product_code to reuse valid UUID
        if (payload.external_product_code) {
          const { data: existing } = await supabase
            .from('products')
            .select('id')
            .eq('external_product_code', payload.external_product_code)
            .maybeSingle();

          if (existing?.id) {
            payload.id = existing.id;
          }
        }

        const isValidUuid = payload.id ? uuidRegex.test(payload.id) : false;
        
        // Strip non-column transient fields before sending to Supabase
        const dbPayload: any = { ...payload };
        delete dbPayload.category;
        delete dbPayload.channel;

        if (isValidUuid) {
          const { data, error } = await supabase.from('products').upsert([dbPayload], { onConflict: 'id' }).select().single();
          if (!error && data) {
            await this.fetchProducts();
            return { ...data, category: payload.category };
          }
          if (error) console.error('Supabase saveProduct upsert error:', error);
        }
        
        const { id, ...newProduct } = dbPayload;
        const { data, error } = await supabase.from('products').insert([newProduct]).select().single();
        if (!error && data) {
          await this.fetchProducts();
          return { ...data, category: payload.category };
        }
        if (error) console.error('Supabase saveProduct insert error:', error);
      } catch (err) {
        console.warn('Supabase saveProduct exception:', err);
      }
    }
    const products = (await this.fetchProducts()) || [];
    let updated: Product;
    const prodId = product.id || `f_${Date.now()}`;
    const idx = products.findIndex(p => p.id === prodId || (product.external_product_code && p.external_product_code === product.external_product_code));
    if (idx !== -1) {
      products[idx] = { ...products[idx], ...product, id: products[idx].id } as Product;
      updated = products[idx];
    } else {
      updated = { ...product, id: prodId } as Product;
      products.unshift(updated);
    }
    await offlineDb.setProducts(products);
    return updated;
  },

  async deleteProduct(id: string): Promise<void> {
    // Register deleted ID/Name/Slug in localStorage so DEFAULT_PRODUCTS won't re-merge it
    const getDeletedIds = (): string[] => {
      try {
        const raw = localStorage.getItem('psa_deleted_product_ids');
        return raw ? JSON.parse(raw) : [];
      } catch (e) { return []; }
    };

    const currentProds = (await offlineDb.getProducts()) || [];
    const targetProd = currentProds.find(p => p.id === id || p.slug === id || p.name.toLowerCase() === id.toLowerCase());

    const deletedIds = getDeletedIds();
    if (!deletedIds.includes(id)) deletedIds.push(id);
    if (targetProd?.id && !deletedIds.includes(targetProd.id)) deletedIds.push(targetProd.id);
    if (targetProd?.slug && !deletedIds.includes(targetProd.slug)) deletedIds.push(targetProd.slug);
    if (targetProd?.name && !deletedIds.includes(targetProd.name.toLowerCase())) deletedIds.push(targetProd.name.toLowerCase());
    localStorage.setItem('psa_deleted_product_ids', JSON.stringify(deletedIds));

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
          await supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', id);
        }
      } catch (err) {
        console.warn('Supabase deleteProduct error', err);
      }
    }
    const filtered = currentProds.filter(p => p.id !== id && p.slug !== id && p.name.toLowerCase() !== id.toLowerCase());
    await offlineDb.setProducts(filtered);
  },

  async toggleProductAvailability(product: Product): Promise<Product> {
    const updatedStatus = !product.is_available;
    const updated = await this.saveProduct({
      ...product,
      is_available: updatedStatus,
      stock_status: updatedStatus ? 'in_stock' : 'out_of_stock'
    });
    return updated;
  },

  // SAVE SHOPPING REQUEST (CHECKOUT)
  async saveShoppingRequest(request: Partial<ShoppingRequest>, items: Array<{ product_id?: string; product_name: string; brand: string; price: number; quantity: number; unit: string }>): Promise<ShoppingRequest> {
    const fullReq: ShoppingRequest = {
      id: `req_${Date.now()}`,
      customer_name: request.customer_name || 'Customer',
      customer_phone: request.customer_phone || '',
      delivery_address: request.delivery_address || '',
      delivery_notes: request.delivery_notes,
      preferred_delivery_time: request.preferred_delivery_time,
      subtotal: request.subtotal || 0,
      estimated_total: request.estimated_total || 0,
      fulfillment_channel_id: request.fulfillment_channel_id || '',
      status: 'sent_whatsapp',
      created_at: new Date().toISOString(),
      items: items
    };

    if (isSupabaseConfigured) {
      try {
        const { data: reqData, error: reqErr } = await supabase
          .from('shopping_requests')
          .insert([{
            customer_name: fullReq.customer_name,
            customer_phone: fullReq.customer_phone,
            delivery_address: fullReq.delivery_address,
            delivery_notes: fullReq.delivery_notes,
            preferred_delivery_time: fullReq.preferred_delivery_time,
            subtotal: fullReq.subtotal,
            estimated_total: fullReq.estimated_total,
            fulfillment_channel_id: fullReq.fulfillment_channel_id || null,
            status: fullReq.status
          }])
          .select()
          .single();

        if (!reqErr && reqData) {
          fullReq.id = reqData.id;
          const reqItems = items.map(it => ({
            request_id: reqData.id,
            product_id: it.product_id && (it.product_id.includes('-') && !it.product_id.startsWith('f_')) ? it.product_id : null,
            product_name: it.product_name,
            brand: it.brand,
            price: it.price,
            quantity: it.quantity,
            unit: it.unit
          }));
          await supabase.from('shopping_request_items').insert(reqItems);
        }
      } catch (err) {
        console.warn('Supabase saveShoppingRequest error', err);
      }
    }

    await offlineDb.addRequest(fullReq);
    return fullReq;
  },

  // STORE SETTINGS
  async fetchStoreProfile(): Promise<StoreProfile> {
    const DEFAULT_PROFILE: StoreProfile = {
      name: 'Toko Berkah Asisten Belanja',
      phone: '6281234567890',
      owner: 'Budi Santoso',
      address: 'Jl. Raya Sembako No. 88, Jakarta South',
      business_hours: '07:00 - 21:00 WIB',
      delivery_info: 'Pengiriman gratis radius 3 km dengan minimal pemesanan Rp 50.000'
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('settings').select('*').eq('key', 'store_profile').maybeSingle();
        if (!error && data && data.value) {
          return data.value as StoreProfile;
        }
      } catch (err) {
        console.warn('Supabase fetchStoreProfile error', err);
      }
    }

    const saved = localStorage.getItem('psa_store_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_PROFILE;
  },

  async saveStoreProfile(profile: StoreProfile): Promise<StoreProfile> {
    localStorage.setItem('psa_store_profile', JSON.stringify(profile));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('settings').upsert({
          key: 'store_profile',
          value: profile,
          description: 'Profil toko & nomor kontak WhatsApp',
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase saveStoreProfile error', err);
      }
    }

    return profile;
  },

  // PROMOTION CAMPAIGN ENGINE (AI VISION + FLYER IMPORT)
  async fetchPromotionCampaigns(): Promise<any[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('promotion_campaigns').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          await offlineDb.setCampaigns(data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase fetchPromotionCampaigns error', err);
      }
    }
    const cached = await offlineDb.getCampaigns();
    if (cached && cached.length > 0) return cached;
    const defaultCampaigns = [
      {
        id: 'camp_body_care_2026',
        title: 'Body Care Fair Special',
        slug: 'body-care-fair',
        subtitle: 'Hemat hingga 35% untuk produk perawatan tubuh & mandi pilihan',
        description: 'Beli produk body care kesayangan keluarga dengan harga promo paling hemat minggu ini.',
        banner_image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
        desktop_banner: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200',
        mobile_banner: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600',
        start_date: '2026-07-16',
        end_date: '2026-08-15',
        campaign_type: 'FAIR',
        priority: 10,
        status: 'ACTIVE',
        primary_color: '#e11d48',
        secondary_color: '#f43f5e',
        terms_conditions: 'Promo berlaku selama persediaan masih ada. Maksimal 3 pcs per pesanan.',
        created_at: new Date().toISOString()
      }
    ];
    await offlineDb.setCampaigns(defaultCampaigns);
    return defaultCampaigns;
  },

  async savePromotionCampaign(campaign: any): Promise<any> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('promotion_campaigns').upsert([campaign]).select().single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase savePromotionCampaign error', err);
      }
    }
    const list = (await this.fetchPromotionCampaigns()) || [];
    const idx = list.findIndex((c: any) => c.id === campaign.id || c.slug === campaign.slug);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...campaign };
    } else {
      list.unshift(campaign);
    }
    await offlineDb.setCampaigns(list);
    return campaign;
  },

  async deletePromotionCampaign(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('promotion_campaigns').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deletePromotionCampaign error', err);
      }
    }
    const list = (await this.fetchPromotionCampaigns()) || [];
    const filtered = list.filter((c: any) => c.id !== id);
    await offlineDb.setCampaigns(filtered);
  },

  async fetchPromotionProducts(campaignId?: string): Promise<any[]> {
    if (isSupabaseConfigured) {
      try {
        let q = supabase.from('promotion_products').select('*');
        if (campaignId) q = q.eq('campaign_id', campaignId);
        const { data, error } = await q;
        if (!error && data) {
          await offlineDb.setPromoProducts(data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase fetchPromotionProducts error', err);
      }
    }
    const list = (await offlineDb.getPromoProducts()) || [];
    if (campaignId) return list.filter((p: any) => p.campaign_id === campaignId);
    return list;
  },

  async savePromotionProductsBatch(promoProducts: any[]): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('promotion_products').upsert(promoProducts);
      } catch (err) {
        console.warn('Supabase savePromotionProductsBatch error', err);
      }
    }
    const current = (await offlineDb.getPromoProducts()) || [];
    const updated = [...promoProducts, ...current.filter((c: any) => !promoProducts.some(p => p.id === c.id))];
    await offlineDb.setPromoProducts(updated);
  },

  async fetchPromotionBanners(campaignId?: string): Promise<any[]> {
    if (isSupabaseConfigured) {
      try {
        let q = supabase.from('promotion_banners').select('*');
        if (campaignId) q = q.eq('campaign_id', campaignId);
        const { data, error } = await q;
        if (!error && data) {
          await offlineDb.setPromoBanners(data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase fetchPromotionBanners error', err);
      }
    }
    const list = (await offlineDb.getPromoBanners()) || [];
    if (campaignId) return list.filter((b: any) => b.campaign_id === campaignId);
    return list;
  },

  async savePromotionBannersBatch(banners: any[]): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('promotion_banners').upsert(banners);
      } catch (err) {
        console.warn('Supabase savePromotionBannersBatch error', err);
      }
    }
    const current = (await offlineDb.getPromoBanners()) || [];
    const updated = [...banners, ...current.filter((c: any) => !banners.some(b => b.id === c.id))];
    await offlineDb.setPromoBanners(updated);
  },

  async recordPriceHistory(record: any): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('price_history').insert([record]);
      } catch (err) {
        console.warn('Supabase recordPriceHistory error', err);
      }
    }
    const history = (await offlineDb.getPriceHistory()) || [];
    history.unshift(record);
    await offlineDb.setPriceHistory(history);
  },

  async fetchPriceHistory(productId?: string): Promise<any[]> {
    if (isSupabaseConfigured) {
      try {
        let q = supabase.from('price_history').select('*').order('timestamp', { ascending: false });
        if (productId) q = q.eq('product_id', productId);
        const { data, error } = await q;
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase fetchPriceHistory error', err);
      }
    }
    const history = (await offlineDb.getPriceHistory()) || [];
    if (productId) return history.filter((h: any) => h.product_id === productId);
    return history;
  },

  async restoreExpiredPromotions(): Promise<number> {
    const campaigns = await this.fetchPromotionCampaigns();
    const nowIso = new Date().toISOString().slice(0, 10);
    let restoredCount = 0;

    for (const c of campaigns) {
      if (c.end_date < nowIso && c.status !== 'EXPIRED') {
        c.status = 'EXPIRED';
        await this.savePromotionCampaign(c);

        // Fetch products affected by this expired campaign
        const promoProducts = await this.fetchPromotionProducts(c.id);
        const allProducts = await this.fetchProducts();

        for (const pp of promoProducts) {
          const matchedProd = allProducts.find(p => p.id === pp.product_id);
          if (matchedProd && matchedProd.is_promo) {
            // Non-destructive restoration to original base price
            await this.saveProduct({
              ...matchedProd,
              promo_price: undefined,
              is_promo: false
            });
            await this.recordPriceHistory({
              id: `ph_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              product_id: matchedProd.id,
              campaign_id: c.id,
              product_name: matchedProd.name,
              old_base_price: matchedProd.price,
              new_promo_price: matchedProd.price,
              discount_percentage: 0,
              change_type: 'CAMPAIGN_EXPIRED',
              timestamp: new Date().toISOString(),
              notes: `Automatic Price Restoration: Campaign ${c.title} expired on ${c.end_date}`
            });
            restoredCount++;
          }
        }
      }
    }
    return restoredCount;
  },

  // ENTERPRISE PROMOTION MANAGEMENT PLATFORM STORES
  async fetchCampaignPlacements(campaignId?: string): Promise<any[]> {
    if (isSupabaseConfigured) {
      try {
        let q = supabase.from('campaign_placements').select('*');
        if (campaignId) q = q.eq('campaign_id', campaignId);
        const { data, error } = await q;
        if (!error && data) {
          await offlineDb.setCampaignPlacements(data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase fetchCampaignPlacements error', err);
      }
    }
    const list = (await offlineDb.getCampaignPlacements()) || [];
    if (campaignId) return list.filter((p: any) => p.campaign_id === campaignId);
    return list;
  },

  async saveCampaignPlacementsBatch(placements: any[]): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('campaign_placements').upsert(placements);
      } catch (err) {
        console.warn('Supabase saveCampaignPlacementsBatch error', err);
      }
    }
    const current = (await offlineDb.getCampaignPlacements()) || [];
    const updated = [...placements, ...current.filter((c: any) => !placements.some(p => p.id === c.id))];
    await offlineDb.setCampaignPlacements(updated);
  },

  async fetchCampaignRules(campaignId?: string): Promise<any[]> {
    if (isSupabaseConfigured) {
      try {
        let q = supabase.from('campaign_rules').select('*');
        if (campaignId) q = q.eq('campaign_id', campaignId);
        const { data, error } = await q;
        if (!error && data) {
          await offlineDb.setCampaignRules(data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase fetchCampaignRules error', err);
      }
    }
    const list = (await offlineDb.getCampaignRules()) || [];
    if (campaignId) return list.filter((r: any) => r.campaign_id === campaignId);
    return list;
  },

  async saveCampaignRulesBatch(rules: any[]): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('campaign_rules').upsert(rules);
      } catch (err) {
        console.warn('Supabase saveCampaignRulesBatch error', err);
      }
    }
    const current = (await offlineDb.getCampaignRules()) || [];
    const updated = [...rules, ...current.filter((c: any) => !rules.some(r => r.id === c.id))];
    await offlineDb.setCampaignRules(updated);
  },

  async fetchCampaignAnalytics(campaignId?: string): Promise<any[]> {
    if (isSupabaseConfigured) {
      try {
        let q = supabase.from('campaign_analytics').select('*');
        if (campaignId) q = q.eq('campaign_id', campaignId);
        const { data, error } = await q;
        if (!error && data) {
          await offlineDb.setCampaignAnalytics(data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase fetchCampaignAnalytics error', err);
      }
    }
    const list = (await offlineDb.getCampaignAnalytics()) || [];
    if (campaignId) return list.filter((a: any) => a.campaign_id === campaignId);
    return list;
  },

  async saveCampaignAnalytics(analytics: any): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('campaign_analytics').upsert([analytics]);
      } catch (err) {
        console.warn('Supabase saveCampaignAnalytics error', err);
      }
    }
    const current = (await offlineDb.getCampaignAnalytics()) || [];
    const idx = current.findIndex((a: any) => a.campaign_id === analytics.campaign_id);
    if (idx !== -1) current[idx] = { ...current[idx], ...analytics };
    else current.unshift(analytics);
    await offlineDb.setCampaignAnalytics(current);
  },

  async fetchCampaignABTests(campaignId?: string): Promise<any[]> {
    if (isSupabaseConfigured) {
      try {
        let q = supabase.from('campaign_ab_tests').select('*');
        if (campaignId) q = q.eq('campaign_id', campaignId);
        const { data, error } = await q;
        if (!error && data) {
          await offlineDb.setCampaignABTests(data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase fetchCampaignABTests error', err);
      }
    }
    const list = (await offlineDb.getCampaignABTests()) || [];
    if (campaignId) return list.filter((t: any) => t.campaign_id === campaignId);
    return list;
  },

  async saveCampaignABTest(test: any): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('campaign_ab_tests').upsert([test]);
      } catch (err) {
        console.warn('Supabase saveCampaignABTest error', err);
      }
    }
    const current = (await offlineDb.getCampaignABTests()) || [];
    const idx = current.findIndex((t: any) => t.id === test.id);
    if (idx !== -1) current[idx] = { ...current[idx], ...test };
    else current.unshift(test);
    await offlineDb.setCampaignABTests(current);
  }
};
