<template>
  <div class="space-y-6 pb-20">
    <div>
      <h1 class="font-extrabold text-xl sm:text-2xl text-gray-900 dark:text-white">Promo & Diskon Spesial</h1>
      <p class="text-xs text-gray-500">Hemat lebih banyak dengan penawaran diskon minggu ini</p>
    </div>

    <!-- Flash Sale Section -->
    <FlashSaleSection />

    <!-- Promo Products Grid -->
    <section class="space-y-3">
      <h2 class="font-extrabold text-base text-gray-900 dark:text-white">Semua Produk Promo</h2>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <ProductCard
          v-for="product in catalogStore.promoProducts"
          :key="product.id"
          :product="product"
          @select="openProductDetail"
        />
      </div>
    </section>

    <!-- Promo Brochure Files (OCR Ready) -->
    <section class="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 space-y-3 shadow-soft">
      <h3 class="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
        <FileText class="w-4 h-4 text-brand-blue" />
        <span>Brosur Promo Cetak (PDF / Gambar)</span>
      </h3>
      <div class="space-y-2">
        <div v-for="file in promotionStore.promoFiles" :key="file.id" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
          <div class="flex items-center gap-2.5">
            <FileText class="w-5 h-5 text-brand-red" />
            <div>
              <h4 class="font-bold text-xs text-gray-900 dark:text-white">{{ file.title }}</h4>
              <span class="text-[10px] text-gray-400">Periode: {{ file.start_date }} s/d {{ file.end_date }}</span>
            </div>
          </div>
          <a :href="file.file_url" target="_blank" class="text-xs font-bold text-brand-blue hover:underline">Unduh PDF</a>
        </div>
      </div>
    </section>

    <ProductDetailModal
      :isOpen="!!selectedProduct"
      :product="selectedProduct"
      @close="selectedProduct = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { FileText } from 'lucide-vue-next';
import type { Product } from '../features/shared/types';
import { updatePageSeo } from '../features/shared/utils/seo';
import FlashSaleSection from '../features/promotions/components/FlashSaleSection.vue';
import ProductCard from '../features/catalog/components/ProductCard.vue';
import ProductDetailModal from '../features/catalog/components/ProductDetailModal.vue';
import { useCatalogStore } from '../features/catalog/stores/catalogStore';
import { usePromotionStore } from '../features/promotions/stores/promotionStore';

const catalogStore = useCatalogStore();
const promotionStore = usePromotionStore();
const selectedProduct = ref<Product | null>(null);

onMounted(async () => {
  updatePageSeo('Promo Spesial', 'Banyak diskon menarik sembako.');
  await catalogStore.fetchCatalogData();
});

const openProductDetail = (product: Product) => {
  selectedProduct.value = product;
};
</script>
