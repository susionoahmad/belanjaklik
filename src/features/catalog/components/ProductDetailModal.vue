<template>
  <Modal :isOpen="isOpen" @close="$emit('close')">
    <div v-if="product" class="space-y-4">
      <!-- Product Header & Badges -->
      <div class="flex items-start justify-between gap-3">
        <div>
          <span 
            class="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs inline-flex items-center gap-1 mb-1.5"
            :class="badgeConfig.badgeClass"
          >
            <component :is="badgeIcon" class="w-3.5 h-3.5" />
            <span>{{ badgeConfig.label }}</span>
          </span>
          <h2 class="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white leading-snug">
            {{ product.name }}
          </h2>
          <p class="text-xs text-gray-400 font-semibold">{{ product.brand || 'Sembako' }} • {{ product.weight || product.unit }}</p>
        </div>
      </div>

      <!-- Multi-Image Display & Gallery Carousel Switcher -->
      <div class="space-y-2">
        <div class="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800/80 p-2 border border-gray-100 dark:border-gray-700/80 flex items-center justify-center shadow-inner group">
          <img 
            :src="activeImage" 
            :alt="product.name" 
            class="max-w-full max-h-full object-contain transition-all duration-300 rounded-xl" 
            @error="($event.target as HTMLImageElement).src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=800'" 
          />
        </div>

        <!-- Thumbnail Selector Bar -->
        <div v-if="productImages.length > 1" class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button 
            v-for="(img, idx) in productImages" 
            :key="idx"
            @click="activeImage = img"
            class="w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer bg-white dark:bg-gray-800 p-1 flex items-center justify-center"
            :class="activeImage === img ? 'border-brand-red scale-105 shadow-sm' : 'border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-100'"
          >
            <img :src="img" class="max-w-full max-h-full object-contain rounded-lg" @error="($event.target as HTMLImageElement).src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=150'" />
          </button>
        </div>
      </div>

      <!-- Price & Description -->
      <div class="space-y-2">
        <div class="flex items-baseline gap-2">
          <span class="font-black text-xl text-brand-red">{{ formatRupiah(product.promo_price || product.price) }}</span>
          <span v-if="product.is_promo && product.promo_price && product.price > product.promo_price" class="text-xs text-gray-400 line-through">{{ formatRupiah(product.price) }}</span>
        </div>

        <div class="space-y-1">
          <div class="font-bold text-xs text-gray-700 dark:text-gray-200">Deskripsi Produk:</div>
          <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line bg-gray-50 dark:bg-gray-700/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700">
            {{ product.description || 'Produk kualitas terjamin untuk kebutuhan sehari-hari.' }}
          </p>
        </div>

        <!-- Channel Description -->
        <div v-if="channel" class="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900 text-xs flex items-center gap-3">
          <img v-if="channel.icon_url || channel.logo" :src="channel.icon_url || channel.logo || ''" class="w-8 h-8 rounded-lg object-cover" />
          <div>
            <div class="font-bold text-gray-900 dark:text-white">{{ channel.name }}</div>
            <div class="text-[11px] text-gray-500">{{ channel.description }}</div>
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <div class="pt-2">
        <button 
          @click="handlePurchase"
          class="w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
          :class="buttonConfig.buttonClass"
        >
          <component :is="buttonIcon" class="w-4 h-4" />
          <span>{{ buttonConfig.label }}</span>
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ShoppingBag, Plus, ExternalLink, MessageSquare, Clock, CheckCircle2, HelpCircle, XCircle } from 'lucide-vue-next';
import Modal from '../../shared/components/Modal.vue';
import type { Product, FulfillmentChannel } from '../../shared/types';
import { formatRupiah } from '../../shared/utils/formatters';
import { useCatalogStore } from '../stores/catalogStore';
import { useCartStore } from '../../cart/stores/cartStore';
import { PurchaseService } from '../../purchase/services/PurchaseService';
import { proxyImageUrl } from '../../tokosaya-sync/services/ImageProxyService';

const props = defineProps<{
  isOpen: boolean;
  product: Product | null;
}>();

const emit = defineEmits(['close']);

const catalogStore = useCatalogStore();
const cartStore = useCartStore();
const activeImage = ref<string>('');

const channel = computed<FulfillmentChannel | undefined>(() => {
  if (!props.product?.channel_id) return undefined;
  return catalogStore.channels.find(c => c.id === props.product?.channel_id);
});

const productImages = computed<string[]>(() => {
  if (!props.product) return [];
  const imgs: string[] = [];
  if (props.product.image_url) imgs.push(proxyImageUrl(props.product.image_url));
  if (props.product.images && Array.isArray(props.product.images)) {
    props.product.images.forEach(img => {
      const p = proxyImageUrl(img);
      if (!imgs.includes(p)) imgs.push(p);
    });
  }
  return imgs.length > 0 ? imgs : ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=800'];
});

watch(() => props.product, (newProd) => {
  if (newProd) {
    activeImage.value = productImages.value[0];
  }
}, { immediate: true });

const buttonConfig = computed(() => {
  if (!props.product) return { label: 'Lihat Produk', buttonClass: 'bg-brand-red text-white' };
  return PurchaseService.getButtonConfig(props.product, channel.value);
});

const badgeConfig = computed(() => {
  if (!props.product) return { label: 'Produk', badgeClass: '' };
  return PurchaseService.getBadgeConfig(props.product, channel.value);
});

const iconMap: Record<string, any> = {
  ShoppingBag,
  Plus,
  ExternalLink,
  MessageSquare,
  Clock,
  CheckCircle2,
  HelpCircle,
  XCircle
};

const buttonIcon = computed(() => {
  const iconName = (buttonConfig.value as any)?.iconName;
  return iconMap[iconName] || Plus;
});
const badgeIcon = computed(() => {
  const iconName = (badgeConfig.value as any)?.iconName;
  return iconMap[iconName] || ShoppingBag;
});

async function handlePurchase() {
  if (!props.product) return;
  if (props.product.purchase_method === 'owner_checkout') {
    cartStore.addItem(props.product);
    emit('close');
  } else {
    await PurchaseService.execute(props.product, channel.value);
  }
}
</script>
