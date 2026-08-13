<template>
  <Modal :isOpen="isOpen" title="Buat & Bagikan Posting Promo" maxWidthClass="max-w-xl sm:max-w-2xl" @close="$emit('close')">
    <div v-if="product" class="space-y-3 sm:space-y-4 text-xs">
      
      <!-- Top Card: Product Preview & Quick Info -->
      <div class="flex items-start gap-2.5 sm:gap-3 bg-gray-50 dark:bg-gray-800/70 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 min-w-0">
        <img
          :src="proxyImageUrl(product.image_url || '')"
          :alt="product.name"
          class="w-14 h-14 sm:w-20 sm:h-20 object-cover rounded-xl sm:rounded-2xl shrink-0 border border-gray-200 dark:border-gray-700 shadow-xs"
          @error="($event.target as HTMLImageElement).src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=150'"
        />
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-1.5 mb-0.5 sm:mb-1">
            <span :class="getMerchantBadgeClass(product.merchant)" class="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider">
              {{ merchantName }}
            </span>
            <span v-if="discount > 0" class="px-1.5 sm:px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 text-[9px] sm:text-[10px] font-extrabold">
              DISKON {{ discount }}%
            </span>
            <span v-if="product.shop_name" class="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[120px] sm:max-w-none">
              🛍️ {{ product.shop_name }}
            </span>
          </div>

          <div class="font-bold text-xs sm:text-sm text-gray-900 dark:text-white line-clamp-2 leading-snug break-words">
            {{ product.name }}
          </div>

          <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
            <span v-if="product.price" class="font-extrabold text-sm sm:text-base text-emerald-600 dark:text-emerald-400">
              {{ formatRupiah(product.price) }}
            </span>
            <span v-if="product.original_price && product.price && product.original_price > product.price" class="text-[10px] sm:text-xs text-gray-400 line-through">
              {{ formatRupiah(product.original_price) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Template Controls & Link Settings -->
      <div class="space-y-3 bg-white dark:bg-gray-800 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 min-w-0">
        <!-- Row 1: Preset Caption Templates -->
        <div>
          <label class="block text-[10px] sm:text-[11px] font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>🎨 Gaya Copywriting Caption</span>
            <span class="text-[9px] sm:text-[10px] font-normal text-gray-400">Pilih preset</span>
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              v-for="tpl in presetTemplates"
              :key="tpl.id"
              @click="selectPreset(tpl.id)"
              :class="[
                'p-2 sm:px-2.5 sm:py-2 rounded-xl text-left border transition-all flex items-center gap-1.5 cursor-pointer font-bold min-w-0',
                selectedPreset === tpl.id
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700 shadow-xs'
                  : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
            >
              <component :is="tpl.icon" class="w-3.5 h-3.5 shrink-0" />
              <span class="text-[10px] sm:text-[11px] truncate min-w-0">{{ tpl.name }}</span>
            </button>
          </div>
        </div>

        <!-- Row 2: Link Type Toggle -->
        <div>
          <label class="block text-[10px] sm:text-[11px] font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>🔗 Pilihan Tujuan Link Promo</span>
            <span class="text-[9px] sm:text-[10px] font-normal text-emerald-600 dark:text-emerald-400 font-semibold">Tautan 1x (tidak double)</span>
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
            <button
              @click="setLinkType('belanjaklik')"
              :class="[
                'p-2 sm:p-2.5 rounded-xl border text-left flex items-start gap-2 cursor-pointer transition-all min-w-0 overflow-hidden',
                selectedLinkType === 'belanjaklik'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 shadow-xs'
                  : 'bg-gray-50 dark:bg-gray-700/40 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
              ]"
            >
              <div class="mt-0.5 p-1 rounded-lg bg-emerald-600 text-white shrink-0">
                <Globe class="w-3.5 h-3.5" />
              </div>
              <div class="min-w-0 flex-1 overflow-hidden">
                <div class="font-extrabold text-[11px] sm:text-xs">Landing Page BelanjaKlik</div>
                <div class="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5 font-mono block w-full">{{ belanjaklikUrl }}</div>
              </div>
            </button>

            <button
              @click="setLinkType('direct')"
              :class="[
                'p-2 sm:p-2.5 rounded-xl border text-left flex items-start gap-2 cursor-pointer transition-all min-w-0 overflow-hidden',
                selectedLinkType === 'direct'
                  ? 'bg-amber-50 text-amber-800 border-amber-400 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700 shadow-xs'
                  : 'bg-gray-50 dark:bg-gray-700/40 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
              ]"
            >
              <div class="mt-0.5 p-1 rounded-lg bg-amber-500 text-white shrink-0">
                <ExternalLink class="w-3.5 h-3.5" />
              </div>
              <div class="min-w-0 flex-1 overflow-hidden">
                <div class="font-extrabold text-[11px] sm:text-xs">Direct Tracking Affiliate</div>
                <div class="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5 font-mono block w-full">{{ directAffiliateUrl }}</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Editable Caption Textarea -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="text-[10px] sm:text-[11px] font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Draft Caption Promo (Bisa Diedit Manual)
          </label>
          <span class="text-[9px] sm:text-[10px] text-gray-400 font-medium">Link sudah menyatu di teks</span>
        </div>
        <textarea
          v-model="caption"
          rows="5"
          class="w-full p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[11px] sm:text-xs leading-relaxed font-mono focus:ring-2 focus:ring-emerald-500 outline-none shadow-xs"
          placeholder="Ketik atau edit caption promo Anda di sini..."
        ></textarea>
      </div>

      <!-- Direct Social Target Share Bar -->
      <div class="space-y-1.5 pt-0.5">
        <label class="block text-[10px] sm:text-[11px] font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          Direct Share ke Aplikasi Media Sosial
        </label>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <!-- WhatsApp Direct -->
          <button
            @click="shareToWhatsApp"
            class="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] sm:text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
          >
            <MessageSquare class="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <!-- Telegram Direct -->
          <button
            @click="shareToTelegram"
            class="py-2 px-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-[10px] sm:text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
          >
            <Send class="w-3.5 h-3.5" />
            <span>Telegram</span>
          </button>

          <!-- Facebook Direct -->
          <button
            @click="shareToFacebook"
            class="py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] sm:text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
          >
            <Facebook class="w-3.5 h-3.5" />
            <span>Facebook</span>
          </button>

          <!-- Twitter / X Direct -->
          <button
            @click="shareToTwitter"
            class="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[10px] sm:text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
          >
            <Twitter class="w-3.5 h-3.5" />
            <span>Twitter / X</span>
          </button>
        </div>
      </div>

      <!-- Product Image & Visual Card Generator Bar -->
      <div class="bg-emerald-50/60 dark:bg-emerald-950/30 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-emerald-100 dark:border-emerald-900/50 space-y-2">
        <div class="flex items-center justify-between">
          <div class="font-extrabold text-[11px] sm:text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            <ImageIcon class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Gambar & Banner Promo Visual</span>
          </div>
          <span v-if="isProcessingImage" class="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
            Memproses...
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2">
          <!-- Download Original Product Image -->
          <button
            @click="downloadProductImage"
            :disabled="isProcessingImage"
            class="py-2 px-2.5 rounded-xl bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] sm:text-[11px] flex items-center justify-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 cursor-pointer transition-colors shadow-xs disabled:opacity-50"
          >
            <Download class="w-3.5 h-3.5" />
            <span>Download Gambar</span>
          </button>

          <!-- Copy Image to Clipboard -->
          <button
            @click="copyImageToClipboard"
            :disabled="isProcessingImage"
            class="py-2 px-2.5 rounded-xl bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] sm:text-[11px] flex items-center justify-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 cursor-pointer transition-colors shadow-xs disabled:opacity-50"
          >
            <Copy class="w-3.5 h-3.5" />
            <span>Salin Gambar</span>
          </button>

          <!-- Download Visual Promo Card Canvas -->
          <button
            @click="generateAndDownloadPromoCard"
            :disabled="isProcessingImage"
            class="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] sm:text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs disabled:opacity-50"
          >
            <Sparkles class="w-3.5 h-3.5" />
            <span>Download Banner Card</span>
          </button>
        </div>
      </div>

      <!-- Action Buttons Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 pt-0.5">
        <!-- Native Share Button -->
        <button
          @click="handleShare"
          :disabled="isProcessingImage"
          class="col-span-1 sm:col-span-2 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
        >
          <Share2 class="w-4 h-4" />
          <span>Bagikan Teks + Gambar ke Sosmed</span>
        </button>

        <!-- Copy Caption & Link (Single link ensured) -->
        <button
          @click="copyCaptionAndLink"
          class="py-2 sm:py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-xs"
        >
          <Copy class="w-3.5 h-3.5 text-emerald-500" />
          <span>Salin Caption & Link</span>
        </button>

        <!-- Copy Link Only -->
        <button
          @click="copyText(effectiveLink, 'Link promo berhasil disalin!')"
          class="py-2 sm:py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-xs"
        >
          <Link2 class="w-3.5 h-3.5 text-blue-500" />
          <span>Salin Link Saja</span>
        </button>
      </div>

      <!-- Status Toast Message inside Modal -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-1"
      >
        <div v-if="toastMessage" class="p-2 sm:p-2.5 rounded-xl bg-gray-900 text-white font-bold text-[11px] sm:text-xs flex items-center justify-between gap-2 shadow-lg border border-gray-700">
          <div class="flex items-center gap-2 min-w-0">
            <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
            <span class="truncate">{{ toastMessage }}</span>
          </div>
          <button @click="toastMessage = ''" class="text-gray-400 hover:text-white text-xs font-mono shrink-0">&times;</button>
        </div>
      </Transition>

      <p class="text-[9px] sm:text-[10px] text-gray-400 leading-relaxed text-center">
        💡 Link promo dijamin hanya muncul 1x di dalam caption. Gambar produk dapat diunduh atau dibagikan langsung bersama postingan.
      </p>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { 
  Share2, Copy, Link2, Download, Image as ImageIcon, Sparkles, 
  Globe, ExternalLink, Flame, MessageSquare, Smartphone, CheckCircle2,
  Send, Facebook, Twitter
} from 'lucide-vue-next';
import Modal from '@/features/shared/components/Modal.vue';
import type { AffiliateProduct } from '@/features/affiliate/types';
import { formatRupiah } from '@/features/shared/utils/formatters';
import { proxyImageUrl } from '@/features/tokosaya-sync/services/ImageProxyService';
import { AccesstradeEngine } from '@/features/affiliate/services/AccesstradeService';
import { openUrl } from '@/features/shared/utils/openUrl';

const props = defineProps<{
  isOpen: boolean;
  product: AffiliateProduct | null;
}>();

defineEmits(['close']);

const toastMessage = ref('');
const isProcessingImage = ref(false);
const selectedPreset = ref<'hot_deal' | 'whatsapp' | 'minimal' | 'instagram'>('hot_deal');
const selectedLinkType = ref<'belanjaklik' | 'direct'>('belanjaklik');
const caption = ref('');

const showToast = (msg: string) => {
  toastMessage.value = msg;
  setTimeout(() => {
    if (toastMessage.value === msg) toastMessage.value = '';
  }, 3000);
};

const presetTemplates = [
  { id: 'hot_deal', name: '🔥 Hot Deal', icon: Flame },
  { id: 'whatsapp', name: '💬 WhatsApp', icon: MessageSquare },
  { id: 'minimal', name: '⚡ Ringkas', icon: Smartphone },
  { id: 'instagram', name: '📸 Sosmed', icon: Sparkles }
];

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

const getMerchantBadgeClass = (merchant?: string): string => {
  switch (merchant?.toLowerCase()) {
    case 'shopee': return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300';
    case 'tokopedia': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
    case 'lazada': return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
    case 'tiktok_shop': return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300';
    case 'traveloka': return 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300';
    case 'oppo': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }
};

const discount = computed(() => {
  const p = props.product;
  if (p?.discount_percent) return Math.round(p.discount_percent);
  if (p?.original_price && p?.price && p.original_price > p.price) {
    return Math.round(((p.original_price - p.price) / p.original_price) * 100);
  }
  return 0;
});

const belanjaklikUrl = computed(() => {
  const p = props.product;
  if (!p) return window.location.origin;
  const raw = p.slug || p.id || '';
  const clean = String(raw).replace(/[\uFEFF\u200B\u00A0]/g, '').trim();
  return `${window.location.origin}/produk/${encodeURIComponent(clean)}`;
});

const directAffiliateUrl = computed(() => {
  const p = props.product;
  if (!p) return window.location.origin;
  const affUrl = p.affiliate_url?.trim() || '';
  const prodUrl = p.product_url?.trim() || '';

  if (prodUrl && prodUrl.startsWith('http')) {
    if (affUrl.toLowerCase().includes('accesstrade.co.id/click')) {
      return affUrl;
    }
    return AccesstradeEngine.convertToAffiliateUrl(prodUrl);
  }
  return affUrl || prodUrl || window.location.origin;
});

const effectiveLink = computed(() => {
  return selectedLinkType.value === 'belanjaklik' ? belanjaklikUrl.value : directAffiliateUrl.value;
});

const getMarketplaceHashtags = (merchant?: string): string => {
  const m = (merchant || '').toLowerCase();
  if (m.includes('tokopedia')) {
    return '#BelanjaKlik #RacunTokped #SpillRacunTokped #TokopediaPromo #PromoHariIni';
  } else if (m.includes('shopee')) {
    return '#BelanjaKlik #RacunShopee #SpillRacunShopee #ShopeeHaul #PromoShopee';
  } else if (m.includes('lazada')) {
    return '#BelanjaKlik #RacunLazada #LazadaHaul #PromoLazada #DiskonLazada';
  } else if (m.includes('tiktok')) {
    return '#BelanjaKlik #RacunTikTok #SpillTikTokShop #TikTokShopHaul #PromoTikTok';
  } else if (m.includes('blibli')) {
    return '#BelanjaKlik #BlibliPromo #BlibliHaul #BelanjaDiBlibli #PromoHariIni';
  } else if (m.includes('traveloka')) {
    return '#BelanjaKlik #TravelokaPromo #TravelokaDiskon #LiburanHemat';
  } else if (m.includes('oppo')) {
    return '#BelanjaKlik #DiskonOppo #OppoPromo #GadgetPromo';
  }
  return '#BelanjaKlik #PromoOnline #RacunBelanja #DiskonHariIni #PromoSuper';
};

const generateCaption = (preset: string, linkType: 'belanjaklik' | 'direct'): string => {
  const p = props.product;
  if (!p) return '';
  
  const link = linkType === 'belanjaklik' ? belanjaklikUrl.value : directAffiliateUrl.value;
  const lines: string[] = [];

  if (preset === 'hot_deal') {
    lines.push(`🔥 PROMO SPESIAL ${merchantName.value.toUpperCase()}! 🔥`);
    lines.push('');
    lines.push(p.name.trim());
    lines.push('');
    if (p.price) {
      if (discount.value > 0 && p.original_price) {
        lines.push(`💰 Harga Promo: ${formatRupiah(p.price)} (Diskon ${discount.value}% dari ${formatRupiah(p.original_price)})`);
      } else {
        lines.push(`💰 Harga: ${formatRupiah(p.price)}`);
      }
    }
    if (p.shop_name) lines.push(`🛍️ Toko: ${p.shop_name}`);
    lines.push('');
    lines.push('👇 Beli & Cek Promo Sekarang di sini:');
    lines.push(link);
    lines.push('');
    lines.push(getMarketplaceHashtags(p.merchant));
  } else if (preset === 'whatsapp') {
    lines.push(`*🛍️ PROMO HEBOH ${merchantName.value.toUpperCase()}*`);
    lines.push('');
    lines.push(`*${p.name.trim()}*`);
    lines.push('');
    if (p.price) {
      if (discount.value > 0 && p.original_price) {
        lines.push(`💸 *Harga*: *${formatRupiah(p.price)}* _(Diskon ${discount.value}% dari ~${formatRupiah(p.original_price)}~)_`);
      } else {
        lines.push(`💸 *Harga*: *${formatRupiah(p.price)}*`);
      }
    }
    if (p.shop_name) lines.push(`🏪 *Toko*: ${p.shop_name}`);
    lines.push('');
    lines.push('👉 *Klik link resmi untuk order*:');
    lines.push(link);
    lines.push('');
    lines.push('_Promo terbatas, buruan cek sebelum kehabisan!_');
  } else if (preset === 'minimal') {
    lines.push(p.name.trim());
    if (p.price) {
      lines.push(`💰 ${formatRupiah(p.price)}${discount.value > 0 ? ` (-${discount.value}%)` : ''}`);
    }
    lines.push('');
    lines.push('Link Promo:');
    lines.push(link);
  } else if (preset === 'instagram') {
    lines.push(`✨ RECOMMENDATION OF THE DAY ✨`);
    lines.push('');
    lines.push(p.name.trim());
    lines.push('');
    if (p.price) {
      lines.push(`Dapatkan harga promo super hemat ${formatRupiah(p.price)}${discount.value > 0 && p.original_price ? ` (harga normal ${formatRupiah(p.original_price)})` : ''}.`);
    }
    if (p.shop_name) lines.push(`Merchant: ${p.shop_name} (${merchantName.value})`);
    lines.push('');
    lines.push('🛒 Klik link pembelian di sini:');
    lines.push(link);
    lines.push('');
    lines.push(getMarketplaceHashtags(p.merchant));
  }

  return lines.join('\n');
};

const selectPreset = (presetId: string) => {
  selectedPreset.value = presetId as any;
  caption.value = generateCaption(selectedPreset.value, selectedLinkType.value);
};

const setLinkType = (type: 'belanjaklik' | 'direct') => {
  selectedLinkType.value = type;
  caption.value = generateCaption(selectedPreset.value, selectedLinkType.value);
};

watch(
  () => [props.isOpen, props.product?.id, props.product?.name, props.product?.price] as const,
  () => {
    if (props.isOpen && props.product) {
      caption.value = generateCaption(selectedPreset.value, selectedLinkType.value);
      toastMessage.value = '';
    }
  },
  { immediate: true }
);

const copyText = async (text: string, successMsg: string) => {
  try {
    await navigator.clipboard.writeText(text || '');
    showToast(successMsg);
  } catch {
    showToast('Gagal menyalin ke clipboard. Silakan coba lagi.');
  }
};

const copyCaptionAndLink = () => {
  copyText(caption.value, 'Caption & link promo berhasil disalin!');
};

/** Direct Share to WhatsApp Web / App */
const shareToWhatsApp = async () => {
  const textToShare = caption.value.trim();
  if (!textToShare) return;
  
  if (props.product?.image_url) {
    downloadProductImage();
  }

  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textToShare)}`;
  openUrl(waUrl, { target: '_blank' });
  showToast('Membuka WhatsApp... Caption & link promo terisi otomatis!');
};

/** Direct Share to Telegram */
const shareToTelegram = () => {
  const textToShare = caption.value.trim();
  if (!textToShare) return;

  if (props.product?.image_url) {
    downloadProductImage();
  }

  const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(effectiveLink.value)}&text=${encodeURIComponent(textToShare)}`;
  openUrl(tgUrl, { target: '_blank' });
  showToast('Membuka Telegram...');
};

/** Direct Share to Facebook */
const shareToFacebook = () => {
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(effectiveLink.value)}`;
  openUrl(fbUrl, { target: '_blank' });
  showToast('Membuka Facebook...');
};

/** Direct Share to Twitter / X */
const shareToTwitter = () => {
  const textToShare = caption.value.trim();
  const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(textToShare)}`;
  openUrl(twUrl, { target: '_blank' });
  showToast('Membuka Twitter / X...');
};

/** Fetch product image safely via multi-provider CORS proxy pipeline */
const fetchImageBlob = async (imageUrl: string): Promise<Blob | null> => {
  if (!imageUrl) return null;
  const cleanUrl = imageUrl.trim();
  const encoded = encodeURIComponent(cleanUrl);

  const candidateUrls = [
    proxyImageUrl(cleanUrl),
    `https://wsrv.nl/?url=${encoded}&output=jpg`,
    `https://images.weserv.nl/?url=${encoded}&output=jpg`,
    `https://corsproxy.io/?${encoded}`,
    cleanUrl
  ];

  const uniqueCandidates = [...new Set(candidateUrls)];

  for (const url of uniqueCandidates) {
    try {
      const resp = await fetch(url, { mode: 'cors' });
      if (resp.ok) {
        const blob = await resp.blob();
        if (blob && blob.size > 100) {
          return blob;
        }
      }
    } catch {
      // Continue to next candidate fallback
    }
  }

  // Final fallback: Image element to Canvas blob
  return new Promise<Blob | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 600;
        canvas.height = img.naturalHeight || 600;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = proxyImageUrl(cleanUrl);
  });
};

/** Create a File object from product image for Web Share API */
const buildImageFile = async (): Promise<File | undefined> => {
  const p = props.product;
  if (!p?.image_url) return undefined;
  isProcessingImage.value = true;
  try {
    const blob = await fetchImageBlob(p.image_url);
    if (!blob) return undefined;
    const ext = (p.image_url.split('.').pop()?.split('?')[0] || 'jpg').toLowerCase();
    const cleanSlug = String(p.slug || p.id || 'product').replace(/[^a-z0-9-]/gi, '');
    const filename = `promo-${cleanSlug}.${ext.length < 5 ? ext : 'jpg'}`;
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  } finally {
    isProcessingImage.value = false;
  }
};

/** Download Product Image directly */
const downloadProductImage = async () => {
  const p = props.product;
  if (!p?.image_url) {
    showToast('Gambar produk tidak tersedia.');
    return;
  }
  isProcessingImage.value = true;
  try {
    const blob = await fetchImageBlob(p.image_url);
    if (!blob) {
      showToast('Gagal mengunduh gambar produk.');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanSlug = String(p.slug || p.id).replace(/[^a-z0-9-]/gi, '');
    a.download = `promo-${cleanSlug || 'produk'}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Gambar produk berhasil diunduh!');
  } catch {
    showToast('Gagal memproses pengunduhan gambar.');
  } finally {
    isProcessingImage.value = false;
  }
};

/** Copy image bitmap to system clipboard */
const copyImageToClipboard = async () => {
  const p = props.product;
  if (!p?.image_url) {
    showToast('Gambar produk tidak tersedia.');
    return;
  }
  isProcessingImage.value = true;
  try {
    const blob = await fetchImageBlob(p.image_url);
    if (!blob) {
      showToast('Gagal mengambil gambar produk.');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    const loaded = new Promise<boolean>((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
    });
    img.src = URL.createObjectURL(blob);

    const ok = await loaded;
    URL.revokeObjectURL(img.src);
    if (!ok) {
      showToast('Gagal mengkonversi gambar.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 600;
    canvas.height = img.naturalHeight || 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);

    canvas.toBlob(async (pngBlob) => {
      if (!pngBlob) {
        showToast('Gagal membuat blob gambar.');
        return;
      }
      try {
        if (navigator.clipboard && typeof (window as any).ClipboardItem !== 'undefined') {
          const item = new (window as any).ClipboardItem({ 'image/png': pngBlob });
          await navigator.clipboard.write([item]);
          showToast('Gambar berhasil disalin ke clipboard! Siap di-paste.');
        } else {
          showToast('Browser Anda tidak mendukung salin gambar langsung. Gunakan opsi Download Gambar.');
        }
      } catch {
        showToast('Fitur salin gambar diblokir browser. Gunakan opsi Download Gambar.');
      }
    }, 'image/png');
  } catch {
    showToast('Gagal menyalin gambar.');
  } finally {
    isProcessingImage.value = false;
  }
};

/** Canvas Helper for Rounded Rectangle */
const drawRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

/** Canvas Helper for Text Wrapping */
const drawWrappedText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number = 2) => {
  const words = text.split(' ');
  let line = '';
  let linesCount = 1;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, y);
      line = words[n] + ' ';
      y += lineHeight;
      linesCount++;
      if (linesCount > maxLines) {
        ctx.fillText('...', x, y);
        return;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, y);
};

/** Generate & Download HTML5 Canvas Visual Promo Banner Card */
const generateAndDownloadPromoCard = async () => {
  const p = props.product;
  if (!p) return;
  isProcessingImage.value = true;
  showToast('Membangun banner promo visual...');

  try {
    const canvas = document.createElement('canvas');
    const width = 800;
    const height = 800;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#1e293b');
    bgGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    drawRoundRect(ctx, 40, 40, width - 80, height - 80, 24);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    let imgLoaded = false;
    if (p.image_url) {
      const blob = await fetchImageBlob(p.image_url);
      if (blob) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const imgPromise = new Promise<boolean>((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        });
        img.src = URL.createObjectURL(blob);
        imgLoaded = await imgPromise;
        if (imgLoaded) {
          ctx.save();
          drawRoundRect(ctx, 70, 70, 360, 360, 20);
          ctx.clip();
          ctx.drawImage(img, 70, 70, 360, 360);
          ctx.restore();
          URL.revokeObjectURL(img.src);
        }
      }
    }

    if (!imgLoaded) {
      drawRoundRect(ctx, 70, 70, 360, 360, 20);
      ctx.fillStyle = '#f1f5f9';
      ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BelanjaKlik Promo', 250, 250);
      ctx.textAlign = 'left';
    }

    let badgeBg = '#10b981';
    const merchantLower = (p.merchant || '').toLowerCase();
    if (merchantLower.includes('shopee')) badgeBg = '#ee4d2d';
    else if (merchantLower.includes('tokopedia')) badgeBg = '#00aa5b';
    else if (merchantLower.includes('lazada')) badgeBg = '#0f146d';
    else if (merchantLower.includes('tiktok')) badgeBg = '#fe2c55';

    drawRoundRect(ctx, 460, 70, 160, 36, 12);
    ctx.fillStyle = badgeBg;
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(merchantName.value.toUpperCase(), 475, 93);

    if (discount.value > 0) {
      drawRoundRect(ctx, 630, 70, 100, 36, 12);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(`-${discount.value}%`, 650, 93);
    }

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px sans-serif';
    drawWrappedText(ctx, p.name, 460, 145, 270, 36, 3);

    if (p.shop_name) {
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`🛍️ ${p.shop_name}`, 460, 270);
    }

    if (p.price) {
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(formatRupiah(p.price), 460, 330);

      if (p.original_price && p.original_price > p.price) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 20px sans-serif';
        const origText = formatRupiah(p.original_price);
        ctx.fillText(origText, 460, 365);
        const metrics = ctx.measureText(origText);
        ctx.beginPath();
        ctx.moveTo(460, 358);
        ctx.lineTo(460 + metrics.width, 358);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    drawRoundRect(ctx, 70, 460, 660, 160, 20);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('👉 Cek & Beli Sekarang:', 95, 505);

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 20px monospace';
    const displayUrl = effectiveLink.value.length > 55 ? effectiveLink.value.substring(0, 52) + '...' : effectiveLink.value;
    ctx.fillText(displayUrl, 95, 545);

    ctx.fillStyle = '#64748b';
    ctx.font = 'medium 14px sans-serif';
    ctx.fillText('Penawaran belanja hemat & terpercaya via BelanjaKlik', 95, 580);

    drawRoundRect(ctx, 40, 690, width - 80, 70, 0);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('BelanjaKlik', 70, 732);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('• Rekomendasi Belanja Cerdas & Afiliasi Resmi', 185, 732);

    canvas.toBlob((bannerBlob) => {
      if (!bannerBlob) return;
      const bannerUrl = URL.createObjectURL(bannerBlob);
      const link = document.createElement('a');
      link.href = bannerUrl;
      const cleanSlug = String(p.slug || p.id).replace(/[^a-z0-9-]/gi, '');
      link.download = `banner-promo-${cleanSlug || 'card'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(bannerUrl);
      showToast('Banner promo visual berhasil diunduh!');
    }, 'image/png');
  } catch (err) {
    console.error('[AffiliatePromoShareModal] Canvas Banner Error:', err);
    showToast('Gagal memproses banner promo.');
  } finally {
    isProcessingImage.value = false;
  }
};

/** Handle Web Share API (Text + Image file) with fallbacks */
const handleShare = async () => {
  const p = props.product;
  if (!p) return;

  const textToShare = caption.value.trim();
  const hasUrlInText = textToShare.includes('http://') || textToShare.includes('https://');

  const payload: ShareData = {
    title: `${merchantName.value} Promo - ${p.name}`,
    text: textToShare,
  };

  if (!hasUrlInText) {
    payload.url = effectiveLink.value;
  }

  const imageFile = await buildImageFile();
  if (imageFile) {
    payload.files = [imageFile];
  }

  // If Web Share API with files/text is supported on mobile:
  if (navigator.share) {
    try {
      if (payload.files && (navigator as any).canShare && !(navigator as any).canShare({ files: payload.files })) {
        delete payload.files;
      }

      await navigator.share(payload);
      showToast('Menu berbagi berhasil dibuka!');
      return;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      console.warn('[AffiliatePromoShareModal] Web Share with file failed, retrying text-only:', err);
      if (payload.files) {
        delete payload.files;
        try {
          await navigator.share(payload);
          if (imageFile) downloadProductImage();
          return;
        } catch {
          // Fall through to desktop fallback
        }
      }
    }
  }

  // Fallback for Desktop PCs / Browsers without native share picker:
  // Automatically open WhatsApp Web with caption text & trigger image download!
  await shareToWhatsApp();
};
</script>
