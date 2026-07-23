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

    <!-- Slide-over Cart Drawer -->
    <CartDrawer />

    <!-- Bottom Navigation Bar for Mobile -->
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import AppHeader from './features/shared/components/AppHeader.vue';
import BottomNav from './features/shared/components/BottomNav.vue';
import CartDrawer from './features/cart/components/CartDrawer.vue';
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
