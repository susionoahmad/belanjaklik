<template>
  <nav class="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 md:hidden transition-colors duration-200">
    <div class="grid grid-cols-6 h-16 max-w-lg mx-auto">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex flex-col items-center justify-center text-xs font-medium transition-colors"
        :class="route.path === item.path ? 'text-brand-red font-bold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
      >
        <div class="relative">
          <component :is="item.icon" class="w-5 h-5 mb-0.5" />
          <span 
            v-if="item.badge" 
            class="absolute -top-1 -right-2 bg-brand-red text-white text-[9px] font-black px-1.5 py-0.5 rounded-full"
          >
            {{ item.badge }}
          </span>
        </div>
        <span class="text-[10px] tracking-tight truncate max-w-[55px] text-center">{{ item.label }}</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { Home, Grid, Package, Tag, Clock, Settings } from 'lucide-vue-next';
import { useCartStore } from '../../cart/stores/cartStore';

const route = useRoute();
const cartStore = useCartStore();

const navItems = computed(() => [
  { path: '/', label: 'Beranda', icon: Home },
  { path: '/catalog', label: 'Katalog', icon: Grid },
  { path: '/packages', label: 'Paket', icon: Package },
  { path: '/promos', label: 'Promo', icon: Tag },
  { path: '/orders', label: 'Pesanan', icon: Clock, badge: cartStore.totalItemCount > 0 ? `${cartStore.totalItemCount}` : null },
  { path: '/admin', label: 'Pengelola', icon: Settings }
]);
</script>
