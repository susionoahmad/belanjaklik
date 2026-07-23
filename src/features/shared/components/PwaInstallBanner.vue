<template>
  <div v-if="canInstall && !dismissed" class="bg-gradient-to-r from-brand-red to-brand-red-dark text-white p-3 sm:p-4 rounded-2xl shadow-floating mb-6 flex items-center justify-between gap-3">
    <div class="flex items-center gap-3">
      <div class="p-2.5 bg-white/20 backdrop-blur-md rounded-xl shrink-0">
        <Download class="w-6 h-6 text-white" />
      </div>
      <div>
        <h4 class="font-bold text-sm leading-snug">Install Aplikasi Belanja</h4>
        <p class="text-xs text-white/90">Akses cepat tanpa browser, bekerja offline & hemat kuota.</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button 
        @click="installPwa"
        class="bg-white text-brand-red font-bold text-xs px-3.5 py-2 rounded-xl hover:bg-gray-100 transition-colors shadow-sm whitespace-nowrap"
      >
        Install
      </button>
      <button @click="dismissed = true" class="text-white/80 hover:text-white p-1">
        <X class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Download, X } from 'lucide-vue-next';
import { usePwaInstall } from '../composables/usePwaInstall';

const { canInstall, installPwa } = usePwaInstall();
const dismissed = ref(false);
</script>
