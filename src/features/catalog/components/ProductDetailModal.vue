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
          <span v-if="product.promo_price" class="text-xs text-gray-400 line-through">{{ formatRupiah(product.price) }}</span>
        </div>

        <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-700/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700">
          {{ product.description || 'Produk kualitas terjamin untuk kebutuhan sehari-hari.' }}
        </p>

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
import { ShoppingBag, Plus, ExternalLink, MessageSquare, Clock, CheckCircle2, HelpCircle } from 'lucide-vue-next';
import Modal from '../../shared/components/Modal.vue';
import type { Product, FulfillmentChannel } from '../../shared/types';
import { formatRupiah } from '../../shared/utils/formatters';
import { useCatalogStore } from '../stores/catalogStore';
import { PurchaseService } from '../../purchase/services/PurchaseService';
import { proxyImageUrl } from '../../tokosaya-sync/services/ImageProxyService';

const props = defineProps<{
  isOpen: boolean;
  product: Product | null;
}>();

const emit = defineEmits(['close']);

const catalogStore = useCatalogStore();
const activeImage = ref<string>('');

const productImages = computed<string[]>(() => {
  if (!props.product) return [];
  const list: string[] = [];
  
  if (props.product.images && props.product.images.length > 0) {
    props.product.images.forEach(img => {
      if (img && !list.includes(img)) list.push(proxyImageUrl(img));
    });
  } else if (props.product.image_url) {
    list.push(proxyImageUrl(props.product.image_url));
  }

  // Hide default placeholders if custom images are present
  const hasCustomImages = list.some(img => !img.includes('1542838132-92c53300491e'));
  if (hasCustomImages) {
    return list.filter(img => !img.includes('1542838132-92c53300491e'));
  }

  return list;
});

watch(() => props.product, (newP) => {
  if (newP) {
    const list = newP.images && newP.images.length > 0 ? newP.images : [newP.image_url || ''];
    const cleanList = list.filter(img => !img.includes('1542838132-92c53300491e'));
    activeImage.value = proxyImageUrl(cleanList[0] || list[0] || '');
  }
}, { immediate: true });

const channel = computed<FulfillmentChannel | undefined>(() => {
  if (!props.product?.channel_id) return undefined;
  return catalogStore.channels.find(c => c.id === props.product?.channel_id);
});

const buttonConfig = computed(() => {
  if (!props.product) return { label: '', iconName: 'Plus', buttonClass: '' };
  return PurchaseService.getButtonConfig(props.product, channel.value);
});

const badgeConfig = computed(() => {
  if (!props.product) return { label: '', badgeClass: '', iconName: 'ShoppingBag' };
  return PurchaseService.getBadgeConfig(props.product, channel.value);
});

const iconMap: Record<string, any> = {
  ShoppingBag,
  Plus,
  ExternalLink,
  MessageSquare,
  Clock,
  CheckCircle2,
  HelpCircle
};

const buttonIcon = computed(() => iconMap[buttonConfig.value.iconName] || Plus);
const badgeIcon = computed(() => iconMap[badgeConfig.value.iconName] || ShoppingBag);

const handlePurchase = async () => {
  if (props.product) {
    await PurchaseService.execute(props.product, channel.value);
    emit('close');
  }
};
</script>
