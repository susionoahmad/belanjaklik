<template>
  <div class="bg-white dark:bg-gray-800 rounded-3xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-soft space-y-3">
    <div class="flex items-center justify-between">
      <div>
        <span class="text-[10px] text-gray-400 font-mono">ID: {{ request.id.slice(0, 8) }}</span>
        <h4 class="font-bold text-sm text-gray-900 dark:text-white">{{ formatDate(request.created_at) }}</h4>
      </div>
      <span class="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
        {{ request.status === 'sent_whatsapp' ? 'Terkirim WhatsApp' : request.status }}
      </span>
    </div>

    <!-- Items Summary -->
    <div v-if="request.items && request.items.length > 0" class="bg-gray-50 dark:bg-gray-700/40 p-3 rounded-2xl space-y-1">
      <div 
        v-for="(item, idx) in request.items.slice(0, 3)" 
        :key="idx"
        class="text-xs text-gray-700 dark:text-gray-300 flex items-center justify-between"
      >
        <span class="truncate">• {{ item.product_name }}</span>
        <span class="font-bold shrink-0 ml-2">×{{ item.quantity }}</span>
      </div>
      <div v-if="request.items.length > 3" class="text-[10px] text-gray-400 font-semibold pt-1">
        +{{ request.items.length - 3 }} item lainnya
      </div>
    </div>

    <!-- Repeat Order Action -->
    <div class="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
      <div>
        <div class="text-[10px] text-gray-400 font-medium">Total Pesanan:</div>
        <div class="font-black text-base text-gray-900 dark:text-white">{{ formatRupiah(request.estimated_total) }}</div>
      </div>

      <button 
        @click="shoppingStore.repeatOrder(request)"
        class="bg-brand-blue hover:bg-brand-blue-dark text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-brand-blue/20 transition-all"
      >
        <RotateCcw class="w-4 h-4" />
        <span>Ulangi Pesanan</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RotateCcw } from 'lucide-vue-next';
import type { ShoppingRequest } from '../../shared/types';
import { formatRupiah, formatDate } from '../../shared/utils/formatters';
import { useShoppingStore } from '../stores/shoppingStore';

defineProps<{
  request: ShoppingRequest;
}>();

const shoppingStore = useShoppingStore();
</script>
