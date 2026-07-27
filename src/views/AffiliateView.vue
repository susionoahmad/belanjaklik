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
  { id: 'all', name: 'Semua Kategori', icon: '🔥', kw: [] },
  {
    id: 'gadget', name: 'Gadget & Elektronik', icon: '📱',
    kw: [
      // Shopee
      'camera', 'earphone', 'headphone', 'headset', 'speaker', 'audio', 'lighting', 'amplifier',
      'electrical', 'data storage', 'remote control', 'large household', 'small household',
      // Tokopedia
      'bulbs', 'tubes', 'strips', 'powerline', 'vacuum sealer', 'hair styling tools',
      'facial beauty device', 'dry cell', 'steamer',
    ]
  },
  {
    id: 'baby', name: 'Ibu & Bayi', icon: '👶',
    kw: [
      // Shopee
      'baby', 'diapering', 'potty', 'feeding', 'milk formula', 'nursery', 'pacifier',
      'boy clothes', 'boy shoes', 'girl clothes', 'kid muslim', 'toys', 'slime', 'squishy',
      // Tokopedia
      'growth milk', 'baby vitamins', 'grooming wipes', 'action & toy', 'maternity',
    ]
  },
  {
    id: 'beauty', name: 'Kecantikan & Skincare', icon: '💄',
    kw: [
      // Shopee
      'skincare', 'makeup', 'beauty', 'face sunscreen', 'oral care', 'hair care', 'hair accessories',
      'bath & body', 'personal care', 'perfume', 'fragrance', 'medical gloves', 'eyewear',
      // Tokopedia
      'bb & cc', 'concealer', 'foundation', 'eyeliner', 'lipliner', 'lipstick', 'lip gloss',
      'lip treatment', 'eyebrow', 'face masks', 'face scrubs', 'facial cleanser', 'facial sunscreen',
      'serums', 'toner', 'moisturizer', 'body moisturizer', 'deodorant', 'intimate wash',
      'mouthwash', 'oral spray', 'toothpaste', 'shampoo', 'hair oil', 'hair removal',
      'beauty supplement', 'men\'s fragrance', 'women\'s fragrance', 'unisex fragrance', 'fragrance set',
    ]
  },
  {
    id: 'kitchen', name: 'Dapur & Kuliner', icon: '🍳',
    kw: [
      // Shopee
      'cooking essential', 'kitchenware', 'dinnerware', 'food staple', 'snack', 'beverage',
      'dairy & eggs', 'breakfast cereal', 'convenience', 'ready-to-eat', 'fresh & frozen',
      // Tokopedia
      'chocolate', 'crisps', 'puffed snacks', 'cooking sauce', 'instant noodles', 'instant hotpot',
      'herbs, spice', 'seasoning', 'dressing', 'spread', 'coffee', 'tea', 'vinegar', 'eggs',
      'non-dairy milk', 'frozen food', 'baking tin', 'measuring utensil', 'lunch box',
      'drinkware', 'disposable tableware', 'preserving container',
    ]
  },
  {
    id: 'home', name: 'Rumah Tangga', icon: '🏠',
    kw: [
      // Shopee
      'home care', 'home organizer', 'school & office', 'writing & correction', 'notebook',
      'letters & envelope', 'tools & home', 'bedding', 'furniture', 'decoration', 'gardening',
      'party supplie', 'souvenirs', 'gift',
      // Tokopedia
      'tissues & napkins', 'sponges', 'scouring', 'broom', 'hanger', 'hooks & rails',
      'storage boxes', 'bins', 'curtain', 'blind', 'door hardware', 'roofing', 'flooring',
      'tape', 'adhesive', 'cards & card stock', 'labels', 'textbook', 'writing & correction tools',
      'table', 'desk', 'stool', 'bench', 'tapestry', 'sheets', 'pillowcase', 'water treatment',
    ]
  },
  {
    id: 'fashion', name: 'Fashion & Hijab', icon: '👗',
    kw: [
      // Shopee
      'women muslim wear', 'scarves & shawl', 'lingerie', 'underwear', 'pants & legging',
      'jeans', 'shorts', 'tops', 'tote bag', 'crossbody', 'shoulder bag', 'wallet',
      'bracelet', 'necklace', 'earring', 'women watches', 'eyewear', 'flat sandal',
      // Tokopedia
      'instant hijab', 'square hijab', 'pashmina', 'casual dress', 'formal dress',
      'shirts & blouses', 'polo shirt', 't-shirts', 'women\'s t-shirt', 'jacket', 'coat',
      'bras', 'shorts', 'socks', 'clothing set', 'sleepwear', 'pants',
      'women\'s handbag', 'women\'s wallet', 'women\'s clutch', 'make-up bag', 'keychains',
      'travel organizer', 'frames & glasses',
    ]
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
    const halfLimit = Math.ceil(PAGE_SIZE / 2);
    const offset = (currentPage.value - 1) * halfLimit;

    const tab = categoryTabs.find(t => t.id === selectedCategory.value);
    const kw = tab?.kw ?? [];

    // Determine sort column
    const sortCol = sortBy.value === 'discount' ? 'discount_percent'
      : sortBy.value === 'price_low' || sortBy.value === 'price_high' ? 'price'
      : 'discount_percent';
    const isAsc = sortBy.value === 'price_low';

    // Always do 50/50 balanced query: separate Shopee + Tokopedia
    const buildQuery = (merchant: string) => {
      let q = supabase
        .from('affiliate_products')
        .select('*')
        .eq('is_active', true)
        .eq('merchant', merchant);

      // Category keyword filter (skip if 'all')
      if (selectedCategory.value !== 'all' && kw.length > 0) {
        q = q.or(buildOrFilter(kw));
      }

      // Text search
      if (searchQuery.value.trim()) {
        const s = searchQuery.value.trim();
        q = q.or(`name.ilike.%${s}%,category.ilike.%${s}%,shop_name.ilike.%${s}%`);
      }

      // Sort: Tokopedia use last_synced_at as default (no item_sold col)
      const col = merchant === 'tokopedia' && sortCol === 'discount_percent' ? 'last_synced_at' : sortCol;
      q = q.order(col, { ascending: isAsc, nullsFirst: false });

      return q.range(offset, offset + halfLimit - 1);
    };

    const [shopeeRes, tokoRes] = await Promise.all([
      buildQuery('shopee'),
      buildQuery('tokopedia'),
    ]);

    const shopeeList = shopeeRes.data || [];
    const tokoList = tokoRes.data || [];

    if (shopeeRes.error) console.error('[AffiliateView] Shopee error:', shopeeRes.error);
    if (tokoRes.error) console.error('[AffiliateView] Toko error:', tokoRes.error);

    // Interleave: Shopee[0], Toko[0], Shopee[1], Toko[1], ...
    const combined: AffiliateProduct[] = [];
    const maxLen = Math.max(shopeeList.length, tokoList.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < shopeeList.length) combined.push(shopeeList[i]);
      if (i < tokoList.length) combined.push(tokoList[i]);
    }

    products.value = combined;
    hasNoMore.value = combined.length < PAGE_SIZE;
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
