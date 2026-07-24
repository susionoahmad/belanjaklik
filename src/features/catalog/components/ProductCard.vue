<template>
  <div 
    class="bg-white dark:bg-gray-800 rounded-3xl p-3 sm:p-4 border border-gray-100 dark:border-gray-700 shadow-soft hover:shadow-hover transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
    :class="isOutOfStock ? 'opacity-85' : 'cursor-pointer'"
    @click="isOutOfStock ? null : $emit('select', product)"
  >
    <!-- Top Badges -->
    <div class="absolute top-3 left-3 z-10 flex flex-wrap gap-1">
      <span v-if="isOutOfStock" class="bg-gray-900 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider flex items-center gap-1 border border-gray-700">
        <XCircle class="w-3 h-3 text-red-400" />
        <span>Stok Kosong</span>
      </span>

      <span v-else-if="isJsmPromo" class="bg-gradient-to-r from-yellow-400 via-amber-500 to-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider flex items-center gap-1 border border-amber-300">
        <Flame class="w-3 h-3 text-yellow-100 fill-yellow-200 animate-pulse" />
        <span>{{ product.promo_badge || 'PROMO JSM (3 HARI)' }}</span>
      </span>

      <span v-else-if="product.is_promo && product.promo_price" class="bg-gradient-to-r from-red-600 to-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
        PROMO
      </span>



      <!-- Purchase Method Badge derived via PurchaseService -->
      <span 
        v-if="!isOutOfStock"
        class="text-[10px] font-extrabold px-2 py-0.5 rounded-full border shadow-2xs flex items-center gap-1"
        :class="badgeConfig.badgeClass"
      >
        <component :is="badgeIcon" class="w-3 h-3" />
        <span>{{ badgeConfig.label }}</span>
      </span>
    </div>

    <!-- Product Image (Crisp Proportional Container) -->
    <div class="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-700/60 mb-3 flex items-center justify-center p-3">
      <img 
        :src="displayImageUrl" 
        :alt="product.name" 
        class="max-w-full max-h-full object-contain rounded-xl drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
        :class="isOutOfStock ? 'opacity-50 grayscale' : ''"
        loading="lazy"
        @error="($event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'"
      />

      <!-- Out of Stock Overlay -->
      <div v-if="isOutOfStock" class="absolute inset-0 bg-black/35 backdrop-blur-[1px] flex items-center justify-center p-2">
        <span class="bg-red-600 text-white font-black text-[11px] px-3 py-1.5 rounded-2xl shadow-xl border border-white/20 uppercase tracking-wider flex items-center gap-1.5">
          <XCircle class="w-4 h-4" />
          <span>Stok Kosong</span>
        </span>
      </div>
    </div>


    <!-- Details -->
    <div class="space-y-1.5 flex-1">
      <div class="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
        {{ product.brand || 'Sembako' }}
      </div>
      <h3 class="font-bold text-xs sm:text-sm text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-brand-red transition-colors">
        {{ product.name }}
      </h3>
      <p class="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 font-mono">
        {{ product.weight || product.unit }}
      </p>
      <p v-if="product.description" class="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2 leading-tight font-sans">
        {{ product.description }}
      </p>

      <!-- Price -->
      <div class="pt-1 flex items-baseline gap-1.5">
        <span class="font-extrabold text-sm sm:text-base text-brand-red">
          {{ formatRupiah(product.promo_price || product.price) }}
        </span>
        <span v-if="product.promo_price" class="text-xs text-gray-400 line-through">
          {{ formatRupiah(product.price) }}
        </span>
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/60" @click.stop>
      <!-- Disabled Button if Out of Stock -->
      <button 
        v-if="isOutOfStock"
        disabled
        class="w-full py-2.5 px-3 rounded-2xl text-xs font-bold bg-gray-100 dark:bg-gray-700/60 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-1.5"
      >
        <XCircle class="w-3.5 h-3.5" />
        <span>Stok Habis</span>
      </button>

      <!-- Quantity Counter for In-Cart Items -->
      <div v-else-if="product.purchase_method === 'owner_checkout' && cartQuantity > 0" class="flex items-center justify-between bg-red-50 dark:bg-red-950/40 rounded-2xl p-1 border border-red-100 dark:border-red-900">
        <button 
          @click="cartStore.updateQuantity(product.id, cartQuantity - 1)" 
          class="w-8 h-8 rounded-xl bg-white dark:bg-gray-800 text-brand-red flex items-center justify-center font-black shadow-2xs hover:bg-gray-50 active:scale-95"
        >
          -
        </button>
        <span class="font-extrabold text-xs text-brand-red px-2">{{ cartQuantity }} {{ product.unit }}</span>
        <button 
          @click="cartStore.updateQuantity(product.id, cartQuantity + 1)" 
          class="w-8 h-8 rounded-xl bg-brand-red text-white flex items-center justify-center font-black shadow-2xs hover:bg-brand-red-dark active:scale-95"
        >
          +
        </button>
      </div>

      <!-- Strategy Action Button -->
      <button 
        v-else
        @click="handlePurchase"
        class="w-full py-2.5 px-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-98"
        :class="buttonConfig.buttonClass"
      >
        <component :is="buttonIcon" class="w-3.5 h-3.5" />
        <span>{{ buttonConfig.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ShoppingBag, Plus, ExternalLink, MessageSquare, Clock, CheckCircle2, HelpCircle, XCircle, Flame } from 'lucide-vue-next';

import type { Product, FulfillmentChannel } from '../../shared/types';
import { formatRupiah } from '../../shared/utils/formatters';
import { useCartStore } from '../../cart/stores/cartStore';
import { useCatalogStore } from '../stores/catalogStore';
import { PurchaseService } from '../../purchase/services/PurchaseService';
import { proxyImageUrl } from '../../tokosaya-sync/services/ImageProxyService';

const props = defineProps<{
  product: Product;
}>();

defineEmits(['select']);

const cartStore = useCartStore();
const catalogStore = useCatalogStore();

const isOutOfStock = computed(() => {
  return props.product.is_available === false || props.product.stock_status === 'out_of_stock';
});

const isJsmPromo = computed(() => {
  if (props.product.promo_type === 'JSM' || props.product.promo_badge?.includes('JSM')) return true;
  const name = String(props.product.name || '').toLowerCase();
  const brand = String(props.product.brand || '').toLowerCase();
  const jsmKeywords = ['fres & natural', 'fres&nat', 'lifebuoy', 'pepsodent', 'systema', 'emeron', 'close up', 'closeup'];
  return (props.product.is_promo || !!props.product.promo_price) && jsmKeywords.some(kw => name.includes(kw) || brand.includes(kw));
});


const displayImageUrl = computed(() => proxyImageUrl(props.product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'));

const channel = computed<FulfillmentChannel | undefined>(() => {
  if (!props.product.channel_id) return undefined;
  return catalogStore.channels.find(c => c.id === props.product.channel_id);
});

const cartQuantity = computed(() => {
  const found = cartStore.items.find(i => i.product.id === props.product.id);
  return found ? found.quantity : 0;
});

const buttonConfig = computed(() => PurchaseService.getButtonConfig(props.product, channel.value));
const badgeConfig = computed(() => PurchaseService.getBadgeConfig(props.product, channel.value));

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

const buttonIcon = computed(() => iconMap[buttonConfig.value.iconName] || Plus);
const badgeIcon = computed(() => iconMap[badgeConfig.value.iconName] || ShoppingBag);

const handlePurchase = async () => {
  if (isOutOfStock.value) return;
  await PurchaseService.execute(props.product, channel.value);
};
</script>

