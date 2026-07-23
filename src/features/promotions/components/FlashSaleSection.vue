<template>
  <div v-if="catalogStore.promoProducts.length > 0" class="bg-gradient-to-br from-brand-red-dark via-brand-red to-rose-600 rounded-3xl p-5 text-white shadow-floating relative overflow-hidden">
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

      <!-- Countdown Timer Mock -->
      <div class="flex items-center gap-1 text-xs font-mono font-bold bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
        <Clock class="w-3.5 h-3.5 text-brand-yellow" />
        <span>04 : 28 : 15</span>
      </div>
    </div>

    <!-- Horizontal Scrollable Flash Sale Items -->
    <div class="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
      <div 
        v-for="product in catalogStore.promoProducts" 
        :key="product.id"
        class="w-36 shrink-0 bg-white dark:bg-gray-800 rounded-2xl p-2.5 text-gray-900 dark:text-white shadow-md flex flex-col justify-between"
      >
        <div class="relative w-full aspect-square rounded-xl overflow-hidden mb-2 bg-gray-100 dark:bg-gray-700">
          <img :src="proxyImageUrl(product.image_url || '')" :alt="product.name" class="w-full h-full object-cover" @error="($event.target as HTMLImageElement).src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'" />
          <span class="absolute top-1 left-1 bg-brand-red text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
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
          class="w-full mt-2 font-extrabold text-[11px] py-1.5 rounded-lg flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95"
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
import { Zap, Clock, Plus, ExternalLink, ShoppingBag, MessageSquare, CheckCircle2, HelpCircle } from 'lucide-vue-next';
import { formatRupiah } from '../../shared/utils/formatters';
import { useCatalogStore } from '../../catalog/stores/catalogStore';
import { PurchaseService } from '../../purchase/services/PurchaseService';
import { proxyImageUrl } from '../../tokosaya-sync/services/ImageProxyService';
import type { Product } from '../../shared/types';

const catalogStore = useCatalogStore();

const iconMap: Record<string, any> = {
  Plus,
  ExternalLink,
  ShoppingBag,
  MessageSquare,
  CheckCircle2,
  HelpCircle
};

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
