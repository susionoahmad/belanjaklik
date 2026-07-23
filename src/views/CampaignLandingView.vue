<template>
  <div class="space-y-6 pb-24 max-w-5xl mx-auto">
    <!-- Back to Catalog Nav -->
    <div class="flex items-center justify-between">
      <router-link to="/promos" class="inline-flex items-center gap-1.5 text-xs font-extrabold text-gray-600 dark:text-gray-300 hover:text-brand-red">
        <ArrowLeft class="w-4 h-4" />
        <span>Kembali Ke Semua Promo</span>
      </router-link>

      <span v-if="campaign" class="text-[10px] font-mono px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 font-extrabold border border-emerald-200">
        ● Kampanye Aktif Resmi
      </span>
    </div>

    <!-- Campaign Hero Banner & Countdown Timer Header -->
    <div v-if="campaign" class="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-900 via-brand-red-dark to-gray-900 text-white p-6 sm:p-10 space-y-4">
      <!-- Ambient Backdrop Blur -->
      <img v-if="campaign.desktop_banner || campaign.banner_image" :src="campaign.desktop_banner || campaign.banner_image" class="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-xl" />

      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-2 max-w-xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-red text-white text-xs font-black uppercase tracking-wider w-fit">
            <Sparkles class="w-3.5 h-3.5" />
            <span>{{ campaign.campaign_type }} • Kampanye Resmi</span>
          </div>
          <h1 class="font-black text-2xl sm:text-4xl text-white drop-shadow-md leading-tight">{{ campaign.title }}</h1>
          <p class="text-xs sm:text-sm text-gray-200 font-semibold leading-relaxed">{{ campaign.subtitle || campaign.description }}</p>

          <!-- Countdown Timer -->
          <div class="mt-4 flex flex-wrap items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 w-fit">
            <div class="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Clock class="w-4 h-4 animate-pulse" />
              <span>Berakhir Dalam:</span>
            </div>

            <div class="flex items-center gap-1.5 text-center font-mono text-sm font-black text-white">
              <div class="bg-black/60 px-2.5 py-1 rounded-xl">{{ countdown.days }}d</div> :
              <div class="bg-black/60 px-2.5 py-1 rounded-xl">{{ countdown.hours }}h</div> :
              <div class="bg-black/60 px-2.5 py-1 rounded-xl">{{ countdown.minutes }}m</div> :
              <div class="bg-black/60 px-2.5 py-1 rounded-xl text-amber-400">{{ countdown.seconds }}s</div>
            </div>
          </div>
        </div>

        <!-- View Full Flyer Button -->
        <div v-if="campaign.desktop_banner || campaign.banner_image" class="shrink-0 flex flex-col items-center gap-2">
          <button
            @click="showFlyerModal = true"
            class="bg-white hover:bg-gray-100 text-gray-900 font-extrabold px-5 py-3 rounded-2xl shadow-lg text-xs transition-all flex items-center gap-2 group hover:scale-105"
          >
            <FileImage class="w-4 h-4 text-brand-red group-hover:rotate-12 transition-transform" />
            <span>Lihat Brosur Flyer Utuh</span>
          </button>
          <span class="text-[10px] text-gray-300 font-semibold">Klik untuk melihat brosur flyer asli</span>
        </div>
      </div>
    </div>

    <!-- Promotional Products Grid Section -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-extrabold text-lg text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag class="w-5 h-5 text-brand-red" />
            <span>Produk Promo Spesial Kampanye</span>
          </h2>
          <p class="text-xs text-gray-500">Dapatkan diskon promo langsung selama periode kampanye berlangsung</p>
        </div>

        <span class="text-xs font-bold text-gray-500">{{ promoProducts.length }} Produk Promo</span>
      </div>

      <div v-if="promoProducts.length > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <ProductCard
          v-for="product in promoProducts"
          :key="product.id"
          :product="product"
          @select="openProductDetail"
        />
      </div>

      <div v-else class="p-8 text-center bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 text-gray-400 font-semibold text-xs">
        Belum ada produk terhubung pada kampanye ini.
      </div>
    </section>

    <!-- Terms & Conditions Accordion Card -->
    <section v-if="campaign?.terms_conditions" class="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 space-y-2 shadow-soft">
      <h3 class="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
        <FileText class="w-4 h-4 text-brand-blue" />
        <span>Syarat & Ketentuan Kampanye</span>
      </h3>
      <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-semibold">
        {{ campaign.terms_conditions }}
      </p>
    </section>

    <!-- Full Flyer Lightbox Modal -->
    <div v-if="showFlyerModal && campaign" class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" @click.self="showFlyerModal = false">
      <div class="relative max-w-3xl w-full max-h-[90vh] bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        <div class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h3 class="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <FileImage class="w-4 h-4 text-brand-red" />
            <span>Brosur Flyer Promo Utuh: {{ campaign.title }}</span>
          </h3>
          <button @click="showFlyerModal = false" class="text-gray-400 hover:text-gray-600 font-extrabold text-lg">&times;</button>
        </div>

        <div class="p-4 overflow-y-auto flex items-center justify-center bg-gray-100 dark:bg-gray-950 min-h-[400px]">
          <img :src="campaign.desktop_banner || campaign.banner_image" class="max-w-full max-h-[75vh] object-contain rounded-xl shadow-lg" :alt="campaign.title" />
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowLeft, Sparkles, Clock, ShoppingBag, FileText, FileImage } from 'lucide-vue-next';
import type { Product } from '../features/shared/types';
import type { PromotionCampaign } from '../features/promotions/types/campaignTypes';
import { dataService } from '../features/shared/db/dataService';
import { updatePageSeo } from '../features/shared/utils/seo';
import ProductCard from '../features/catalog/components/ProductCard.vue';
import ProductDetailModal from '../features/catalog/components/ProductDetailModal.vue';
import { useCatalogStore } from '../features/catalog/stores/catalogStore';

import { SEOMarketingGenerator } from '../features/promotions/engine/SEOMarketingGenerator';

const route = useRoute();
const catalogStore = useCatalogStore();

const campaign = ref<PromotionCampaign | null>(null);
const promoProducts = ref<Product[]>([]);
const selectedProduct = ref<Product | null>(null);
const showFlyerModal = ref(false);

const countdown = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 });
let timerInterval: any = null;

const startCountdown = (endDateStr: string) => {
  const updateTimer = () => {
    const target = new Date(`${endDateStr}T23:59:59`).getTime();
    const now = new Date().getTime();
    const diff = Math.max(0, target - now);

    countdown.value = {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000)
    };
  };

  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
};

onMounted(async () => {
  const slug = route.params.slug as string;
  await catalogStore.fetchCatalogData();
  
  const campaigns = await dataService.fetchPromotionCampaigns();
  const matchedCamp = campaigns.find((c: any) => c.slug === slug || c.id === slug) || campaigns[0];

  if (matchedCamp) {
    campaign.value = matchedCamp;
    const seoMeta = SEOMarketingGenerator.generateMeta(matchedCamp);
    updatePageSeo(seoMeta.seo_title, seoMeta.meta_description);
    
    // Inject JSON-LD Schema.org script
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(seoMeta.json_ld_schema);
    document.head.appendChild(script);

    startCountdown(matchedCamp.end_date);

    // Fetch promotional products belonging to this campaign
    const pProducts = await dataService.fetchPromotionProducts(matchedCamp.id);
    const prodIds = pProducts.map((p: any) => p.product_id);
    
    // Filter matching catalog products
    promoProducts.value = catalogStore.products.filter(p => prodIds.includes(p.id) || p.is_promo);
  }
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

const openProductDetail = (prod: Product) => {
  selectedProduct.value = prod;
};
</script>
