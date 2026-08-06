<template>
  <div class="space-y-5 pb-20">
    <div>
      <h1 class="font-extrabold text-xl sm:text-2xl text-gray-900 dark:text-white">Riwayat & Ulangi Pesanan</h1>
      <p class="text-xs text-gray-500">Ulangi belanjaan sebelumnya dalam satu sentuhan cepat</p>
    </div>

    <div v-if="shoppingStore.requestHistory.length > 0" class="space-y-3">
      <OrderHistoryCard 
        v-for="req in shoppingStore.requestHistory" 
        :key="req.id" 
        :request="req" 
      />
    </div>

    <div v-else class="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
      <div class="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-brand-blue mx-auto mb-3">
        <Clock class="w-8 h-8" />
      </div>
      <h3 class="font-bold text-gray-900 dark:text-white text-base">Belum Ada Riwayat Pesanan</h3>
      <p class="text-xs text-gray-500 mt-1 max-w-xs mx-auto">Pesanan yang Anda kirim via WhatsApp akan tersimpan otomatis untuk memudahkan pemesanan ulang.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { Clock } from 'lucide-vue-next';
import { updatePageSeo } from '../features/shared/utils/seo';
import OrderHistoryCard from '../features/shopping/components/OrderHistoryCard.vue';
import { useShoppingStore } from '../features/shopping/stores/shoppingStore';

const shoppingStore = useShoppingStore();

onMounted(async () => {
  updatePageSeo('Riwayat Pesanan', 'Ulangi pesanan sebelumnya.');
  await shoppingStore.fetchShoppingData();
});
</script>
