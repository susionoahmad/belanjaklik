<template>
  <router-link
    :to="`/produk/${productSlug}`"
    class="bg-white dark:bg-gray-800 rounded-3xl p-3 sm:p-4 border border-gray-100 dark:border-gray-700 shadow-soft hover:shadow-hover transition-all duration-300 flex flex-col justify-between group relative overflow-hidden h-full cursor-pointer"
  >
    <!-- Top Badges -->
    <div class="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 max-w-[85%]">
      <!-- Merchant Badge -->
      <span
        class="text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs uppercase tracking-wider flex items-center gap-1 border"
        :class="merchantStyle.badgeClass"
      >
        <component :is="merchantStyle.icon" class="w-3 h-3" />
        <span>{{ merchantStyle.label }}</span>
      </span>

      <!-- Discount / Bestseller Badge -->
      <span
        v-if="discountPercent > 0"
        class="bg-gradient-to-r from-red-600 to-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs uppercase tracking-wider"
      >
        -{{ discountPercent }}%
      </span>
      <span
        v-else
        class="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs uppercase tracking-wider flex items-center gap-0.5"
      >
        <span>⭐</span>
        <span>BESTSELLER</span>
      </span>
    </div>

    <!-- Product Image Container -->
    <div class="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-700/60 mb-3 flex items-center justify-center p-3">
      <img
        :src="displayImageUrl"
        :alt="product.name"
        class="max-w-full max-h-full object-contain rounded-xl drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        @error="handleImageError"
      />
    </div>

    <!-- Details -->
    <div class="space-y-1.5 flex-1 flex flex-col justify-between">
      <div>
        <div class="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider line-clamp-1 mb-0.5">
          {{ product.shop_name || product.category || merchantStyle.label }}
        </div>
        <h3 class="font-bold text-xs sm:text-sm text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-brand-red transition-colors">
          {{ product.name }}
        </h3>
      </div>

      <!-- Price Section -->
      <div class="pt-2">
        <div class="flex items-baseline gap-1.5 flex-wrap">
          <span class="font-extrabold text-sm sm:text-base text-brand-red">
            {{ formatPrice(product.price) }}
          </span>
          <span v-if="hasDiscount && product.original_price" class="text-xs text-gray-400 line-through">
            {{ formatPrice(product.original_price) }}
          </span>
        </div>
        <div v-if="hasDiscount && product.original_price" class="flex gap-2 text-[9px] font-semibold text-gray-400">
          <span>Harga promo</span>
          <span>Harga normal</span>
        </div>

        <!-- Rating & Sales Count Badge -->
        <div v-if="productRating > 0 || productSold > 0" class="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 flex-wrap">
          <div v-if="productRating > 0" class="flex items-center gap-0.5 text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-700/40">
            <Star class="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
            <span>{{ productRating.toFixed(1) }}</span>
          </div>
          <span v-if="productSold > 0" class="text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/60 px-1.5 py-0.5 rounded-md">
            {{ formatSold(productSold) }} terjual
          </span>
        </div>

        <!-- Shop Name / Info Tag -->
        <div v-if="product.shop_name" class="mt-1 flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
          <Store class="w-3 h-3 text-gray-400 shrink-0" />
          <span class="truncate">{{ product.shop_name }}</span>
        </div>
      </div>
    </div>

    <!-- Action Button -->
    <div class="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
      <div
        class="w-full py-2 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs group-hover:bg-brand-red group-hover:text-white bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700"
      >
        <span>Lihat Detail</span>
        <ArrowRight class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ShoppingBag, ArrowRight, Store, ExternalLink, Star } from 'lucide-vue-next';
import type { AffiliateProduct } from '../types';
import { formatRupiah } from '@/features/shared/utils/formatters';
import { proxyImageUrl } from '@/features/tokosaya-sync/services/ImageProxyService';

const props = defineProps<{
  product: AffiliateProduct;
}>();

const productSlug = computed(() => {
  if (props.product.slug && props.product.slug.trim() !== '') {
    return props.product.slug;
  }
  const str = (props.product.name || props.product.id || 'produk-affiliate').toLowerCase().trim();
  return str.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
});

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400';

const displayImageUrl = computed(() => {
  if (!props.product.image_url) return FALLBACK_IMAGE;
  return proxyImageUrl(props.product.image_url);
});

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  if (target && target.src !== FALLBACK_IMAGE) {
    target.src = FALLBACK_IMAGE;
  }
};

const formatPrice = (val?: number | null) => {
  if (!val || val <= 0) return 'Lihat Harga';
  return formatRupiah(val);
};

const productSold = computed(() => {
  if (props.product.item_sold && props.product.item_sold > 0) {
    return props.product.item_sold;
  }
  const rawSold = props.product.raw_data?.item_sold;
  if (rawSold) {
    const parsed = parseInt(String(rawSold), 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
});

const productRating = computed(() => {
  if (props.product.item_rating && props.product.item_rating > 0) {
    return Number(props.product.item_rating);
  }
  const rawRating = props.product.raw_data?.item_rating;
  if (rawRating) {
    const parsed = parseFloat(String(rawRating));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
});

const formatSold = (num: number) => {
  if (num >= 10000) return `${Math.floor(num / 1000)}rb+`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace('.0', '')}rb+`;
  return String(num);
};

const hasDiscount = computed(() => {
  return (
    Boolean(props.product.original_price) &&
    Boolean(props.product.price) &&
    Number(props.product.original_price) > Number(props.product.price)
  );
});

const discountPercent = computed(() => {
  if (props.product.discount_percent && props.product.discount_percent > 0) {
    return Math.round(props.product.discount_percent);
  }
  if (hasDiscount.value && props.product.original_price && props.product.price) {
    const original = Number(props.product.original_price);
    const current = Number(props.product.price);
    return Math.round(((original - current) / original) * 100);
  }
  return 0;
});

const merchantStyle = computed(() => {
  const m = (props.product.merchant || '').toLowerCase();
  if (m.includes('shopee')) {
    return {
      label: 'Shopee',
      badgeClass: 'bg-[#EE4D2D] text-white border-[#EE4D2D]',
      icon: ShoppingBag,
    };
  }
  if (m.includes('tiktok')) {
    return {
      label: 'TikTok Shop',
      badgeClass: 'bg-gray-900 text-white dark:bg-black border-gray-800',
      icon: ExternalLink,
    };
  }
  if (m.includes('blibli')) {
    return {
      label: 'Blibli',
      badgeClass: 'bg-[#0B63CE] text-white border-[#0B63CE]',
      icon: ShoppingBag,
    };
  }
  if (m.includes('tokopedia')) {
    return {
      label: 'Tokopedia',
      badgeClass: 'bg-[#03AC0E] text-white border-[#03AC0E]',
      icon: ShoppingBag,
    };
  }
  return {
    label: props.product.merchant || 'Affiliate',
    badgeClass: 'bg-brand-red text-white border-brand-red',
    icon: ShoppingBag,
  };
});
</script>
