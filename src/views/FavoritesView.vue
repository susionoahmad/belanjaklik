<template>
  <div class="space-y-5 pb-20">
    <div>
      <h1 class="font-extrabold text-xl sm:text-2xl text-gray-900 dark:text-white">Favorit Saya</h1>
      <p class="text-xs text-gray-500">Daftar produk langganan yang sering Anda pesan</p>
    </div>

    <div v-if="favoritesStore.favoriteProducts.length > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <ProductCard
        v-for="product in favoritesStore.favoriteProducts"
        :key="product.id"
        :product="product"
        @select="openProductDetail"
      />
    </div>

    <div v-else class="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
      <div class="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-500 mx-auto mb-3">
        <Heart class="w-8 h-8" />
      </div>
      <h3 class="font-bold text-gray-900 dark:text-white text-base">Belum Ada Produk Favorit</h3>
      <p class="text-xs text-gray-500 mt-1 max-w-xs mx-auto">Tekan tombol ikon hati pada produk katalog untuk menyimpannya di sini.</p>
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
import { Heart } from 'lucide-vue-next';
import type { Product } from '../features/shared/types';
import { updatePageSeo } from '../features/shared/utils/seo';
import ProductCard from '../features/catalog/components/ProductCard.vue';
import ProductDetailModal from '../features/catalog/components/ProductDetailModal.vue';
import { useFavoritesStore } from '../features/favorites/stores/favoriteStore';

const favoritesStore = useFavoritesStore();
const selectedProduct = ref<Product | null>(null);

onMounted(() => {
  updatePageSeo('Favorit Saya', 'Produk favorit pilihan Anda.');
});

const openProductDetail = (product: Product) => {
  selectedProduct.value = product;
};
</script>
