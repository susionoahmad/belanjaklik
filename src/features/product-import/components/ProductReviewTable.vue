<template>
  <div class="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-soft space-y-3 p-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
          <CheckSquare class="w-5 h-5 text-emerald-600" />
          <span>Review Queue Hasil Deteksi Impor</span>
        </h3>
        <p class="text-xs text-gray-500">Tinjau & koreksi produk sebelum dipublikasikan ke katalog resmi Supabase / IndexedDB.</p>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-xs font-extrabold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-200">
          {{ reviewItems.length }} Produk Siap Ditinjau
        </span>
      </div>
    </div>

    <!-- Review Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
          <tr>
            <th class="p-3">Produk & Crop</th>
            <th class="p-3">Hasil OCR vs AI Correction</th>
            <th class="p-3">Harga Impor</th>
            <th class="p-3">Match Status & Confidence</th>
            <th class="p-3">AI Rekomendasi Kategori</th>
            <th class="p-3 text-right">Keputusan Administrator</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr 
            v-for="item in reviewItems" 
            :key="item.id"
            class="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
            :class="item.action === 'IGNORE' ? 'opacity-40 line-through bg-gray-50/70' : ''"
          >
            <!-- Product & Crop Image -->
            <td class="p-3 flex items-center gap-2.5 min-w-[200px]">
              <img 
                :src="item.card.cropImageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150'" 
                alt="Crop" 
                class="w-12 h-12 object-cover rounded-xl border border-gray-200 shrink-0 shadow-sm"
              />
              <div>
                <input 
                  v-model="item.card.aiCorrectedData!.corrected_name" 
                  type="text" 
                  class="font-bold text-gray-900 dark:text-white bg-transparent border-b border-dashed border-gray-300 focus:border-brand-red outline-none text-xs w-full"
                />
                <div class="text-[10px] text-gray-400 font-mono mt-0.5">
                  Brand: {{ item.card.aiCorrectedData?.corrected_brand || 'Umum' }} • Size: {{ item.card.normalizedData?.normalized_size || 'pcs' }}
                </div>
              </div>
            </td>

            <!-- Raw OCR vs AI Correction -->
            <td class="p-3 min-w-[180px]">
              <div class="text-[11px] font-mono text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/50 p-1.5 rounded-lg">
                <span class="font-extrabold text-[9px] uppercase tracking-wider block text-emerald-700">AI Corrected:</span>
                {{ item.card.aiCorrectedData?.corrected_name }}
              </div>
              <div class="text-[10px] text-gray-400 font-mono mt-1">
                <span class="font-semibold text-gray-500">Raw OCR:</span> {{ item.card.rawOcrText?.split('\n')[0] }}
              </div>
            </td>

            <!-- Price (With Strikethrough Price / Harga Coret Detection) -->
            <td class="p-3 min-w-[140px]">
              <div class="font-extrabold text-brand-red text-xs flex items-center gap-1">
                <span>Rp {{ (item.card.normalizedData?.normalized_price || 0).toLocaleString('id-ID') }}</span>
                <span v-if="item.card.normalizedData?.original_price" class="text-[9px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-extrabold px-1.5 py-0.5 rounded-md border border-red-200">
                  PROMO
                </span>
              </div>
              
              <!-- Strikethrough Price (Harga Coret) -->
              <div v-if="item.card.normalizedData?.original_price" class="flex items-center gap-1.5 mt-0.5">
                <span class="text-[10px] text-gray-400 font-mono line-through">
                  Rp {{ item.card.normalizedData.original_price.toLocaleString('id-ID') }}
                </span>
                <span v-if="item.card.normalizedData?.discount_percentage" class="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1 rounded">
                  -{{ item.card.normalizedData.discount_percentage }}%
                </span>
              </div>
              
              <div v-if="item.card.normalizedData?.has_strikethrough_price" class="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-0.5">
                <span>🔥 Terdeteksi Harga Coret</span>
              </div>
            </td>

            <!-- Match Status & Confidence -->
            <td class="p-3 min-w-[190px]">
              <div class="flex items-center gap-1.5">
                <span 
                  v-if="item.card.matchResult?.candidateProduct"
                  class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800"
                >
                  {{ item.card.matchResult?.confidence || 0 }}% Match Katalog
                </span>
                <span 
                  v-else
                  class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-200"
                >
                  UNMATCHED (Produk Baru)
                </span>
              </div>
              <div class="text-[10px] font-bold mt-1" :class="item.card.matchResult?.candidateProduct ? 'text-gray-700 dark:text-gray-300' : 'text-blue-600 dark:text-blue-400'">
                {{ item.card.matchResult?.candidateProduct ? `Matched: ${item.card.matchResult.candidateProduct.name}` : '✨ Produk Baru Siap Ditambahkan' }}
              </div>
              <div v-if="item.card.matchResult?.matchReason?.notes?.length" class="text-[9px] text-gray-400 italic mt-0.5">
                {{ item.card.matchResult.matchReason.notes[0] }}
              </div>
            </td>

            <!-- AI Category Recommendation (Promo Merchant Category) -->
            <td class="p-3 min-w-[160px]">
              <div class="text-[11px] font-bold" :class="item.card.aiCategoryRecommendation?.category === 'Promo Merchant' ? 'text-brand-red font-black' : 'text-gray-700 dark:text-gray-300'">
                {{ item.card.aiCategoryRecommendation?.category }}
              </div>
              <div class="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                {{ item.card.aiCategoryRecommendation?.subcategory }}
              </div>
              <div class="text-[9px] text-gray-400 font-mono mt-0.5">
                Shelf: {{ item.card.aiCategoryRecommendation?.shelf_group }}
              </div>
            </td>

            <!-- Action Buttons -->
            <td class="p-3 text-right whitespace-nowrap min-w-[210px]">
              <div class="flex items-center justify-end gap-1.5">
                <button 
                  @click="item.action = 'CREATE_PRODUCT'" 
                  class="px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all flex items-center gap-1 shadow-sm"
                  :class="item.action === 'CREATE_PRODUCT' ? 'bg-brand-blue text-white shadow-md ring-2 ring-blue-300' : 'bg-gray-100 text-gray-700 hover:bg-blue-100'"
                >
                  <span>+ Produk Baru</span>
                </button>

                <button 
                  v-if="item.card.matchResult?.candidateProduct"
                  @click="item.action = 'ACCEPT'" 
                  class="px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all"
                  :class="item.action === 'ACCEPT' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-emerald-100'"
                >
                  Update Eksisting
                </button>

                <button 
                  @click="item.action = 'IGNORE'" 
                  class="px-2 py-1 rounded-xl text-[10px] font-bold transition-all"
                  :class="item.action === 'IGNORE' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600'"
                >
                  Abaikan
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckSquare } from 'lucide-vue-next';
import type { ReviewItem } from '../types';

const props = defineProps<{
  reviewItems: ReviewItem[];
}>();
</script>
