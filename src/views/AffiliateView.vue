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
            <option v-if="selectedMerchant !== 'tokopedia'" value="sold">Terlaris (Item Sold)</option>
            <option v-if="selectedMerchant !== 'tokopedia'" value="discount">Diskon Terbesar</option>
            <option value="price_low">Harga Terendah</option>
            <option value="price_high">Harga Tertinggi</option>
          </select>
        </div>
      </div>

      <!-- Marketplace Filter -->
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0">Marketplace:</span>
        <div class="flex gap-1.5">
          <button
            v-for="mp in merchantTabs"
            :key="mp.id"
            @click="selectMerchant(mp.id)"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border',
              selectedMerchant === mp.id
                ? 'bg-brand-red text-white border-brand-red shadow-sm'
                : 'bg-white dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-brand-red hover:text-brand-red dark:hover:border-red-400'
            ]"
          >
            <span>{{ mp.icon }}</span>
            <span>{{ mp.name }}</span>
          </button>
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

    <!-- Tokopedia data info note -->
    <div
      v-if="selectedMerchant === 'tokopedia'"
      class="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl px-4 py-3 text-xs text-amber-800 dark:text-amber-300"
    >
      <span class="text-base shrink-0">ℹ️</span>
      <span>
        <strong>Produk Tokopedia</strong> dari feed Accesstrade tidak menyertakan data item terjual & harga asli.
        Filter diskon tidak tersedia. Gunakan <strong>Harga Terendah / Tertinggi</strong> atau <strong>Terbaru</strong> untuk mengurutkan.
      </span>
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
const selectedMerchant = ref('all');
const sortBy = ref('sold');
const currentPage = ref(1);
const PAGE_SIZE = 24;
const hasNoMore = ref(false);

const merchantTabs = [
  { id: 'all',       name: 'Semua',     icon: '🛒' },
  { id: 'shopee',    name: 'Shopee',    icon: '🟠' },
  { id: 'tokopedia', name: 'Tokopedia', icon: '🟢' },
];

let searchDebounceTimer: any = null;

const categoryTabs = [
  { id: 'all', name: 'Semua Kategori', icon: '🔥', kw: [] },
  {
    id: 'gadget', name: 'Gadget & Elektronik', icon: '📱',
    kw: ['camera', 'earphone', 'headphone', 'speaker', 'lighting', 'electrical', 'household appliance', 'bulbs', 'steamer', 'powerline'],
  },
  {
    id: 'baby', name: 'Ibu & Bayi', icon: '👶',
    kw: ['baby', 'diapering', 'feeding', 'milk formula', 'nursery', 'toys', 'maternity', 'pacifier', 'potty'],
  },
  {
    id: 'beauty', name: 'Kecantikan & Skincare', icon: '💄',
    kw: ['skincare', 'makeup', 'beauty', 'fragrance', 'oral care', 'hair care', 'personal care', 'lipstick', 'serum', 'toner'],
  },
  {
    id: 'kitchen', name: 'Dapur & Kuliner', icon: '🍳',
    kw: ['snack', 'food', 'cooking', 'beverage', 'dairy', 'chocolate', 'coffee', 'instant', 'cereal', 'sauce'],
  },
  {
    id: 'home', name: 'Rumah Tangga', icon: '🏠',
    kw: ['home care', 'notebook', 'tissue', 'office', 'furniture', 'decoration', 'storage', 'curtain', 'bedding', 'tool'],
  },
  {
    id: 'fashion', name: 'Fashion & Hijab', icon: '👗',
    kw: ['hijab', 'muslim wear', 'dress', 'shirt', 'pants', 'underwear', 'bag', 'wallet', 'scarves', 'pashmina'],
  },
];

// Helper: build OR filter string from keywords
const buildOrFilter = (kw: string[]) =>
  kw.map(k => `category.ilike.%${k}%,name.ilike.%${k}%`).join(',');

const loadProducts = async (resetPage = false) => {
  if (resetPage) {
    currentPage.value = 1;
  }
  isLoading.value = true;

  try {
    const tab = categoryTabs.find(t => t.id === selectedCategory.value);
    const kw = tab?.kw ?? [];

    // Determine sort column
    const sortCol = sortBy.value === 'discount' ? 'discount_percent'
      : sortBy.value === 'price_low' || sortBy.value === 'price_high' ? 'price'
      : 'discount_percent';
    const isAsc = sortBy.value === 'price_low';

    const buildQuery = (merchant: string, limit: number, offset: number) => {
      let q = supabase
        .from('affiliate_products')
        .select('*')
        .eq('is_active', true)
        .eq('merchant', merchant);

      // Text search takes priority — skip category keywords when searching
      // so results like "samsung" show up regardless of which category tab is active
      if (searchQuery.value.trim()) {
        const s = searchQuery.value.trim();
        q = q.or(`name.ilike.%${s}%,category.ilike.%${s}%,shop_name.ilike.%${s}%`);
      } else if (selectedCategory.value !== 'all' && kw.length > 0) {
        // Category keyword filter only when NOT searching
        q = q.or(buildOrFilter(kw));
      }

      // Sort: Tokopedia use last_synced_at as default
      const col = merchant === 'tokopedia' && sortCol === 'discount_percent' ? 'last_synced_at' : sortCol;
      q = q.order(col, { ascending: isAsc, nullsFirst: false });

      return q.range(offset, offset + limit - 1);
    };

    if (selectedMerchant.value !== 'all') {
      // Single merchant: use full PAGE_SIZE
      const offset = (currentPage.value - 1) * PAGE_SIZE;
      const { data, error } = await buildQuery(selectedMerchant.value, PAGE_SIZE, offset);
      if (error) console.error('[AffiliateView] error:', error);
      products.value = data || [];
      hasNoMore.value = (data || []).length < PAGE_SIZE;
    } else if (sortBy.value === 'discount' || sortBy.value === 'sold') {
      // Shopee-only for discount/sold sort — Tokopedia has no discount_percent or item_sold data
      const offset = (currentPage.value - 1) * PAGE_SIZE;
      const { data, error } = await buildQuery('shopee', PAGE_SIZE, offset);
      if (error) console.error('[AffiliateView] Shopee error:', error);
      products.value = data || [];
      hasNoMore.value = (data || []).length < PAGE_SIZE;
    } else {
      // Both merchants: 50/50 interleave (for latest, price_low, price_high)
      const halfLimit = Math.ceil(PAGE_SIZE / 2);
      const offset = (currentPage.value - 1) * halfLimit;

      const [shopeeRes, tokoRes] = await Promise.all([
        buildQuery('shopee', halfLimit, offset),
        buildQuery('tokopedia', halfLimit, offset),
      ]);

      if (shopeeRes.error) console.error('[AffiliateView] Shopee error:', shopeeRes.error);
      if (tokoRes.error) console.error('[AffiliateView] Toko error:', tokoRes.error);

      const shopeeList = shopeeRes.data || [];
      const tokoList = tokoRes.data || [];

      // Interleave: Shopee[0], Toko[0], Shopee[1], Toko[1], ...
      const combined: AffiliateProduct[] = [];
      const maxLen = Math.max(shopeeList.length, tokoList.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < shopeeList.length) combined.push(shopeeList[i]);
        if (i < tokoList.length) combined.push(tokoList[i]);
      }

      products.value = combined;
      hasNoMore.value = combined.length < PAGE_SIZE;
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

const selectMerchant = (merchantId: string) => {
  selectedMerchant.value = merchantId;
  // Reset sort options not available for Tokopedia-only view
  if (merchantId === 'tokopedia' && (sortBy.value === 'sold' || sortBy.value === 'discount')) {
    sortBy.value = 'latest';
  }
  loadProducts(true);
};

const resetFilters = () => {
  searchQuery.value = '';
  selectedCategory.value = 'all';
  selectedMerchant.value = 'all';
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
