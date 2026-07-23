<template>
  <Modal :isOpen="cartStore.isDeliveryFormOpen" title="Informasi Pemesan & Pengiriman" @close="cartStore.isDeliveryFormOpen = false">
    <form @submit.prevent="handleSubmit" class="space-[#16px] space-y-4">
      <!-- Customer Name -->
      <div>
        <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nama Pemesan *</label>
        <input 
          v-model="cartStore.customer.customer_name" 
          type="text" 
          required 
          placeholder="Contoh: Ibu Rina" 
          class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-red outline-none"
        />
      </div>

      <!-- Phone Number -->
      <div>
        <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">No WhatsApp / HP *</label>
        <input 
          v-model="cartStore.customer.customer_phone" 
          type="tel" 
          required 
          placeholder="08123456789" 
          class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-red outline-none"
        />
      </div>

      <!-- Delivery Address -->
      <div>
        <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Alamat Lengkap Pengiriman *</label>
        <textarea 
          v-model="cartStore.customer.delivery_address" 
          rows="3" 
          required 
          placeholder="Jl. Mawar No. 12 RT 03/05, Kel. Melati, Jakarta" 
          class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-red outline-none"
        ></textarea>
      </div>

      <!-- Preferred Delivery Time -->
      <div>
        <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Waktu Pengiriman</label>
        <select 
          v-model="cartStore.customer.preferred_delivery_time" 
          class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-red outline-none"
        >
          <option value="Pagi (08:00 - 11:00)">Pagi (08:00 - 11:00)</option>
          <option value="Siang (11:00 - 14:00)">Siang (11:00 - 14:00)</option>
          <option value="Sore (14:00 - 18:00)">Sore (14:00 - 18:00)</option>
          <option value="Malam (18:00 - 21:00)">Malam (18:00 - 21:00)</option>
        </select>
      </div>

      <!-- Notes -->
      <div>
        <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Catatan Tambahan</label>
        <input 
          v-model="cartStore.customer.delivery_notes" 
          type="text" 
          placeholder="Contoh: Titipkan di satpam jika rumah kosong" 
          class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-red outline-none"
        />
      </div>

      <div class="pt-2">
        <button 
          type="submit" 
          class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
        >
          <Send class="w-5 h-5" />
          Kirim Pesanan Ke WhatsApp
        </button>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { Send } from 'lucide-vue-next';
import Modal from '../../shared/components/Modal.vue';
import { useCartStore } from '../stores/cartStore';

const cartStore = useCartStore();

const handleSubmit = () => {
  cartStore.isDeliveryFormOpen = false;
  cartStore.checkoutWhatsApp();
};
</script>
