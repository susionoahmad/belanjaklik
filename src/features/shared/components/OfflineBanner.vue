<template>
  <div v-if="!isOnline" class="bg-amber-500 text-white text-xs font-semibold px-4 py-2 text-center flex items-center justify-center gap-2 shadow-inner">
    <WifiOff class="w-4 h-4 shrink-0 animate-bounce" />
    <span>Anda sedang dalam Mode Offline. Katalog & Keranjang berjalan lancar dari Cache Lokal (IndexedDB).</span>
  </div>
</template>

<script setup lang="ts">
import { WifiOff } from 'lucide-vue-next';
import { useOnlineStatus } from '../composables/useOnlineStatus';

const { isOnline } = useOnlineStatus();
</script>
