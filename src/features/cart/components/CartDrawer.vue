<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div 
        v-if="cartStore.isDrawerOpen" 
        class="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-800"
      >
        <!-- Drawer Header -->
        <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
          <div class="flex items-center gap-2">
            <div class="p-2 bg-brand-red/10 text-brand-red rounded-xl">
              <ShoppingCart class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-extrabold text-base text-gray-900 dark:text-white">Keranjang Belanja</h3>
              <p class="text-[11px] text-gray-500">{{ cartStore.totalItemCount }} produk dipilih</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button 
              v-if="cartStore.items.length > 0" 
              @click="cartStore.clearCart()" 
              class="text-xs text-red-500 hover:underline font-semibold px-2 py-1"
            >
              Kosongkan
            </button>
            <button 
              @click="cartStore.isDrawerOpen = false" 
              class="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Fulfillment Channel Selector -->
        <div class="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/40 dark:to-gray-800/20 border-b border-gray-100 dark:border-gray-800">
          <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
            <span>Pilih Channel Pemenuhan:</span>
            <span class="text-[10px] text-brand-blue dark:text-blue-400 font-normal">Fleksibel</span>
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="ch in channels"
              :key="ch.id"
              @click="cartStore.setFulfillmentChannel(ch)"
              class="p-2 rounded-xl text-left border text-xs font-semibold flex items-center gap-2 transition-all"
              :class="cartStore.selectedChannel?.id === ch.id ? 'bg-brand-red text-white border-brand-red shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-brand-red/50'"
            >
              <Store class="w-3.5 h-3.5 shrink-0" />
              <span class="truncate">{{ ch.name }}</span>
            </button>
          </div>
        </div>

        <!-- Cart Items List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          <div v-if="cartStore.items.length === 0" class="flex flex-col items-center justify-center h-64 text-center">
            <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mb-3">
              <ShoppingBag class="w-8 h-8" />
            </div>
            <h4 class="font-bold text-gray-900 dark:text-white text-sm">Keranjang Anda Masih Kosong</h4>
            <p class="text-xs text-gray-500 mt-1 max-w-xs">Pilih produk berkualitas dari katalog atau gunakan Paket Hemat instan.</p>
          </div>

          <CartItemRow 
            v-for="item in cartStore.items" 
            :key="item.product.id" 
            :item="item" 
          />
        </div>

        <!-- Cart Footer -->
        <div v-if="cartStore.items.length > 0" class="p-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3">
          <!-- Savings Banner -->
          <div v-if="cartStore.totalSavings > 0" class="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs px-3 py-2 rounded-xl font-bold flex items-center justify-between border border-emerald-200 dark:border-emerald-800">
            <span>Hemat Promo:</span>
            <span>-{{ formatRupiah(cartStore.totalSavings) }}</span>
          </div>

          <!-- Total Calculation -->
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500 dark:text-gray-400 font-medium">Estimasi Subtotal:</span>
            <span class="font-black text-lg text-gray-900 dark:text-white">{{ formatRupiah(cartStore.subtotal) }}</span>
          </div>

          <!-- Action Buttons -->
          <button 
            @click="handleCheckoutClick" 
            class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all text-sm"
          >
            <Send class="w-5 h-5" />
            <span>Kirim Pesanan Ke WhatsApp</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Delivery Form Modal -->
  <DeliveryFormModal />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ShoppingCart, ShoppingBag, X, Store, Send } from 'lucide-vue-next';
import type { FulfillmentChannel } from '../../shared/types';
import { formatRupiah } from '../../shared/utils/formatters';
import { dataService } from '../../shared/db/dataService';
import { useCartStore } from '../stores/cartStore';
import CartItemRow from './CartItemRow.vue';
import DeliveryFormModal from './DeliveryFormModal.vue';

const cartStore = useCartStore();
const channels = ref<FulfillmentChannel[]>([]);

onMounted(async () => {
  channels.value = await dataService.fetchFulfillmentChannels();
  if (channels.value.length > 0 && !cartStore.selectedChannel) {
    cartStore.setFulfillmentChannel(channels.value[0]);
  }
});

const handleCheckoutClick = () => {
  if (!cartStore.customer.customer_name || !cartStore.customer.delivery_address) {
    cartStore.isDeliveryFormOpen = true;
  } else {
    cartStore.checkoutWhatsApp();
  }
};
</script>
