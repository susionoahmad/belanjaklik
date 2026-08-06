<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
      <div class="flex items-center justify-between">
        <h3 class="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
          <Send class="w-5 h-5 text-brand-red" />
          <span>Konfirmasi Publikasi Katalog</span>
        </h3>
        <button @click="$emit('close')" class="p-1 text-gray-400 hover:text-gray-600 rounded-full">
          <X class="w-5 h-5" />
        </button>
      </div>

      <p class="text-xs text-gray-500">
        Anda akan mempublikasikan hasil deteksi screenshot ke dalam katalog produk resmi Alfamind (Supabase & IndexedDB).
      </p>

      <div class="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-2 text-xs">
        <div class="flex justify-between font-bold">
          <span class="text-gray-600 dark:text-gray-300">Total Produk Disetujui:</span>
          <span class="text-gray-900 dark:text-white font-extrabold">{{ approvedItems.length }} Produk</span>
        </div>

        <div class="flex justify-between font-semibold text-emerald-600">
          <span>Produk Baru Dibuat:</span>
          <span>{{ createCount }} Produk</span>
        </div>

        <div class="flex justify-between font-semibold text-blue-600">
          <span>Produk Eksisting Diperbarui:</span>
          <span>{{ updateCount }} Produk</span>
        </div>

        <div class="flex justify-between font-semibold text-gray-400">
          <span>Produk Diabaikan:</span>
          <span>{{ ignoredCount }} Produk</span>
        </div>
      </div>

      <div class="flex gap-2 pt-2">
        <button @click="$emit('close')" class="flex-1 py-2.5 rounded-xl font-bold text-xs border border-gray-200 text-gray-600 hover:bg-gray-50">
          Batal
        </button>
        <button 
          @click="$emit('confirm')" 
          :disabled="isPublishing"
          class="flex-1 py-2.5 rounded-xl font-extrabold text-xs bg-brand-red hover:bg-brand-red-dark text-white shadow-md flex items-center justify-center gap-1.5"
        >
          <span v-if="isPublishing" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <span>{{ isPublishing ? 'Mempublikasikan...' : 'Publikasikan Sekarang' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Send, X } from 'lucide-vue-next';
import type { ReviewItem } from '../types';

const props = defineProps<{
  isOpen: boolean;
  reviewItems: ReviewItem[];
  isPublishing: boolean;
}>();

defineEmits(['close', 'confirm']);

const approvedItems = computed(() => props.reviewItems.filter(i => i.action !== 'IGNORE'));
const createCount = computed(() => props.reviewItems.filter(i => i.action === 'CREATE_PRODUCT').length);
const updateCount = computed(() => props.reviewItems.filter(i => i.action === 'ACCEPT' || i.action === 'EDIT' || i.action === 'MERGE_PRODUCT').length);
const ignoredCount = computed(() => props.reviewItems.filter(i => i.action === 'IGNORE').length);
</script>
