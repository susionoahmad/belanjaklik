<template>
  <div class="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
        <Eye class="w-4 h-4 text-brand-blue" />
        <span>Deteksi AI Vision & Bound Layout</span>
      </h3>
      <span class="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 rounded-full">
        {{ cards.length }} Product Cards Deteksi
      </span>
    </div>

    <!-- Canvas Simulation Container -->
    <div class="relative w-full max-w-sm mx-auto aspect-[9/16] bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 shadow-lg">
      <img :src="imageSrc" alt="Screenshot Preview" class="w-full h-full object-cover opacity-90" />

      <!-- Ignored Top Header Area -->
      <div class="absolute top-0 inset-x-0 h-[14%] bg-red-500/25 border-b border-red-400 backdrop-blur-[1px] flex items-center justify-center z-10 pointer-events-none">
        <span class="text-[10px] font-extrabold text-red-100 uppercase tracking-widest bg-red-950/90 px-2 py-0.5 rounded shadow">
          IGNORED HEADER & SEARCH BAR
        </span>
      </div>

      <!-- Detected Product Card Bounding Boxes -->
      <div 
        v-for="(card, idx) in cards" 
        :key="card.id"
        class="absolute border-2 border-emerald-400 bg-emerald-500/15 rounded-xl transition-all hover:bg-emerald-500/30 flex flex-col justify-between p-1.5 shadow-md z-0"
        :style="getCardStyle(idx)"
      >
        <div class="flex items-center justify-between">
          <span class="text-[9px] font-extrabold bg-emerald-600 text-white px-1.5 py-0.5 rounded shadow">
            Card #{{ idx + 1 }}
          </span>
          <span class="text-[9px] font-bold text-emerald-200 bg-black/70 px-1.5 py-0.5 rounded">
            {{ card.confidence }}%
          </span>
        </div>

        <div class="text-[8px] font-extrabold text-white bg-black/80 px-1.5 py-0.5 rounded truncate shadow">
          {{ card.aiCorrectedData?.corrected_name || card.normalizedData?.normalized_name || 'Detecting...' }}
        </div>
      </div>

      <!-- Ignored Bottom Navigation Area -->
      <div class="absolute bottom-0 inset-x-0 h-[12%] bg-red-500/25 border-t border-red-400 backdrop-blur-[1px] flex items-center justify-center z-10 pointer-events-none">
        <span class="text-[10px] font-extrabold text-red-100 uppercase tracking-widest bg-red-950/90 px-2 py-0.5 rounded shadow">
          IGNORED BOTTOM NAV & CART
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Eye } from 'lucide-vue-next';
import type { DetectedCard } from '../types';

const props = defineProps<{
  imageSrc: string;
  cards: DetectedCard[];
}>();

const getCardStyle = (idx: number) => {
  const card = props.cards[idx];
  if (card?.boundingBox) {
    // Reference resolution 800 x 1400
    const left = (card.boundingBox.x / 800) * 100;
    const top = (card.boundingBox.y / 1400) * 100;
    const width = (card.boundingBox.width / 800) * 100;
    const height = (card.boundingBox.height / 1400) * 100;
    return {
      top: `${top}%`,
      left: `${left}%`,
      width: `${width}%`,
      height: `${height}%`
    };
  }

  const row = Math.floor(idx / 2);
  const col = idx % 2;
  const top = row === 0 ? 16.7 : 50.5;
  const left = 2 + col * 48;
  return {
    top: `${top}%`,
    left: `${left}%`,
    width: '46%',
    height: '32%'
  };
};
</script>
