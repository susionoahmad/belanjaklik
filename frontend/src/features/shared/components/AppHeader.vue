<template>
  <header class="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 gap-3">
        <!-- Logo & Branding -->
        <router-link to="/" class="flex items-center gap-2.5 shrink-0 group">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-red to-brand-red-dark text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
            <ShoppingBag class="w-5 h-5" />
          </div>
          <div>
            <h1 class="font-extrabold text-base sm:text-lg leading-tight tracking-tight text-gray-900 dark:text-white flex items-center gap-1.5">
              Personal Shopping <span class="text-brand-red">Assistant</span>
            </h1>
            <p class="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Asisten Belanja Pribadi Serba Ada</p>
          </div>
        </router-link>

        <!-- Right Action Controls -->
        <div class="flex items-center gap-2">
          <!-- Online/Offline Badge -->
          <div 
            :class="isOnline ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800'"
            class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
          >
            <span class="relative flex h-2 w-2">
              <span v-if="isOnline" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span :class="isOnline ? 'bg-emerald-500' : 'bg-amber-500'" class="relative inline-flex rounded-full h-2 w-2"></span>
            </span>
            <span>{{ isOnline ? 'Online' : 'Offline (Cache)' }}</span>
          </div>

          <!-- Dark Mode Toggle -->
          <button
            @click="toggleDark()"
            class="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Toggle Theme"
          >
            <Sun v-if="isDark" class="w-5 h-5 text-amber-400" />
            <Moon v-else class="w-5 h-5 text-gray-600" />
          </button>

          <!-- Cart Drawer Button (Sticky Trigger) -->
          <button
            @click="cartStore.toggleCartDrawer()"
            class="relative p-2.5 rounded-xl bg-brand-red/10 text-brand-red hover:bg-brand-red hover:text-white transition-all duration-200 flex items-center justify-center"
            title="Keranjang Belanja"
          >
            <ShoppingCart class="w-5 h-5" />
            <span
              v-if="cartStore.totalItemCount > 0"
              class="absolute -top-1.5 -right-1.5 bg-brand-red text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 animate-pulse"
            >
              {{ cartStore.totalItemCount }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core';
import { ShoppingBag, ShoppingCart, Sun, Moon } from 'lucide-vue-next';
import { useOnlineStatus } from '../composables/useOnlineStatus';
import { useCartStore } from '../../cart/stores/cartStore';

const isDark = useDark();
const toggleDark = useToggle(isDark);
const { isOnline } = useOnlineStatus();
const cartStore = useCartStore();
</script>
