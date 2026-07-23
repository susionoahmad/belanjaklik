<template>
  <div class="space-y-5 pb-20">
    <div>
      <h1 class="font-extrabold text-xl sm:text-2xl text-gray-900 dark:text-white">Katalog Produk Sembako</h1>
      <p class="text-xs text-gray-500">Cari & pilih produk segar berkualitas untuk pesanan Anda</p>
    </div>

    <!-- Search & Filter Controls -->
    <div class="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-soft space-y-3">
      <ProductSearchFilter />

      <!-- Brand & Sort Dropdowns -->
      <div class="flex items-center gap-3 pt-1">
        <div class="flex-1">
          <select 
            v-model="catalogStore.selectedBrand"
            class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none"
          >
            <option :value="null">Semua Merek</option>
            <option v-for="b in catalogStore.availableBrands" :key="b" :value="b">{{ b }}</option>
          </select>
        </div>

        <div class="flex-1">
          <select 
            v-model="catalogStore.sortBy"
            class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none"
          >
            <option value="popular">Paling Populer</option>
            <option value="promo">Promo Terbesar</option>
            <option value="price_low">Harga: Terrendah</option>
            <option value="price_high">Harga: Tertinggi</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Products Grid -->
    <div v-if="catalogStore.filteredProducts.length > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <ProductCard
        v-for="product in catalogStore.filteredProducts"
        :key="product.id"
        :product="product"
        @select="openProductDetail"
      />
    </div>

    <div v-else class="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
      <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 mx-auto mb-3">
        <Search class="w-8 h-8" />
      </div>
      <h3 class="font-bold text-gray-900 dark:text-white text-base">Produk Tidak Ditemukan</h3>
      <p class="text-xs text-gray-500 mt-1">Coba sesuaikan kata kunci pencarian atau ubah filter kategori Anda.</p>
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
import { Search } from 'lucide-vue-next';
import type { Product } from '../features/shared/types';
import { updatePageSeo } from '../features/shared/utils/seo';
import ProductSearchFilter from '../features/catalog/components/ProductSearchFilter.vue';
import ProductCard from '../features/catalog/components/ProductCard.vue';
import ProductDetailModal from '../features/catalog/components/ProductDetailModal.vue';
import { useCatalogStore } from '../features/catalog/stores/catalogStore';

const catalogStore = useCatalogStore();
const selectedProduct = ref<Product | null>(null);

onMounted(async () => {
  updatePageSeo('Katalog Sembako', 'Cari & pesan sembako lengkap berkualitas.');
  await catalogStore.fetchCatalogData();
});

const openProductDetail = (product: Product) => {
  selectedProduct.value = product;
  catalogStore.trackRecentlyViewed(product.id);
};
</script>
