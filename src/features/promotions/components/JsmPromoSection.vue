<template>
  <div 
    v-if="jsmProducts.length > 0" 
    class="bg-gradient-to-r from-amber-500 via-red-600 to-rose-700 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden border border-amber-300/40 group"
    @mouseenter="pauseAutoScroll"
    @mouseleave="resumeAutoScroll"
    @touchstart="pauseAutoScroll"
    @touchend="resumeAutoScroll"
  >
    <!-- Background Decorative Glow -->
    <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-yellow-300/20 rounded-full blur-2xl pointer-events-none"></div>

    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 relative z-10">
      <div class="flex items-center gap-3">
        <div class="p-2.5 bg-yellow-400 text-red-900 rounded-2xl shadow-md font-black flex items-center justify-center shrink-0">
          <Flame class="w-6 h-6 animate-pulse text-red-600 fill-red-600" />
        </div>
        <div>
          <div class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-yellow-300 text-red-950 text-[10px] font-black uppercase tracking-wider mb-0.5 shadow-xs">
            <span>🔥 PROMO JSM - HANYA 3 HARI!</span>
          </div>
          <h3 class="font-extrabold text-base sm:text-xl leading-tight">Promo Jumat Sabtu Minggu</h3>
          <p class="text-xs text-yellow-100/90 font-medium">Spesial harga hemat produk pilihan Alfamart</p>
        </div>
      </div>

      <!-- Date Period Badge & Navigation Controls -->
      <div class="flex items-center gap-2">
        <!-- Navigation Arrow Buttons -->
        <div class="flex items-center gap-1 bg-black/30 backdrop-blur-md p-1 rounded-full border border-white/20">
          <button 
            @click="scroll('left')"
            title="Geser Kiri"
            class="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-yellow-200 transition-all active:scale-95 cursor-pointer"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button 
            @click="scroll('right')"
            title="Geser Kanan"
            class="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-yellow-200 transition-all active:scale-95 cursor-pointer"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

        <div class="hidden sm:flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 text-xs font-mono font-extrabold text-yellow-300 shrink-0">
          <Calendar class="w-4 h-4 text-yellow-300" />
          <span>24 - 26 Juli 2026</span>
        </div>
      </div>
    </div>

    <!-- Horizontal Scrollable JSM Products with Smooth Touch & Auto Slider -->
    <div 
      ref="scrollContainerRef"
      class="flex items-center gap-3.5 overflow-x-auto pb-2 scrollbar-none scroll-smooth relative z-10"
    >
      <div 
        v-for="product in jsmProducts" 
        :key="product.id"
        class="w-40 sm:w-44 shrink-0 bg-white dark:bg-gray-800 rounded-2xl p-3 text-gray-900 dark:text-white shadow-lg flex flex-col justify-between group/card hover:scale-[1.02] transition-transform duration-200"
      >
        <div class="relative w-full aspect-square rounded-xl overflow-hidden mb-2 bg-gray-50 dark:bg-gray-700/50 p-2 flex items-center justify-center">
          <img 
            :src="proxyImageUrl(product.image_url || product.thumbnail_url || '')" 
            :alt="product.name" 
            class="max-w-full max-h-full object-contain drop-shadow-sm group-hover/card:scale-105 transition-transform duration-300" 
            @error="($event.target as HTMLImageElement).src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'" 
          />
          <span class="absolute top-1.5 left-1.5 bg-gradient-to-r from-red-600 to-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs">
            JSM
          </span>
        </div>

        <div class="space-y-1">
          <div class="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider line-clamp-1">
            {{ product.brand || 'Alfamart' }}
          </div>
          <h4 class="font-extrabold text-xs line-clamp-2 leading-snug min-h-[32px]">{{ product.name }}</h4>
          
          <div class="pt-1">
            <div class="font-black text-sm text-brand-red">
              {{ formatRupiah(product.promo_price || product.price) }}
            </div>
            <div v-if="product.promo_price && product.price > product.promo_price" class="text-[10px] text-gray-400 line-through font-semibold">
              {{ formatRupiah(product.price) }}
            </div>
          </div>
        </div>

        <button 
          @click="handlePurchase(product)" 
          class="w-full mt-3 font-extrabold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
          :class="getButtonConfig(product).buttonClass"
        >
          <component :is="getButtonIcon(product)" class="w-3.5 h-3.5" />
          <span>{{ getButtonConfig(product).label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Flame, Calendar, ChevronLeft, ChevronRight, Plus, ExternalLink, ShoppingBag, MessageSquare, CheckCircle2, HelpCircle } from 'lucide-vue-next';
import { formatRupiah } from '../../shared/utils/formatters';
import { useCatalogStore } from '../../catalog/stores/catalogStore';
import { PurchaseService } from '../../purchase/services/PurchaseService';
import { proxyImageUrl } from '../../tokosaya-sync/services/ImageProxyService';
import type { Product } from '../../shared/types';

const catalogStore = useCatalogStore();
const scrollContainerRef = ref<HTMLElement | null>(null);
let autoScrollTimer: ReturnType<typeof setInterval> | null = null;
let isPaused = false;

const iconMap: Record<string, any> = {
  Plus,
  ExternalLink,
  ShoppingBag,
  MessageSquare,
  CheckCircle2,
  HelpCircle
};

const scroll = (direction: 'left' | 'right') => {
  if (!scrollContainerRef.value) return;
  const scrollAmount = 240;
  if (direction === 'left') {
    scrollContainerRef.value.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  } else {
    const maxScrollLeft = scrollContainerRef.value.scrollWidth - scrollContainerRef.value.clientWidth;
    if (scrollContainerRef.value.scrollLeft >= maxScrollLeft - 10) {
      scrollContainerRef.value.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      scrollContainerRef.value.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }
};

const startAutoScroll = () => {
  if (autoScrollTimer) clearInterval(autoScrollTimer);
  autoScrollTimer = setInterval(() => {
    if (!isPaused && scrollContainerRef.value) {
      scroll('right');
    }
  }, 3200);
};

const pauseAutoScroll = () => {
  isPaused = true;
};

const resumeAutoScroll = () => {
  isPaused = false;
};

onMounted(() => {
  startAutoScroll();
});

onUnmounted(() => {
  if (autoScrollTimer) clearInterval(autoScrollTimer);
});

const jsmProducts = computed(() => {
  return catalogStore.products.filter(p => {
    if (!p.is_promo && !p.promo_price) return false;

    if (p.promo_type === 'JSM' || p.promo_badge?.includes('JSM')) return true;

    const cat = String(p.category || '').toLowerCase();
    const title = String(p.promo_title || '').toLowerCase();
    if (cat.includes('jsm') || title.includes('jsm')) return true;

    const name = String(p.name || '').toLowerCase();
    const brand = String(p.brand || '').toLowerCase();
    const jsmKeywords = ['fres & natural', 'fres&nat', 'lifebuoy', 'pepsodent', 'systema', 'emeron', 'close up', 'closeup'];
    return jsmKeywords.some(kw => name.includes(kw) || brand.includes(kw));
  });
});

const getButtonConfig = (product: Product) => {
  return PurchaseService.getButtonConfig(product);
};

const getButtonIcon = (product: Product) => {
  const config = getButtonConfig(product);
  return iconMap[config.iconName] || Plus;
};

const handlePurchase = async (product: Product) => {
  await PurchaseService.execute(product);
};
</script>

