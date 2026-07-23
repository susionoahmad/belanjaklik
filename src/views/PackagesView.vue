<template>
  <div class="space-y-5 pb-20">
    <div>
      <h1 class="font-extrabold text-xl sm:text-2xl text-gray-900 dark:text-white">Paket Belanja Hemat</h1>
      <p class="text-xs text-gray-500">Pilihan paket bundel praktis siap masuk keranjang sekali tekan</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <PackageCard 
        v-for="template in shoppingStore.templates" 
        :key="template.id" 
        :template="template" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { updatePageSeo } from '../features/shared/utils/seo';
import PackageCard from '../features/shopping/components/PackageCard.vue';
import { useShoppingStore } from '../features/shopping/stores/shoppingStore';

const shoppingStore = useShoppingStore();

onMounted(async () => {
  updatePageSeo('Paket Belanja Hemat', 'Bundel belanja praktis murah.');
  await shoppingStore.fetchShoppingData();
});
</script>
