<template>
  <div class="relative rounded-3xl overflow-hidden shadow-soft aspect-[21/9] sm:aspect-[25/8] bg-gray-900 group">
    <div 
      class="flex transition-transform duration-500 ease-out h-full"
      :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
    >
      <router-link 
        v-for="banner in promotionStore.banners" 
        :key="banner.id"
        :to="banner.target_url || `/campaign/${banner.slug || 'body-care-fair'}`"
        class="w-full h-full shrink-0 relative block group/slide overflow-hidden"
      >
        <!-- Blurred Backdrop for aesthetic color matching -->
        <img :src="banner.image_url" :alt="banner.title" class="absolute inset-0 w-full h-full object-cover filter blur-xl opacity-40 scale-110" />

        <!-- Crisp Banner / Flyer Image -->
        <div class="relative w-full h-full flex items-center justify-center">
          <img :src="banner.image_url" :alt="banner.title" class="w-full h-full object-cover object-top transition-transform duration-700 group-hover/slide:scale-105" />
        </div>

        <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-5 sm:p-8 flex flex-col justify-end">
          <span class="text-[10px] font-black uppercase text-amber-400 tracking-wider mb-0.5">Promo Kampanye Resmi</span>
          <h2 class="font-black text-lg sm:text-2xl text-white drop-shadow-md group-hover/slide:text-brand-red transition-colors">{{ banner.title }}</h2>
          <p class="text-xs sm:text-sm text-gray-200 mt-1 max-w-md line-clamp-1 font-semibold">{{ banner.subtitle }}</p>
        </div>
      </router-link>
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
