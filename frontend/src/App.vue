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

    <!-- Bottom Navigation Bar for Mobile (Hidden Admin Menu - Pure User Nav) -->
    <BottomNav />

    <!-- Secret Admin Access Modal -->
    <AdminSecretModal />

    <!-- Secret Tap Toast Hint -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div v-if="hintMessage" class="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white font-extrabold text-xs px-4 py-2 rounded-full shadow-xl border border-slate-700 flex items-center gap-2 pointer-events-none">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span>{{ hintMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useHead } from '@unhead/vue';
import AppHeader from './features/shared/components/AppHeader.vue';
import AppFooter from './features/shared/components/AppFooter.vue';
import BottomNav from './features/shared/components/BottomNav.vue';
import CartDrawer from './features/cart/components/CartDrawer.vue';
import AdminSecretModal from './features/admin/components/AdminSecretModal.vue';
import { useSecretAdminAccess } from './features/admin/composables/useSecretAdminAccess';

const { hintMessage } = useSecretAdminAccess();

useHead({
  title: 'BelanjaKlik',
  meta: [
    { name: 'description', content: 'BelanjaKlik - Asisten belanja pribadi serba ada untuk pemesanan sembako & kebutuhan harian.' },
    { property: 'og:title', content: 'BelanjaKlik' },
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
