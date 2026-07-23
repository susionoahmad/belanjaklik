<template>
  <div class="space-y-3">
    <!-- Search Input -->
    <div class="relative">
      <Search class="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
      <input 
        v-model="catalogStore.searchQuery" 
        type="text" 
        placeholder="Cari minyak, beras, mie instan, sabun..." 
        class="w-full pl-11 pr-10 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-red outline-none shadow-sm transition-all"
      />
      <button 
        v-if="catalogStore.searchQuery" 
        @click="catalogStore.searchQuery = ''" 
        class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Category Chips & Sort Controls -->
    <div class="flex items-center gap-2 overflow-x-auto sm:flex-wrap pb-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
      <button 
        @click="catalogStore.selectedCategorySlug = null" 
        class="px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border shrink-0"
        :class="catalogStore.selectedCategorySlug === null ? 'bg-brand-red text-white border-brand-red shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-red/50'"
      >
        Semua
      </button>

      <button 
        v-for="cat in catalogStore.categories" 
        :key="cat.id" 
        @click="catalogStore.selectedCategorySlug = cat.slug" 
        class="px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 shrink-0"
        :class="catalogStore.selectedCategorySlug === cat.slug ? 'bg-brand-red text-white border-brand-red shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-red/50'"
      >
        <span>{{ cat.name }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, X } from 'lucide-vue-next';
import { useCatalogStore } from '../stores/catalogStore';

const catalogStore = useCatalogStore();
</script>
