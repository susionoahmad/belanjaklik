<template>
  <div class="space-y-6 pb-20">
    <div>
      <h1 class="font-extrabold text-xl sm:text-2xl text-gray-900 dark:text-white">Promo & Diskon Spesial</h1>
      <p class="text-xs text-gray-500">Hemat lebih banyak dengan penawaran diskon minggu ini</p>
    </div>

    <!-- Promo JSM Section -->
    <JsmPromoSection />

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


    <!-- Promo Brochure Files (PDF / Gambar) -->
    <section class="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 space-y-3 shadow-soft">
      <div class="flex items-center justify-between">
        <h3 class="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
          <FileText class="w-4 h-4 text-brand-blue" />
          <span>Brosur Promo Cetak (PDF / Gambar)</span>
        </h3>
        <span class="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-brand-blue border border-blue-200 px-2 py-0.5 rounded-full">
          Siap Unduh & OCR
        </span>
      </div>

      <div class="space-y-2.5">
        <div v-for="file in promotionStore.promoFiles" :key="file.id" class="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-700/50 rounded-2xl gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-brand-red flex items-center justify-center shrink-0">
              <FileText class="w-5 h-5" />
            </div>
            <div>
              <h4 class="font-extrabold text-xs text-gray-900 dark:text-white">{{ file.title }}</h4>
              <div class="text-[10px] text-gray-400 font-mono mt-0.5">Periode: {{ file.start_date }} s/d {{ file.end_date }}</div>
            </div>
          </div>
          
          <div class="flex items-center gap-2 self-end sm:self-auto">
            <button 
              @click="activePdfPreview = file"
              class="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-blue-50 dark:bg-blue-950/80 text-brand-blue hover:bg-blue-100 flex items-center gap-1.5 transition-colors"
            >
              <Eye class="w-3.5 h-3.5" />
              <span>Lihat Brosur</span>
            </button>
            <a 
              :href="file.file_url" 
              download 
              target="_blank" 
              class="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-brand-red text-white hover:bg-brand-red-dark flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Download class="w-3.5 h-3.5" />
              <span>Unduh PDF</span>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- PDF Preview Modal -->
    <div v-if="activePdfPreview" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div class="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700">
        <div class="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50">
          <div class="flex items-center gap-2">
            <FileText class="w-5 h-5 text-brand-red" />
            <div>
              <h3 class="font-extrabold text-sm text-gray-900 dark:text-white">{{ activePdfPreview.title }}</h3>
              <p class="text-[10px] text-gray-400">Periode: {{ activePdfPreview.start_date }} s/d {{ activePdfPreview.end_date }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <a :href="activePdfPreview.file_url" download target="_blank" class="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-brand-red text-white flex items-center gap-1">
              <Download class="w-3.5 h-3.5" />
              <span>Unduh</span>
            </a>
            <button @click="activePdfPreview = null" class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200">
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
        <div class="flex-1 bg-gray-100 dark:bg-gray-900 p-2">
          <iframe :src="activePdfPreview.file_url" class="w-full h-full rounded-2xl border-0"></iframe>
        </div>
      </div>
    </div>

    <ProductDetailModal
      :isOpen="!!selectedProduct"
      :product="selectedProduct"
      @close="selectedProduct = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { FileText, Eye, Download, X } from 'lucide-vue-next';
import type { Product, PromoFile } from '../features/shared/types';
import { updatePageSeo } from '../features/shared/utils/seo';
import FlashSaleSection from '../features/promotions/components/FlashSaleSection.vue';
import JsmPromoSection from '../features/promotions/components/JsmPromoSection.vue';

import ProductCard from '../features/catalog/components/ProductCard.vue';
import ProductDetailModal from '../features/catalog/components/ProductDetailModal.vue';
import { useCatalogStore } from '../features/catalog/stores/catalogStore';
import { usePromotionStore } from '../features/promotions/stores/promotionStore';

const catalogStore = useCatalogStore();
const promotionStore = usePromotionStore();
const selectedProduct = ref<Product | null>(null);
const activePdfPreview = ref<PromoFile | null>(null);

onMounted(async () => {
  updatePageSeo('Promo Spesial', 'Banyak diskon menarik sembako.');
  await catalogStore.fetchCatalogData();
});

const openProductDetail = (product: Product) => {
  selectedProduct.value = product;
};
</script>

