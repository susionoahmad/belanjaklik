<template>
  <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800/80">
    <img 
      :src="proxyImageUrl(item.product.image_url || '')" 
      :alt="item.product.name" 
      class="w-16 h-16 object-cover rounded-xl shrink-0 bg-white dark:bg-gray-700"
      @error="($event.target as HTMLImageElement).src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=150'"
    />

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
        <span v-if="item.product.brand" class="text-brand-blue dark:text-blue-400 font-bold">{{ item.product.brand }}</span>
        <span>• {{ item.product.unit }}</span>
      </div>
      <h4 class="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">{{ item.product.name }}</h4>
      <div class="flex items-center gap-1.5 mt-0.5">
        <span class="font-extrabold text-xs text-brand-red">
          {{ formatRupiah(item.product.promo_price || item.product.price) }}
        </span>
        <span v-if="item.product.promo_price" class="text-[10px] text-gray-400 line-through">
          {{ formatRupiah(item.product.price) }}
        </span>
      </div>
    </div>

    <!-- Quantity Modifier Controls -->
    <div class="flex items-center gap-1.5 shrink-0 bg-white dark:bg-gray-700 rounded-xl p-1 shadow-sm border border-gray-200 dark:border-gray-600">
      <button 
        @click="cartStore.updateQuantity(item.product.id, item.quantity - 1)" 
        class="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 flex items-center justify-center text-xs font-bold transition-colors"
      >
        <Minus class="w-3 h-3" />
      </button>
      <span class="w-5 text-center font-extrabold text-xs text-gray-900 dark:text-white">{{ item.quantity }}</span>
      <button 
        @click="cartStore.updateQuantity(item.product.id, item.quantity + 1)" 
        class="w-6 h-6 rounded-lg bg-brand-red text-white hover:bg-brand-red-dark flex items-center justify-center text-xs font-bold transition-colors"
      >
        <Plus class="w-3 h-3" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Minus, Plus } from 'lucide-vue-next';
import type { CartItem } from '../../shared/types';
import { formatRupiah } from '../../shared/utils/formatters';
import { useCartStore } from '../stores/cartStore';
import { proxyImageUrl } from '../../tokosaya-sync/services/ImageProxyService';

const props = defineProps<{
  item: CartItem;
}>();

const cartStore = useCartStore();
</script>
