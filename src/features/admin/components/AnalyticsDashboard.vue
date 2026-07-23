<template>
  <div class="space-y-5">
    <!-- Top Metric Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-soft">
        <div class="flex items-center justify-between text-gray-400 mb-1">
          <span class="text-[11px] font-bold uppercase tracking-wider">Total Produk</span>
          <Package class="w-4 h-4 text-brand-blue" />
        </div>
        <div class="font-extrabold text-xl text-gray-900 dark:text-white">{{ catalogStore.products.length }}</div>
        <div class="text-[10px] text-emerald-600 font-semibold mt-1">Aktif di Katalog</div>
      </div>

      <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-soft">
        <div class="flex items-center justify-between text-gray-400 mb-1">
          <span class="text-[11px] font-bold uppercase tracking-wider">Produk Promo</span>
          <Tag class="w-4 h-4 text-brand-red" />
        </div>
        <div class="font-extrabold text-xl text-brand-red">{{ catalogStore.promoProducts.length }}</div>
        <div class="text-[10px] text-gray-500 font-semibold mt-1">Harga Diskon Spesial</div>
      </div>

      <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-soft">
        <div class="flex items-center justify-between text-gray-400 mb-1">
          <span class="text-[11px] font-bold uppercase tracking-wider">Total Pesanan</span>
          <ShoppingBag class="w-4 h-4 text-emerald-500" />
        </div>
        <div class="font-extrabold text-xl text-gray-900 dark:text-white">{{ shoppingStore.requestHistory.length }}</div>
        <div class="text-[10px] text-emerald-600 font-semibold mt-1">Dikirim ke WhatsApp</div>
      </div>

      <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-soft">
        <div class="flex items-center justify-between text-gray-400 mb-1">
          <span class="text-[11px] font-bold uppercase tracking-wider">Kategori</span>
          <Grid class="w-4 h-4 text-brand-yellow-dark" />
        </div>
        <div class="font-extrabold text-xl text-gray-900 dark:text-white">{{ catalogStore.categories.length }}</div>
        <div class="text-[10px] text-gray-500 font-semibold mt-1">Klasifikasi Sembako</div>
      </div>
    </div>

    <!-- Category Breakdown Table -->
    <div class="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-soft">
      <h3 class="font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <TrendingUp class="w-4 h-4 text-brand-red" />
        <span>Ringkasan Kategori Teratas</span>
      </h3>
      <div class="space-y-2">
        <div v-for="cat in categoryMetrics" :key="cat.name" class="flex items-center justify-between text-xs p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/40">
          <span class="font-bold text-gray-800 dark:text-gray-200">{{ cat.name }}</span>
          <span class="font-extrabold text-brand-blue dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-full">{{ cat.count }} Produk</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Package, Tag, ShoppingBag, Grid, TrendingUp } from 'lucide-vue-next';
import { useCatalogStore } from '../../catalog/stores/catalogStore';
import { useShoppingStore } from '../../shopping/stores/shoppingStore';

const catalogStore = useCatalogStore();
const shoppingStore = useShoppingStore();

const categoryMetrics = computed(() => {
  return catalogStore.categories.map(cat => {
    const count = catalogStore.products.filter(p => p.category_id === cat.id).length;
    return { name: cat.name, count };
  });
});
</script>
