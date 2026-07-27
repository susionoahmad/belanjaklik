<template>
  <div class="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
    <!-- Header Page -->
    <div class="bg-gradient-to-r from-red-600 to-rose-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
      <div class="relative z-10">
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white mb-3">
          <Sparkles class="w-4 h-4 text-yellow-300" />
          <span>Promo Afiliasi Marketplace Terbaik</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-black mb-2">Katalog Promo Shopee & Tokopedia</h1>
        <p class="text-xs sm:text-sm text-red-100 max-w-2xl">
          Temukan ribuan penawaran harga terhemat dari Shopee, Tokopedia & Lazada dengan diskon hingga 70% yang disaring secara otomatis.
        </p>
      </div>
      <ShoppingBag class="absolute -bottom-6 -right-6 w-36 h-36 text-white/10" />
    </div>

    <!-- Search & Filter Bar -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/80 space-y-4">
      <div class="flex flex-col sm:flex-row gap-3">
        <!-- Search Input -->
        <div class="relative flex-1">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari promo tisu, minyak telon, baju, skincare..."
            class="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-brand-red dark:text-white"
            @input="handleSearch"
          />
        </div>

        <!-- Sort Select -->
        <div class="flex items-center gap-2 sm:w-48">
          <SlidersHorizontal class="w-4 h-4 text-gray-400 shrink-0" />
          <select
            v-model="sortBy"
            @change="loadProducts(true)"
            class="w-full py-2.5 px-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-brand-red dark:text-white"
          >
            <option value="latest">Terbaru</option>
            <option value="sold">Terlaris (Item Sold)</option>
            <option value="discount">Diskon Terbesar</option>
            <option value="price_low">Harga Terendah</option>
            <option value="price_high">Harga Tertinggi</option>
          </select>
        </div>
      </div>

      <!-- Category Filter Pills -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          v-for="cat in categoryTabs"
          :key="cat.id"
          @click="selectCategory(cat.id)"
          :class="[
            'px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer',
            selectedCategory === cat.id
              ? 'bg-brand-red text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          ]"
        >
          <span>{{ cat.icon }}</span>
          <span>{{ cat.name }}</span>
        </button>
      </div>
    </div>

    <!-- Product Grid State -->
    <div v-if="isLoading" class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div
        v-for="n in 8"
        :key="n"
        class="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 animate-pulse h-64 flex flex-col justify-between"
      >
        <div class="bg-gray-200 dark:bg-gray-700 rounded-xl h-36 w-full"></div>
        <div class="space-y-2 mt-3">
          <div class="bg-gray-200 dark:bg-gray-700 h-3 rounded w-3/4"></div>
          <div class="bg-gray-200 dark:bg-gray-700 h-4 rounded w-1/2"></div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="products.length === 0" class="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm">
      <ShoppingBag class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
      <h3 class="font-extrabold text-gray-800 dark:text-white text-base">Tidak ada produk ditemukan</h3>
      <p class="text-xs text-gray-500 mt-1 max-w-md mx-auto">
        Coba ubah kata kunci pencarian atau pilih kategori lain untuk menemukan promo marketplace terbaik.
      </p>
      <button
        @click="resetFilters"
        class="mt-4 px-4 py-2 bg-brand-red text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors"
      >
        Reset Filter
      </button>
    </div>

    <!-- Product Grid -->
    <div v-else class="space-y-6">
      <div class="flex items-center justify-between text-xs text-gray-500 font-semibold px-1">
        <span>Menampilkan {{ products.length }} promo terbaik</span>
        <span>Halaman {{ currentPage }}</span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <AffiliateProductCard
          v-for="prod in products"
          :key="prod.id"
          :product="prod"
        />
      </div>

      <!-- Pagination / Load More -->
      <div class="flex items-center justify-center gap-3 pt-6">
        <button
          @click="prevPage"
          :disabled="currentPage === 1 || isLoading"
          class="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-1"
        >
          <ChevronLeft class="w-4 h-4" />
          <span>Sebelumnya</span>
        </button>

        <span class="text-xs font-extrabold text-gray-700 dark:text-gray-300 px-3 py-2 bg-gray-100 dark:bg-gray-700/60 rounded-xl">
          {{ currentPage }}
        </span>

        <button
          @click="nextPage"
          :disabled="hasNoMore || isLoading"
          class="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-1"
        >
          <span>Berikutnya</span>
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Sparkles, ShoppingBag, Search, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import AffiliateProductCard from '../features/affiliate/components/AffiliateProductCard.vue';
import type { AffiliateProduct } from '../features/affiliate/types';
import { supabase } from '../features/shared/db/supabaseClient';
import { updatePageSeo } from '../features/shared/utils/seo';

const products = ref<AffiliateProduct[]>([]);
const isLoading = ref(true);
const searchQuery = ref('');
const selectedCategory = ref('all');
const sortBy = ref('sold');
const currentPage = ref(1);
const PAGE_SIZE = 24;
const hasNoMore = ref(false);

let searchDebounceTimer: any = null;

const categoryTabs = [
  { id: 'all', name: 'Semua Kategori', icon: '🔥' },
  { id: 'gadget', name: 'Gadget & Elektronik', icon: '📱', kw: ['gadget', 'electronic', 'phone', 'headphone', 'headset', 'earphone', 'camera', 'appliance', 'charger', 'cable', 'audio', 'kipas', 'vacuum', 'blender', 'rice cooker', 'speaker', 'lampu', 'lighting', 'tv'] },
  { id: 'baby', name: 'Ibu & Bayi', icon: '👶', kw: ['baby', 'diaper', 'bayi', 'anak', 'feeding', 'diapering', 'potty', 'toy', 'girl clothes', 'boy', 'kid'] },
  { id: 'beauty', name: 'Kecantikan & Skincare', icon: '💄', kw: ['skincare', 'makeup', 'beauty', 'face', 'sunscreen', 'oral', 'tooth', 'body care', 'personal care', 'fragrance', 'perfume', 'lipstick', 'mouthwash', 'moisturizer', 'cream', 'cleanser', 'bath', 'shower'] },
  { id: 'kitchen', name: 'Dapur & Kuliner', icon: '🍳', kw: ['kitchen', 'cooking', 'masak', 'dapur', 'food', 'snack', 'beverage', 'drink', 'dairy', 'egg', 'cereal', 'sauce', 'crisp', 'spread', 'staple', 'ready-to-eat', 'lunch box', 'dinnerware', 'kitchenware'] },
  { id: 'home', name: 'Rumah Tangga', icon: '🏠', kw: ['home', 'clean', 'supplies', 'toilet', 'sabun', 'tissue', 'paper', 'notebook', 'office', 'school', 'tool', 'lighting', 'cleaner', 'hanger', 'curtain'] },
  { id: 'fashion', name: 'Fashion & Hijab', icon: '👗', kw: ['fashion', 'wear', 'clothes', 'muslim', 'baju', 'hijab', 'dress', 'shirt', 'pant', 'scarf', 'shawl', 'pashmina', 'wallet', 'bag', 'bracelet', 'jewelry', 'underwear', 'bra', 'short'] },
];

const loadProducts = async (resetPage = false) => {
  if (resetPage) {
    currentPage.value = 1;
  }
  isLoading.value = true;

  try {
    // Always fetch balanced 50/50 mix when viewing 'all' category without text search
    if (selectedCategory.value === 'all' && !searchQuery.value.trim()) {
      const halfLimit = Math.ceil(PAGE_SIZE / 2);
      const offset = (currentPage.value - 1) * halfLimit;

      const shoepeSort = sortBy.value === 'discount' ? 'discount_percent' : sortBy.value === 'price_low' || sortBy.value === 'price_high' ? 'price' : 'discount_percent';
      const tokoSort = sortBy.value === 'discount' ? 'discount_percent' : sortBy.value === 'price_low' || sortBy.value === 'price_high' ? 'price' : 'last_synced_at';
      const isAsc = sortBy.value === 'price_low';

      const [shopeeRes, tokoRes] = await Promise.all([
        supabase
          .from('affiliate_products')
          .select('*')
          .eq('is_active', true)
          .eq('merchant', 'shopee')
          .order(shoepeSort, { ascending: isAsc, nullsFirst: false })
          .range(offset, offset + halfLimit - 1),
        supabase
          .from('affiliate_products')
          .select('*')
          .eq('is_active', true)
          .eq('merchant', 'tokopedia')
          .order(tokoSort, { ascending: isAsc, nullsFirst: false })
          .range(offset, offset + halfLimit - 1)
      ]);

      const shopeeList = shopeeRes.data || [];
      const tokoList = tokoRes.data || [];
      const combined: AffiliateProduct[] = [];
      const maxLen = Math.max(shopeeList.length, tokoList.length);

      for (let i = 0; i < maxLen; i++) {
        if (i < shopeeList.length) combined.push(shopeeList[i]);
        if (i < tokoList.length) combined.push(tokoList[i]);
      }

      products.value = combined;
      hasNoMore.value = combined.length < PAGE_SIZE;
      isLoading.value = false;
      return;
    }

    let query = supabase
      .from('affiliate_products')
      .select('*')
      .eq('is_active', true);

    // Apply category keyword filter if selected
    if (selectedCategory.value !== 'all') {
      const tab = categoryTabs.find(t => t.id === selectedCategory.value);
      if (tab && tab.kw) {
        const orConditions = tab.kw.map(k => `category.ilike.%${k}%,name.ilike.%${k}%`).join(',');
        query = query.or(orConditions);
      }
    }

    // Apply text search if query typed
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim();
      query = query.or(`name.ilike.%${q}%,category.ilike.%${q}%,shop_name.ilike.%${q}%`);
    }

    // Apply sorting
    if (sortBy.value === 'sold') {
      query = query.order('discount_percent', { ascending: false, nullsFirst: false });
    } else if (sortBy.value === 'discount') {
      query = query.order('discount_percent', { ascending: false, nullsFirst: false });
    } else if (sortBy.value === 'price_low') {
      query = query.order('price', { ascending: true });
    } else if (sortBy.value === 'price_high') {
      query = query.order('price', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    const offset = (currentPage.value - 1) * PAGE_SIZE;
    query = query.range(offset, offset + PAGE_SIZE - 1);

    const { data, error } = await query;

    if (error) {
      console.error('[AffiliateView] Error fetching products:', error);
      products.value = [];
    } else {
      products.value = data || [];
      hasNoMore.value = (data || []).length < PAGE_SIZE;
    }
  } catch (err) {
    console.error('[AffiliateView] Exception:', err);
    products.value = [];
  } finally {
    isLoading.value = false;
  }
};

const handleSearch = () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    loadProducts(true);
  }, 350);
};

const selectCategory = (catId: string) => {
  selectedCategory.value = catId;
  loadProducts(true);
};

const resetFilters = () => {
  searchQuery.value = '';
  selectedCategory.value = 'all';
  sortBy.value = 'sold';
  loadProducts(true);
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const nextPage = () => {
  if (!hasNoMore.value) {
    currentPage.value++;
    loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

onMounted(() => {
  updatePageSeo('Katalog Promo Marketplace', 'Cari promo produk Shopee, Tokopedia, dan Lazada pilihan terbaik.');
  loadProducts();
});
</script>
