<template>
  <div class="relative rounded-3xl overflow-hidden shadow-soft aspect-[21/9] sm:aspect-[25/8] bg-gray-900 group">
    <div 
      class="flex transition-transform duration-500 ease-out h-full"
      :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
    >
      <template v-for="banner in promotionStore.banners" :key="banner.id">
        <!-- External Affiliate Link -->
        <a 
          v-if="isExternalUrl(banner.target_url || banner.affiliate_link)"
          :href="banner.target_url || banner.affiliate_link"
          target="_blank"
          rel="noopener noreferrer"
          class="w-full h-full shrink-0 relative block group/slide overflow-hidden"
        >
          <img :src="banner.image_url" :alt="banner.title" class="absolute inset-0 w-full h-full object-cover filter blur-xl opacity-40 scale-110" />
          <div class="relative w-full h-full flex items-center justify-center">
            <img :src="banner.image_url" :alt="banner.title" class="w-full h-full object-cover object-top transition-transform duration-700 group-hover/slide:scale-105" />
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-5 sm:p-8 flex flex-col justify-end">
            <span class="text-[10px] font-black uppercase text-amber-400 tracking-wider mb-0.5 flex items-center gap-1">
              <span>Promo Kampanye Afiliasi</span>
              <span class="bg-emerald-500/80 text-white px-1.5 py-0.5 rounded text-[8px] font-bold">Link Resmi</span>
            </span>
            <h2 class="font-black text-lg sm:text-2xl text-white drop-shadow-md group-hover/slide:text-brand-red transition-colors">{{ banner.title }}</h2>
            <p class="text-xs sm:text-sm text-gray-200 mt-1 max-w-md line-clamp-1 font-semibold">{{ banner.subtitle }}</p>
          </div>
        </a>

        <!-- Internal Route Link -->
        <router-link 
          v-else
          :to="banner.target_url || `/campaign/${banner.slug || 'body-care-fair'}`"
          class="w-full h-full shrink-0 relative block group/slide overflow-hidden"
        >
          <img :src="banner.image_url" :alt="banner.title" class="absolute inset-0 w-full h-full object-cover filter blur-xl opacity-40 scale-110" />
          <div class="relative w-full h-full flex items-center justify-center">
            <img :src="banner.image_url" :alt="banner.title" class="w-full h-full object-cover object-top transition-transform duration-700 group-hover/slide:scale-105" />
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-5 sm:p-8 flex flex-col justify-end">
            <span class="text-[10px] font-black uppercase text-amber-400 tracking-wider mb-0.5">Promo Kampanye Resmi</span>
            <h2 class="font-black text-lg sm:text-2xl text-white drop-shadow-md group-hover/slide:text-brand-red transition-colors">{{ banner.title }}</h2>
            <p class="text-xs sm:text-sm text-gray-200 mt-1 max-w-md line-clamp-1 font-semibold">{{ banner.subtitle }}</p>
          </div>
        </router-link>
      </template>
    </div>

    <!-- Navigation Dots -->
    <div class="absolute bottom-3 right-4 flex items-center gap-1.5 z-10">
      <button
        v-for="(_, idx) in promotionStore.banners"
        :key="idx"
        @click="currentIndex = idx"
        class="w-2 h-2 rounded-full transition-all"
        :class="currentIndex === idx ? 'bg-brand-red w-5' : 'bg-white/50'"
      ></button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { usePromotionStore } from '../stores/promotionStore';

const promotionStore = usePromotionStore();
const currentIndex = ref(0);
let timer: any = null;

const isExternalUrl = (url?: string) => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

onMounted(() => {
  timer = setInterval(() => {
    if (promotionStore.banners.length > 0) {
      currentIndex.value = (currentIndex.value + 1) % promotionStore.banners.length;
    }
  }, 4000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>
