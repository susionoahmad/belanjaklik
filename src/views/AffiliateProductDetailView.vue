<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-20">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
      <router-link to="/" class="hover:text-brand-red flex items-center gap-1 transition-colors">
        <Home class="w-3.5 h-3.5" />
        <span>Beranda</span>
      </router-link>
      <ChevronRight class="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
      <span class="truncate max-w-[120px] sm:max-w-xs">{{ product?.category || 'Rekomendasi Belanja' }}</span>
      <ChevronRight v-if="product" class="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
      <span v-if="product" class="font-semibold text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-xs">
        {{ product.name }}
      </span>
    </nav>

    <!-- Loading State -->
    <div v-if="isLoading" class="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-soft animate-pulse flex flex-col md:flex-row gap-6">
      <div class="w-full md:w-1/2 aspect-square bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
      <div class="w-full md:w-1/2 space-y-4">
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div class="h-20 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl w-full"></div>
      </div>
    </div>

    <!-- 404 / Not Found State -->
    <div v-else-if="!product" class="bg-white dark:bg-gray-800 rounded-3xl p-8 sm:p-12 border border-gray-100 dark:border-gray-700 shadow-soft text-center space-y-4">
      <div class="w-16 h-16 bg-red-50 dark:bg-red-950/50 text-brand-red rounded-full flex items-center justify-center mx-auto">
        <PackageX class="w-8 h-8" />
      </div>
      <h1 class="text-xl font-black text-gray-900 dark:text-white">Produk Tidak Ditemukan</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
        Produk affiliate yang Anda cari tidak tersedia atau sudah tidak aktif. Silakan jelajahi penawaran belanja hemat lainnya.
      </p>
      <router-link
        to="/"
        class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-red text-white font-bold text-sm shadow-soft hover:bg-brand-red-dark transition-all"
      >
        <Home class="w-4 h-4" />
        <span>Kembali ke Beranda</span>
      </router-link>
    </div>

    <!-- Product Detail Content -->
    <div v-else class="space-y-8">
      <div class="bg-white dark:bg-gray-800 rounded-3xl p-4 sm:p-6 border border-gray-100 dark:border-gray-700 shadow-soft grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
        <!-- Product Image Section -->
        <div class="space-y-3">
          <div class="relative aspect-square w-full rounded-2xl bg-gray-50 dark:bg-gray-700/60 p-4 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-700">
            <!-- Merchant Badge -->
            <div class="absolute top-3 left-3 z-10 flex items-center gap-2">
              <span
                class="text-xs font-black px-3 py-1 rounded-full shadow-sm uppercase tracking-wider flex items-center gap-1.5 border"
                :class="merchantStyle.badgeClass"
              >
                <component :is="merchantStyle.icon" class="w-3.5 h-3.5" />
                <span>{{ merchantStyle.label }}</span>
              </span>

              <span
                v-if="discountPercent > 0"
                class="bg-gradient-to-r from-red-600 to-rose-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider"
              >
                HEMAT {{ discountPercent }}%
              </span>
            </div>

            <img
              :src="displayImageUrl"
              :alt="product.name"
              class="max-w-full max-h-full object-contain rounded-xl drop-shadow-md transition-transform duration-300 hover:scale-105"
              @error="handleImageError"
            />
          </div>
        </div>

        <!-- Product Information Section -->
        <div class="space-y-5 flex flex-col justify-between h-full">
          <div class="space-y-3">
            <!-- Shop Name & Category -->
            <div class="flex items-center gap-2 flex-wrap">
              <span v-if="product.shop_name" class="inline-flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/80 px-2.5 py-1 rounded-xl">
                <Store class="w-3.5 h-3.5 text-gray-400" />
                <span>{{ product.shop_name }}</span>
              </span>
              <span v-if="product.category" class="inline-flex items-center gap-1 text-xs font-medium text-brand-red bg-brand-red/10 px-2.5 py-1 rounded-xl">
                <Tag class="w-3 h-3" />
                <span>{{ product.category }}</span>
              </span>
            </div>

            <!-- Product Title -->
            <h1 class="text-lg sm:text-xl font-black text-gray-900 dark:text-white leading-snug">
              {{ product.name }}
            </h1>

            <!-- Pricing Box -->
            <div class="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60 space-y-1">
              <div class="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
                Harga Promo Affiliate
              </div>
              <div class="flex items-baseline gap-3 flex-wrap">
                <span class="text-2xl sm:text-3xl font-black text-brand-red">
                  {{ formatPrice(product.price) }}
                </span>
                <span v-if="hasDiscount && product.original_price" class="text-sm sm:text-base text-gray-400 line-through">
                  {{ formatPrice(product.original_price) }}
                </span>
              </div>
            </div>

            <!-- Description -->
            <div v-if="product.description" class="space-y-2">
              <h2 class="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider">
                Deskripsi Produk
              </h2>
              <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {{ product.description }}
              </p>
            </div>
          </div>

          <!-- Primary CTA Button -->
          <div class="pt-4 border-t border-gray-100 dark:border-gray-700/60 space-y-2">
            <button
              @click="handleAffiliateClick"
              class="w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base text-white shadow-lg hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer"
              :class="merchantStyle.buttonClass"
            >
              <component :is="merchantStyle.icon" class="w-5 h-5" />
              <span>{{ actionLabel }} {{ merchantStyle.label }}</span>
              <ExternalLink class="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
            <p class="text-[11px] text-center text-gray-400 dark:text-gray-500">
              * Anda akan diarahkan langsung ke aplikasi/situs resmi {{ merchantStyle.label }}
            </p>
          </div>
        </div>
      </div>

      <!-- Related Products Section -->
      <section v-if="relatedProducts.length > 0" class="space-y-4">
        <h2 class="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles class="w-5 h-5 text-brand-red" />
          <span>Rekomendasi Produk Serupa</span>
        </h2>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <AffiliateProductCard
            v-for="relProd in relatedProducts"
            :key="relProd.id"
            :product="relProd"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onServerPrefetch, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useHead } from '@unhead/vue';
import {
  Home,
  ChevronRight,
  ShoppingBag,
  ExternalLink,
  Store,
  Tag,
  PackageX,
  Sparkles
} from 'lucide-vue-next';
import type { AffiliateProduct } from '@/features/affiliate/types';
import {
  getAffiliateProductBySlug,
  getRelatedAffiliateProducts,
  trackAffiliateClick
} from '@/features/affiliate/services/affiliateService';
import AffiliateProductCard from '@/features/affiliate/components/AffiliateProductCard.vue';
import { formatRupiah } from '@/features/shared/utils/formatters';
import { proxyImageUrl } from '@/features/tokosaya-sync/services/ImageProxyService';
import { resolveProductAffiliateUrl } from '@/features/affiliate/services/dynamicAffiliateLinkService';

const route = useRoute();
const product = ref<AffiliateProduct | null>(null);
const relatedProducts = ref<AffiliateProduct[]>([]);
const isLoading = ref(true);

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600';

const displayImageUrl = computed(() => {
  if (!product.value?.image_url) return FALLBACK_IMAGE;
  return proxyImageUrl(product.value.image_url);
});

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  if (target && target.src !== FALLBACK_IMAGE) {
    target.src = FALLBACK_IMAGE;
  }
};

const formatPrice = (val?: number | null) => {
  if (!val || val <= 0) return 'Cek Harga Promo';
  return formatRupiah(val);
};

const hasDiscount = computed(() => {
  if (!product.value?.original_price || !product.value?.price) return false;
  return Number(product.value.original_price) > Number(product.value.price);
});

const discountPercent = computed(() => {
  if (!product.value) return 0;
  if (product.value.discount_percent && product.value.discount_percent > 0) {
    return Math.round(product.value.discount_percent);
  }
  if (hasDiscount.value && product.value.original_price && product.value.price) {
    const original = Number(product.value.original_price);
    const current = Number(product.value.price);
    return Math.round(((original - current) / original) * 100);
  }
  return 0;
});

const actionLabel = computed(() => {
  const vertical = product.value?.vertical;
  if (vertical === 'travel') return 'Pesan di';
  if (vertical === 'digital') return 'Lihat di';
  return 'Beli di';
});

const merchantStyle = computed(() => {
  const m = (product.value?.merchant || '').toLowerCase();
  if (m.includes('shopee')) {
    return {
      label: 'Shopee',
      badgeClass: 'bg-[#EE4D2D] text-white border-[#EE4D2D]',
      buttonClass: 'bg-[#EE4D2D] hover:bg-[#d73f21]',
      icon: ShoppingBag,
    };
  }
  if (m.includes('tiktok')) {
    return {
      label: 'TikTok Shop',
      badgeClass: 'bg-gray-900 text-white dark:bg-black border-gray-800',
      buttonClass: 'bg-gray-900 hover:bg-black dark:bg-black dark:hover:bg-gray-900',
      icon: ExternalLink,
    };
  }
  if (m.includes('tokopedia')) {
    return {
      label: 'Tokopedia',
      badgeClass: 'bg-[#03AC0E] text-white border-[#03AC0E]',
      buttonClass: 'bg-[#03AC0E] hover:bg-[#028d0b]',
      icon: ShoppingBag,
    };
  }
  return {
    label: product.value?.merchant || 'Affiliate',
    badgeClass: 'bg-brand-red text-white border-brand-red',
    buttonClass: 'bg-brand-red hover:bg-brand-red-dark',
    icon: ShoppingBag,
  };
});

// Meta tag management untuk SEO
const truncatedDescription = computed(() => {
  if (!product.value) return 'Katalog Produk Promo & Affiliate BelanjaKlik';
  const desc = product.value.description || product.value.name;
  return desc.length > 155 ? `${desc.slice(0, 152)}...` : desc;
});

useHead({
  title: computed(() => (product.value ? `${product.value.name} â€” BelanjaKlik` : 'Produk Affiliate â€” BelanjaKlik')),
  meta: [
    { name: 'description', content: computed(() => truncatedDescription.value) },
    { property: 'og:title', content: computed(() => (product.value ? product.value.name : 'Produk Affiliate BelanjaKlik')) },
    { property: 'og:description', content: computed(() => truncatedDescription.value) },
    { property: 'og:image', content: computed(() => displayImageUrl.value) },
    { property: 'og:type', content: 'product' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: computed(() => (product.value ? product.value.name : 'Produk Affiliate BelanjaKlik')) },
    { name: 'twitter:description', content: computed(() => truncatedDescription.value) },
    { name: 'twitter:image', content: computed(() => displayImageUrl.value) },
  ],
});

const loadProductData = async () => {
  let rawSlug = String(route.params.slug || '');
  if (rawSlug.endsWith('.html')) {
    rawSlug = rawSlug.replace(/\.html$/, '');
  }

  if (!rawSlug) {
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  product.value = await getAffiliateProductBySlug(rawSlug);

  if (product.value) {
    relatedProducts.value = await getRelatedAffiliateProducts(
      product.value.category,
      product.value.id,
      4
    );
  }
  isLoading.value = false;
};

const handleAffiliateClick = async () => {
  if (!product.value) return;
  // Fire-and-forget click tracking
  trackAffiliateClick(product.value.id);
  // Site ID ditentukan berdasarkan domain yang sedang aktif.
  const affiliateUrl = await resolveProductAffiliateUrl(product.value);
  if (affiliateUrl) {
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
  }
};

// SSG / SSR pre-fetch data before html snapshot
onServerPrefetch(async () => {
  await loadProductData();
});

// Client-side fetch on mount if needed
onMounted(async () => {
  if (!product.value) {
    await loadProductData();
  }
});

watch(() => route.params.slug, loadProductData);
</script>

