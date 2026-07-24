<template>
  <div 
    v-if="flashSaleProducts.length > 0" 
    class="bg-gradient-to-br from-brand-red-dark via-brand-red to-rose-600 rounded-3xl p-5 text-white shadow-floating relative overflow-hidden group"
    @mouseenter="pauseAutoScroll"
    @mouseleave="resumeAutoScroll"
    @touchstart="pauseAutoScroll"
    @touchend="resumeAutoScroll"
  >
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div class="p-2 bg-white/20 backdrop-blur-md rounded-xl">
          <Zap class="w-5 h-5 text-brand-yellow animate-bounce" />
        </div>
        <div>
          <h3 class="font-extrabold text-base sm:text-lg leading-tight">Flash Sale Hari Ini</h3>
          <p class="text-[11px] text-white/80">Stok terbatas harga miring!</p>
        </div>
      </div>

      <!-- Controls: Navigation Arrows & Timer -->
      <div class="flex items-center gap-2">
        <!-- Scroll Nav Buttons -->
        <div class="flex items-center gap-1 bg-black/20 backdrop-blur-md p-1 rounded-full border border-white/10">
          <button 
            @click="scroll('left')"
            title="Geser Kiri"
            class="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button 
            @click="scroll('right')"
            title="Geser Kanan"
            class="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

        <!-- Countdown Timer Mock -->
        <div class="hidden sm:flex items-center gap-1 text-xs font-mono font-bold bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
          <Clock class="w-3.5 h-3.5 text-brand-yellow" />
          <span>04 : 28 : 15</span>
        </div>
      </div>
    </div>

    <!-- Horizontal Scrollable Flash Sale Items with Auto-Scroll & Smooth Touch Slider -->
    <div 
      ref="scrollContainerRef"
      class="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none scroll-smooth"
    >
      <div 
        v-for="product in flashSaleProducts" 
        :key="product.id"
        class="w-36 shrink-0 bg-white dark:bg-gray-800 rounded-2xl p-2.5 text-gray-900 dark:text-white shadow-md flex flex-col justify-between group/card hover:scale-[1.02] transition-transform duration-200"
      >

        <div class="relative w-full aspect-square rounded-xl overflow-hidden mb-2 bg-gray-100 dark:bg-gray-700">
          <img :src="proxyImageUrl(product.image_url || '')" :alt="product.name" class="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300" @error="($event.target as HTMLImageElement).src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'" />
          <span class="absolute top-1 left-1 bg-brand-red text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
            Diskon!
          </span>
        </div>

        <div>
          <h4 class="font-bold text-xs line-clamp-1 mb-1">{{ product.name }}</h4>
          <div class="font-black text-xs text-brand-red">{{ formatRupiah(product.promo_price || product.price) }}</div>
          <div class="text-[10px] text-gray-400 line-through">{{ formatRupiah(product.price) }}</div>
        </div>

        <button 
          @click="handlePurchase(product)" 
          class="w-full mt-2 font-extrabold text-[11px] py-1.5 rounded-lg flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer"
          :class="getButtonConfig(product).buttonClass"
        >
          <component :is="getButtonIcon(product)" class="w-3 h-3" />
          <span>{{ getButtonConfig(product).label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const flashSaleProducts = computed(() => {
  const explicitFlash = catalogStore.products.filter(p => p.promo_type === 'FLASHSALE' || p.promo_badge?.toUpperCase().includes('FLASH'));
  if (explicitFlash.length > 0) return explicitFlash;
  
  return catalogStore.products.filter(p => p.is_promo && p.promo_type === 'FLASHSALE');
});


import { Zap, Clock, ChevronLeft, ChevronRight, Plus, ExternalLink, ShoppingBag, MessageSquare, CheckCircle2, HelpCircle } from 'lucide-vue-next';
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
  const scrollAmount = 220;
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
  }, 3500);
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

