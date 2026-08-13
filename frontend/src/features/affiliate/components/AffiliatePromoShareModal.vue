<template>
  <Modal :isOpen="isOpen" title="Buat Posting Promo" maxWidthClass="max-w-xl" @close="$emit('close')">
    <div v-if="product" class="space-y-4">
      <!-- Preview Produk -->
      <div class="flex items-start gap-3 bg-gray-50 dark:bg-gray-800/60 p-3 rounded-2xl border border-gray-100 dark:border-gray-700">
        <img
          :src="proxyImageUrl(product.image_url || '')"
          :alt="product.name"
          class="w-16 h-16 object-cover rounded-xl shrink-0 border border-gray-100 dark:border-gray-700"
          @error="($event.target as HTMLImageElement).src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=150'"
        />
        <div class="min-w-0">
          <div class="text-[10px] font-extrabold uppercase tracking-wider text-brand-red mb-0.5">{{ merchantName }} PROMO</div>
          <div class="font-bold text-sm text-gray-900 dark:text-white line-clamp-2">{{ product.name }}</div>
          <div class="flex flex-wrap items-center gap-2 mt-1 text-xs">
            <span v-if="product.price" class="font-extrabold text-emerald-600 dark:text-emerald-400">{{ formatRupiah(product.price) }}</span>
            <span v-if="discount > 0" class="text-red-500 font-bold">-{{ discount }}%</span>
            <span v-if="product.commission_rate" class="text-amber-600 dark:text-amber-400 font-semibold">Komisi {{ product.commission_rate }}%</span>
          </div>
        </div>
      </div>

      <!-- Caption Editable -->
      <div>
        <label class="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">Caption Promo (bisa diedit)</label>
        <textarea
          v-model="caption"
          rows="7"
          class="w-full p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs leading-relaxed font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
        ></textarea>
      </div>

      <!-- Tombol Aksi -->
      <div class="grid grid-cols-2 gap-2.5">
        <button
          @click="handleShare"
          class="col-span-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <Share2 class="w-4 h-4" />
          <span>Bagikan ke Media Sosial</span>
        </button>
        <button
          @click="copyText(caption, 'Caption disalin')"
          class="py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Copy class="w-3.5 h-3.5" /> Salin Caption
        </button>
        <button
          @click="copyText(shareUrl, 'Link produk disalin')"
          class="py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Link2 class="w-3.5 h-3.5" /> Salin Link
        </button>
        <button
          @click="copyText(product.affiliate_url, 'Link afiliasi disalin')"
          title="Link tracking Accesstrade langsung (untuk monetisasi klik)"
          class="col-span-2 py-2.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
        >
          <Copy class="w-3.5 h-3.5" /> Salin Link Afiliasi (tracking)
        </button>
      </div>

      <p class="text-[10px] text-gray-400 leading-relaxed">
        Saat link produk dibagikan, gambar & deskripsi otomatis tampil di sosmed. Klik "Bagikan ke Media Sosial" untuk membuka pilihan share sistem.
      </p>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Share2, Copy, Link2 } from 'lucide-vue-next';
import Modal from '@/features/shared/components/Modal.vue';
import type { AffiliateProduct } from '@/features/affiliate/types';
import { formatRupiah } from '@/features/shared/utils/formatters';
import { proxyImageUrl } from '@/features/tokosaya-sync/services/ImageProxyService';

const props = defineProps<{
  isOpen: boolean;
  product: AffiliateProduct | null;
}>();

defineEmits(['close']);

const copiedMessage = ref('');

const merchantName = computed(() => {
  switch (props.product?.merchant?.toLowerCase()) {
    case 'shopee': return 'Shopee';
    case 'tokopedia': return 'Tokopedia';
    case 'blibli': return 'Blibli';
    case 'lazada': return 'Lazada';
    case 'tiktok_shop': return 'TikTok Shop';
    case 'traveloka': return 'Traveloka';
    case 'oppo': return 'OPPO';
    default: return 'Promo';
  }
});

const discount = computed(() => {
  const p = props.product;
  if (p?.discount_percent) return Math.round(p.discount_percent);
  if (p?.original_price && p?.price && p.original_price > p.price) {
    return Math.round(((p.original_price - p.price) / p.original_price) * 100);
  }
  return 0;
});

const shareUrl = computed(() => {
  const p = props.product;
  if (!p) return window.location.origin;
  const path = p.slug || p.id;
  return `${window.location.origin}/produk/${encodeURIComponent(path)}`;
});

const buildCaption = () => {
  const p = props.product;
  if (!p) return '';
  const lines: string[] = [];
  lines.push(`🛍️ ${merchantName.value.toUpperCase()} PROMO`);
  lines.push('');
  lines.push(p.name.trim());
  lines.push('');
  if (p.price) lines.push(`💰 Harga: ${formatRupiah(p.price)}`);
  if (discount.value > 0) lines.push(`🎉 Diskon ${discount.value}%`);
  if (p.commission_rate) lines.push(`💸 Komisi ${p.commission_rate}%`);
  lines.push('');
  lines.push(`🔗 ${shareUrl.value}`);
  lines.push('');
  lines.push('#BelanjaKlik #Promo #PromoHariIni');
  return lines.join('\n');
};

const caption = ref('');

watch(
  () => [props.isOpen, props.product?.id, props.product?.name, props.product?.price] as const,
  () => {
    if (props.isOpen && props.product) {
      caption.value = buildCaption();
      copiedMessage.value = '';
    }
  },
  { immediate: true }
);

const copyText = async (text: string, successMsg: string) => {
  try {
    await navigator.clipboard.writeText(text || '');
    copiedMessage.value = successMsg;
    setTimeout(() => (copiedMessage.value = ''), 2500);
  } catch {
    copiedMessage.value = 'Gagal menyalin. Coba lagi.';
    setTimeout(() => (copiedMessage.value = ''), 2500);
  }
};

const handleShare = async () => {
  const payload = {
    title: `${merchantName.value} Promo`,
    text: caption.value,
    url: shareUrl.value,
  };
  if (navigator.share) {
    try {
      await navigator.share(payload);
      return;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
    }
  }
  await copyText(`${caption.value}\n\n${shareUrl.value}`, 'Caption & link disalin');
};
</script>
