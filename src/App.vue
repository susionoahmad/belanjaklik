<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col font-sans selection:bg-brand-red selection:text-white transition-colors duration-200">
    <!-- App Header -->
    <AppHeader />

    <!-- Main View Slot -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Global App Footer (Accesstrade Publisher Compliance) -->
    <AppFooter />

    <!-- Slide-over Cart Drawer -->
    <CartDrawer />

    <!-- Bottom Navigation Bar for Mobile -->
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { useHead } from '@unhead/vue';
import AppHeader from './features/shared/components/AppHeader.vue';
import AppFooter from './features/shared/components/AppFooter.vue';
import BottomNav from './features/shared/components/BottomNav.vue';
import CartDrawer from './features/cart/components/CartDrawer.vue';

useHead({
  title: 'Personal Shopping Assistant',
  meta: [
    { name: 'description', content: 'Personal Shopping Assistant - Asisten belanja pribadi serba ada untuk pemesanan sembako & kebutuhan harian.' },
    { property: 'og:title', content: 'Personal Shopping Assistant' },
    { property: 'og:description', content: 'Pesan sembako & kebutuhan harian dengan cepat via WhatsApp.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: '/icon-512.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
});
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
