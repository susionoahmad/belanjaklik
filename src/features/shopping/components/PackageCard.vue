<template>
  <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 rounded-3xl p-5 border border-gray-100 dark:border-gray-700/80 shadow-soft hover:shadow-xl transition-all flex flex-col justify-between group">
    <div>
      <div class="flex items-center justify-between mb-3">
        <span class="bg-brand-red/10 text-brand-red dark:bg-brand-red/20 dark:text-red-400 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
          <Sparkles class="w-3.5 h-3.5" />
          {{ template.category }}
        </span>
        <span class="text-xs text-gray-400 font-semibold">{{ template.items.length }} Jenis Barang</span>
      </div>

      <h3 class="font-extrabold text-base text-gray-900 dark:text-white mb-1 group-hover:text-brand-red transition-colors">
        {{ template.name }}
      </h3>
      <p class="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed line-clamp-2">
        {{ template.description }}
      </p>

      <!-- Items List Snippet -->
      <div class="space-y-1.5 mb-4 bg-white dark:bg-gray-700/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700">
        <div 
          v-for="(item, idx) in template.items.slice(0, 3)" 
          :key="idx"
          class="text-xs text-gray-700 dark:text-gray-300 flex items-center justify-between"
        >
          <span class="truncate">• {{ item.product_name }}</span>
          <span class="font-bold shrink-0 ml-2">×{{ item.quantity }}</span>
        </div>
        <div v-if="template.items.length > 3" class="text-[10px] text-gray-400 font-semibold pt-1 text-right">
          +{{ template.items.length - 3 }} produk lainnya
        </div>
      </div>
    </div>

    <!-- Action & Total -->
    <div class="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
      <div>
        <div class="text-[10px] text-gray-400 font-medium">Estimasi Paket:</div>
        <div class="font-black text-base text-brand-red">{{ formatRupiah(estimatedTotal) }}</div>
      </div>

      <button 
        @click="shoppingStore.loadTemplateToCart(template)"
        class="bg-brand-red hover:bg-brand-red-dark text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-brand-red/20 transition-all"
      >
        <Plus class="w-4 h-4" />
        <span>Pesan Paket</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Sparkles, Plus } from 'lucide-vue-next';
import type { ShoppingTemplate } from '../../shared/types';
import { formatRupiah } from '../../shared/utils/formatters';
import { useShoppingStore } from '../stores/shoppingStore';

const props = defineProps<{
  template: ShoppingTemplate;
}>();

const shoppingStore = useShoppingStore();

const estimatedTotal = computed(() => {
  return props.template.items.reduce((acc, item) => acc + (item.default_price * item.quantity), 0);
});
</script>
