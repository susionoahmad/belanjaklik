<template>
  <div class="space-y-6 pb-20">
    <!-- PWA Install Banner -->
    <PwaInstallBanner />

    <!-- Offline Status Indicator -->
    <OfflineBanner />

    <!-- Promo Banner Slider -->
    <BannerSlider />

    <!-- Quick Category Grid -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
          <Grid class="w-5 h-5 text-brand-red" />
          <span>Kategori Pilihan</span>
        </h2>
        <router-link to="/catalog" class="text-xs font-bold text-brand-red hover:underline">
          Lihat Semua
        </router-link>
      </div>

      <div class="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5">
        <button
          v-for="cat in catalogStore.categoriesWithProducts"
          :key="cat.id"
          @click="selectCategory(cat.slug)"
          class="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-soft hover:border-brand-red transition-all flex flex-col items-center text-center group"
        >
          <div class="w-10 h-10 rounded-xl bg-brand-red/10 text-brand-red group-hover:bg-brand-red group-hover:text-white transition-colors flex items-center justify-center mb-2">
            <ShoppingBag class="w-5 h-5" />
          </div>
          <span class="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-2 leading-tight">{{ cat.name }}</span>
        </button>
      </div>
    </section>

    <!-- Promo JSM Section -->
    <JsmPromoSection />

    <!-- Flash Sale Countdown Section -->
    <FlashSaleSection />


    <!-- Quick Shopping Packages / Bundles -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <div>
          <h2 class="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <Package class="w-5 h-5 text-brand-yellow-dark" />
            <span>Paket Belanja Hemat</span>
          </h2>
          <p class="text-xs text-gray-500">Sekali klik langsung isi keranjang kebutuhan Anda</p>
        </div>
        <router-link to="/packages" class="text-xs font-bold text-brand-red hover:underline">
          Semua Paket
        </router-link>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PackageCard 
          v-for="template in shoppingStore.templates.slice(0, 3)" 
          :key="template.id" 
          :template="template" 
        />
      </div>
    </section>

    <!-- Featured Products -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles class="w-5 h-5 text-brand-red" />
          <span>Produk Terlaris & Unggulan</span>
        </h2>
        <router-link to="/catalog" class="text-xs font-bold text-brand-red hover:underline">
          Lihat Semua
        </router-link>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <ProductCard
          v-for="product in catalogStore.featuredProducts"
          :key="product.id"
          :product="product"
          @select="openProductDetail"
        />
      </div>
    </section>

    <!-- Recently Viewed Products -->
    <section v-if="catalogStore.recentlyViewedProducts.length > 0">
      <h2 class="font-extrabold text-base text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <Clock class="w-5 h-5 text-gray-400" />
        <span>Terakhir Dilihat</span>
      </h2>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ProductCard
          v-for="product in catalogStore.recentlyViewedProducts"
          :key="product.id"
          :product="product"
          @select="openProductDetail"
        />
      </div>
    </section>

    <!-- Product Detail Modal -->
    <ProductDetailModal
      :isOpen="!!selectedProduct"
      :product="selectedProduct"
      @close="selectedProduct = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Grid, ShoppingBag, Package, Sparkles, Clock } from 'lucide-vue-next';
import type { Product } from '../features/shared/types';
import { updatePageSeo } from '../features/shared/utils/seo';
import OfflineBanner from '../features/shared/components/OfflineBanner.vue';
import PwaInstallBanner from '../features/shared/components/PwaInstallBanner.vue';
import BannerSlider from '../features/promotions/components/BannerSlider.vue';
import FlashSaleSection from '../features/promotions/components/FlashSaleSection.vue';
import JsmPromoSection from '../features/promotions/components/JsmPromoSection.vue';

import PackageCard from '../features/shopping/components/PackageCard.vue';
import ProductCard from '../features/catalog/components/ProductCard.vue';
import ProductDetailModal from '../features/catalog/components/ProductDetailModal.vue';
import { useCatalogStore } from '../features/catalog/stores/catalogStore';
import { useShoppingStore } from '../features/shopping/stores/shoppingStore';

import { usePromotionStore } from '../features/promotions/stores/promotionStore';

const router = useRouter();
const catalogStore = useCatalogStore();
const shoppingStore = useShoppingStore();
const promotionStore = usePromotionStore();

const selectedProduct = ref<Product | null>(null);

onMounted(async () => {
  updatePageSeo('Beranda', 'Personal Shopping Assistant - Asisten Belanja Pribadi Serba Ada');
  await catalogStore.fetchCatalogData();
  await shoppingStore.fetchShoppingData();
  await promotionStore.loadCampaignBanners();
});

const selectCategory = (slug: string) => {
  catalogStore.selectedCategorySlug = slug;
  router.push('/catalog');
};

const openProductDetail = (product: Product) => {
  selectedProduct.value = product;
  catalogStore.trackRecentlyViewed(product.id);
};
</script>
