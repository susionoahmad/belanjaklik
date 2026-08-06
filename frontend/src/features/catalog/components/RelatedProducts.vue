<template>
  <div v-if="relatedItems.length > 0" class="pt-2">
    <h4 class="font-bold text-xs text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
      <Sparkles class="w-4 h-4 text-brand-yellow-dark" />
      <span>Sering Dibeli Bersamaan:</span>
    </h4>
    <div class="grid grid-cols-2 gap-2">
      <div 
        v-for="item in relatedItems" 
        :key="item.id" 
        class="bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-2 cursor-pointer hover:border-brand-red transition-colors"
        @click="cartStore.addItem(item)"
      >
        <img :src="proxyImageUrl(item.image_url || '')" :alt="item.name" class="w-10 h-10 object-cover rounded-lg shrink-0" @error="($event.target as HTMLImageElement).src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=150'" />
        <div class="min-w-0 flex-1">
          <h5 class="text-[11px] font-bold truncate text-gray-900 dark:text-white">{{ item.name }}</h5>
          <span class="text-[10px] font-extrabold text-brand-red">{{ formatRupiah(item.promo_price || item.price) }}</span>
        </div>
        <Plus class="w-4 h-4 text-brand-red shrink-0" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Sparkles, Plus } from 'lucide-vue-next';
import type { Product } from '../../shared/types';
import { formatRupiah } from '../../shared/utils/formatters';
import { useCatalogStore } from '../stores/catalogStore';
import { useCartStore } from '../../cart/stores/cartStore';
import { proxyImageUrl } from '../../tokosaya-sync/services/ImageProxyService';

const props = defineProps<{
  currentProduct: Product;
}>();

const catalogStore = useCatalogStore();
const cartStore = useCartStore();

const relatedItems = computed(() => {
  return catalogStore.products
    .filter(p => p.id !== props.currentProduct.id && (p.category_id === props.currentProduct.category_id || p.brand === props.currentProduct.brand))
    .slice(0, 2);
});
</script>
