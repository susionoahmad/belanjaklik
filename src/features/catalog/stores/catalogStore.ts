import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useStorage } from '@vueuse/core';
import type { Product, Category, FulfillmentChannel } from '../../shared/types';
import { dataService } from '../../shared/db/dataService';

export const useCatalogStore = defineStore('catalog', () => {
  const products = ref<Product[]>([]);
  const categories = ref<Category[]>([]);
  const channels = ref<FulfillmentChannel[]>([]);
  const isLoading = ref(false);

  const searchQuery = ref('');
  const selectedCategorySlug = ref<string | null>(null);
  const selectedBrand = ref<string | null>(null);
  const sortBy = ref<'popular' | 'price_low' | 'price_high' | 'promo'>('popular');

  const recentlyViewedIds = useStorage<string[]>('psa_recently_viewed', []);

  const fetchCatalogData = async () => {
    isLoading.value = true;
    try {
      categories.value = await dataService.fetchCategories();
      channels.value = await dataService.fetchFulfillmentChannels();
      products.value = await dataService.fetchProducts();
    } catch (e) {
      console.error('Failed to load catalog', e);
    } finally {
      isLoading.value = false;
    }
  };

  const trackRecentlyViewed = (productId: string) => {
    const list = recentlyViewedIds.value.filter(id => id !== productId);
    list.unshift(productId);
    recentlyViewedIds.value = list.slice(0, 10);
  };

  const recentlyViewedProducts = computed(() => {
    return recentlyViewedIds.value
      .map(id => products.value.find(p => p.id === id))
      .filter((p): p is Product => Boolean(p));
  });

  const availableBrands = computed(() => {
    const brandsSet = new Set<string>();
    products.value.forEach(p => {
      if (p.brand) brandsSet.add(p.brand);
    });
    return Array.from(brandsSet);
  });

  const filteredProducts = computed(() => {
    let result = [...products.value];

    if (selectedCategorySlug.value) {
      const cat = categories.value.find(c => c.slug === selectedCategorySlug.value);
      if (cat) {
        result = result.filter(p => {
          if (p.category_id === cat.id) return true;
          if (p.category && (p.category.toLowerCase().includes(cat.name.toLowerCase()) || cat.name.toLowerCase().includes(p.category.toLowerCase()))) return true;
          const text = `${p.name} ${p.brand || ''} ${p.description || ''} ${p.search_keywords || ''}`.toLowerCase();
          if (cat.slug.includes('health') && (text.includes('lip') || text.includes('wardah') || text.includes('tint') || text.includes('beauty'))) return true;
          return false;
        });
      }
    }

    if (selectedBrand.value) {
      result = result.filter(p => p.brand === selectedBrand.value);
    }

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q)) ||
        (p.search_keywords && p.search_keywords.toLowerCase().includes(q))
      );
    }

    if (sortBy.value === 'price_low') {
      result.sort((a, b) => (a.promo_price || a.price) - (b.promo_price || b.price));
    } else if (sortBy.value === 'price_high') {
      result.sort((a, b) => (b.promo_price || b.price) - (a.promo_price || a.price));
    } else if (sortBy.value === 'promo') {
      result.sort((a, b) => (b.is_promo ? 1 : 0) - (a.is_promo ? 1 : 0));
    }

    return result;
  });

  const categoriesWithProducts = computed(() => {
    const activeList = categories.value.filter(cat => {
      const count = products.value.filter(p => {
        // 1. Direct Category ID Match
        if (p.category_id && p.category_id === cat.id) return true;
        
        // 2. Category Name Match (case-insensitive)
        if (p.category && (
          p.category.toLowerCase().includes(cat.name.toLowerCase()) || 
          cat.name.toLowerCase().includes(p.category.toLowerCase())
        )) return true;

        // 3. Product Keywords & Contextual Heuristic Match
        const text = `${p.name} ${p.brand || ''} ${p.description || ''} ${p.search_keywords || ''}`.toLowerCase();
        if (cat.name.toLowerCase().includes('health') || cat.slug.includes('health')) {
          if (text.includes('lip') || text.includes('tint') || text.includes('wardah') || text.includes('beauty') || text.includes('health') || text.includes('skin')) return true;
        }
        if (cat.name.toLowerCase().includes('sembako') || cat.slug.includes('sembako')) {
          if (text.includes('minyak') || text.includes('beras') || text.includes('gula') || text.includes('sembako')) return true;
        }
        if (cat.slug && text.includes(cat.slug.replace(/-/g, ' '))) return true;

        return false;
      }).length;

      return count > 0;
    });

    return activeList.length > 0 ? activeList : categories.value;
  });

  const featuredProducts = computed(() => {
    const list = products.value.filter(p => p.is_featured);
    return list.length > 0 ? list : products.value;
  });
  const promoProducts = computed(() => {
    const list = products.value.filter(p => p.is_promo);
    return list.length > 0 ? list : products.value.filter(p => p.promo_price);
  });
  const popularProducts = computed(() => {
    const list = products.value.filter(p => p.is_popular);
    return list.length > 0 ? list : products.value;
  });

  return {
    products,
    categories,
    channels,
    isLoading,
    searchQuery,
    selectedCategorySlug,
    selectedBrand,
    sortBy,
    recentlyViewedProducts,
    availableBrands,
    filteredProducts,
    categoriesWithProducts,
    featuredProducts,
    promoProducts,
    popularProducts,
    fetchCatalogData,
    trackRecentlyViewed
  };
});
