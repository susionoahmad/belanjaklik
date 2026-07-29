<template>
  <Modal :isOpen="isOpen" @close="$emit('close')">
    <div class="space-y-4 max-h-[85vh] overflow-y-auto pr-1">
      <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
        <div>
          <h3 class="font-extrabold text-base text-gray-900 dark:text-white">
            {{ product?.id ? 'Edit Produk Afiliasi' : 'Tambah Produk Afiliasi Manual' }}
          </h3>
          <p class="text-xs text-gray-500">
            {{ product?.id ? 'Perbarui informasi tautan & komisi produk' : 'Input link affiliate manual dari Custom Link Generator ACCESSTRADE atau merchant' }}
          </p>
        </div>
      </div>

      <div v-if="!product?.id" class="p-3 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/30 space-y-2">
        <div class="flex items-center justify-between gap-2">
          <div>
            <div class="text-xs font-extrabold text-blue-800 dark:text-blue-200">Import Produk via URL Merchant</div>
            <div class="text-[10px] text-blue-700/80 dark:text-blue-300/80">Tempel URL produk; nama, gambar, dan harga akan dibaca otomatis jika tersedia.</div>
          </div>
          <span class="text-[10px] font-mono font-bold text-blue-700 dark:text-blue-300 whitespace-nowrap">Site ID 127950</span>
        </div>
        <div class="flex flex-col sm:flex-row gap-2">
          <input v-model="merchantUrl" type="url" placeholder="https://www.tokopedia.com/..." class="flex-1 px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none" @keyup.enter.prevent="handleMerchantImport" />
          <button type="button" @click="handleMerchantImport" :disabled="isImporting || !merchantUrl.trim()" class="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold disabled:opacity-50 flex items-center justify-center gap-1.5">
            <RefreshCw :class="['w-3.5 h-3.5', isImporting ? 'animate-spin' : '']" />
            {{ isImporting ? 'Membaca...' : 'Ambil Data' }}
          </button>
        </div>
        <p v-if="importMessage" :class="['text-[10px] font-semibold', importFailed ? 'text-red-600' : 'text-emerald-700']">{{ importMessage }}</p>
      </div>
      <form @submit.prevent="handleSubmit" class="space-y-3.5">
        <!-- Nama Produk & Merchant -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="sm:col-span-2">
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Nama Produk <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="form.name" 
              type="text" 
              required 
              placeholder="Contoh: Skintific 5X Ceramide Barrier Moisture Gel 50g" 
              class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Merchant / Platform <span class="text-red-500">*</span>
            </label>
            <select 
              v-model="form.merchant" 
              required 
              class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="shopee">Shopee</option>
              <option value="tokopedia">Tokopedia</option>
              <option value="lazada">Lazada</option>
              <option value="tiktok_shop">TikTok Shop</option>
              <option value="traveloka">Traveloka</option>
              <option value="accesstrade">ACCESSTRADE (Umum)</option>
              <option value="other">Lainnya / Merchant Lain</option>
            </select>
          </div>
        </div>

        <!-- Vertical & Subkategori MVP -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Layanan / Vertikal</label>
            <select v-model="form.vertical" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="marketplace">Marketplace</option>
              <option value="travel">Travel</option>
              <option value="digital">Internet & Digital</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Subkategori</label>
            <select v-model="form.subcategory" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="">Pilih subkategori</option>
              <option v-if="form.vertical === 'marketplace'" value="gadget">Gadget & Elektronik</option>
              <option v-if="form.vertical === 'marketplace'" value="baby">Ibu & Bayi</option>
              <option v-if="form.vertical === 'marketplace'" value="beauty">Kecantikan & Skincare</option>
              <option v-if="form.vertical === 'marketplace'" value="kitchen">Dapur & Kuliner</option>
              <option v-if="form.vertical === 'marketplace'" value="home">Rumah Tangga</option>
              <option v-if="form.vertical === 'marketplace'" value="fashion">Fashion & Hijab</option>
              <option v-if="form.vertical === 'travel'" value="hotel">Hotel</option>
              <option v-if="form.vertical === 'travel'" value="flight">Tiket Pesawat</option>
              <option v-if="form.vertical === 'travel'" value="activity">Aktivitas Wisata</option>
              <option v-if="form.vertical === 'digital'" value="hosting">Hosting</option>
              <option v-if="form.vertical === 'digital'" value="domain">Domain</option>
              <option v-if="form.vertical === 'digital'" value="data-package">Paket Data</option>
              <option v-if="form.vertical === 'digital'" value="software">Software</option>
            </select>
          </div>
        </div>
        <!-- Link Affiliate & Link Produk Asli -->
        <div>
          <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Link Tracking Afiliasi (ACCESSTRADE / Custom Link) <span class="text-red-500">*</span>
          </label>
          <input 
            v-model="form.affiliate_url" 
            type="url" 
            required 
            placeholder="https://accesstrade.co.id/click?site_id=... atau https://shope.ee/..." 
            class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-mono font-semibold focus:ring-2 focus:ring-emerald-500 outline-none" 
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Link Produk Asli (Opsional)
          </label>
          <input 
            v-model="form.product_url" 
            type="url" 
            placeholder="https://shopee.co.id/product/1234/5678" 
            class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-mono font-semibold focus:ring-2 focus:ring-emerald-500 outline-none" 
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">ACCESSTRADE Site ID</label>
            <input v-model="form.site_id" type="text" placeholder="127950" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-mono font-semibold focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">URL Sumber Traffic</label>
            <input v-model="form.site_url" type="url" placeholder="https://belanjaklik.my.id" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        </div>
        <!-- URL Gambar & Live Preview -->
        <div>
          <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            URL Gambar Produk (Opsional)
          </label>
          <div class="flex gap-2 items-center">
            <input 
              v-model="form.image_url" 
              type="url" 
              placeholder="https://cf.shopee.co.id/file/..." 
              class="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-mono font-semibold focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
            <div class="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0 flex items-center justify-center">
              <img 
                v-if="form.image_url" 
                :src="proxyImageUrl(form.image_url)" 
                alt="Preview" 
                class="w-full h-full object-cover" 
                @error="($event.target as HTMLImageElement).src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=150'"
              />
              <ImageIcon v-else class="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        <!-- Harga, Harga Coret, & Komisi (%) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Harga Promo (Rp)
            </label>
            <input 
              v-model.number="form.price" 
              type="number" 
              min="0"
              placeholder="Contoh: 129000" 
              class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-bold font-mono focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Harga Coret / Asli (Rp)
            </label>
            <input 
              v-model.number="form.original_price" 
              type="number" 
              min="0"
              placeholder="Contoh: 169000" 
              class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-bold font-mono focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Komisi (%)
            </label>
            <input 
              v-model.number="form.commission_rate" 
              type="number" 
              step="0.1" 
              min="0" 
              max="100"
              placeholder="Contoh: 5.5" 
              class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-bold font-mono focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
          </div>
        </div>

        <!-- Nama Toko & Kategori -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Nama Toko / Seller (Opsional)
            </label>
            <input 
              v-model="form.shop_name" 
              type="text" 
              placeholder="Contoh: Skintific Official Store" 
              class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Kategori Produk (Opsional)
            </label>
            <input 
              v-model="form.category" 
              type="text" 
              placeholder="Contoh: Kecantikan / Skincare" 
              class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
          </div>
        </div>

        <!-- Deskripsi -->
        <div>
          <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Catatan / Deskripsi Produk
          </label>
          <textarea 
            v-model="form.description" 
            rows="2" 
            placeholder="Keterangan promo, varian, atau catatan khusus produk ini..." 
            class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
          ></textarea>
        </div>

        <!-- Status Aktif & Sumber Input -->
        <div class="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700">
          <label class="flex items-center gap-2 cursor-pointer font-bold text-xs text-gray-800 dark:text-gray-200">
            <input 
              type="checkbox" 
              v-model="form.is_active" 
              class="w-4 h-4 accent-emerald-600 rounded" 
            />
            <span>Tampilkan Produk ini di Halaman "Rekomendasi Belanja Hari Ini" (Aktif)</span>
          </label>

          <span class="text-[10px] font-mono font-bold text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700">
            Source: {{ form.source || 'manual_link' }}
          </span>
        </div>

        <!-- Action Buttons -->
        <div class="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-2">
          <button 
            type="button" 
            @click="$emit('close')" 
            class="px-4 py-2.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Batal
          </button>

          <button 
            type="submit" 
            :disabled="isSubmitting" 
            class="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Save class="w-4 h-4" />
            <span>{{ isSubmitting ? 'Menyimpan...' : 'Simpan Produk Afiliasi' }}</span>
          </button>
        </div>
      </form>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Save, Image as ImageIcon, RefreshCw } from 'lucide-vue-next';
import Modal from '@/features/shared/components/Modal.vue';
import type { AffiliateProduct } from '../types';
import { proxyImageUrl } from '@/features/tokosaya-sync/services/ImageProxyService';
import { importMerchantProductFromUrl } from '../services/merchantProductImportService';

const props = defineProps<{
  isOpen: boolean;
  product?: AffiliateProduct | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: Partial<AffiliateProduct>): void;
}>();

const isSubmitting = ref(false);
const isImporting = ref(false);
const merchantUrl = ref('');
const importMessage = ref('');
const importFailed = ref(false);

const form = ref<Partial<AffiliateProduct>>({
  name: '',
  merchant: 'shopee',
  vertical: 'marketplace',
  subcategory: '',
  offer_type: 'product',
  affiliate_url: '',
  product_url: '',
  image_url: '',
  price: undefined,
  original_price: undefined,
  commission_rate: undefined,
  shop_name: '',
  category: '',
  description: '',
  is_active: true,
  source: 'manual_link',
  campaign_id: 'manual',
  site_id: '127950',
  site_url: ''
});

watch(() => props.product, (newVal) => {
  if (newVal) {
    form.value = {
      id: newVal.id,
      name: newVal.name || '',
      merchant: newVal.merchant || 'shopee',
      vertical: newVal.vertical || 'marketplace',
      subcategory: newVal.subcategory || '',
      offer_type: newVal.offer_type || 'product',
      affiliate_url: newVal.affiliate_url || '',
      product_url: newVal.product_url || '',
      image_url: newVal.image_url || '',
      price: newVal.price || undefined,
      original_price: newVal.original_price || undefined,
      commission_rate: newVal.commission_rate || undefined,
      shop_name: newVal.shop_name || '',
      category: newVal.category || '',
      description: newVal.description || '',
      is_active: newVal.is_active ?? true,
      source: newVal.source || 'manual_link',
      campaign_id: newVal.campaign_id || 'manual',
      site_id: newVal.site_id || 'legacy',
      site_url: newVal.site_url || '',
      ...(inferExistingClassification(newVal) || {})
    };
  } else {
    form.value = {
      name: '',
      merchant: 'shopee',
      vertical: 'marketplace',
      subcategory: '',
      offer_type: 'product',
      affiliate_url: '',
      product_url: '',
      image_url: '',
      price: undefined,
      original_price: undefined,
      commission_rate: undefined,
      shop_name: '',
      category: '',
      description: '',
      is_active: true,
      source: 'manual_link',
      campaign_id: 'manual',
  site_id: '127950',
  site_url: ''
    };
  }
}, { immediate: true });

function inferExistingClassification(product: Partial<AffiliateProduct>) {
  const text = `${product.name || ''} ${product.category || ''} ${product.affiliate_url || ''} ${product.product_url || ''}`.toLowerCase();
  if (text.includes('traveloka') || text.includes('travel.prf.hn') || text.includes('attraction')) {
    return {
      merchant: 'traveloka',
      vertical: 'travel' as const,
      subcategory: text.includes('hotel') ? 'hotel' : text.includes('flight') || text.includes('pesawat') ? 'flight' : 'activity',
      offer_type: 'booking'
    };
  }
  return null;
};
const handleMerchantImport = async () => {
  if (!merchantUrl.value.trim() || isImporting.value) return;
  isImporting.value = true;
  importMessage.value = '';
  importFailed.value = false;
  try {
    const metadata = await importMerchantProductFromUrl(merchantUrl.value);
    form.value = {
      ...form.value,
      name: metadata.name || form.value.name || '',
      merchant: metadata.merchant || form.value.merchant || 'other',
      product_url: metadata.product_url,
      affiliate_url: metadata.affiliate_url,
      site_id: metadata.site_id,
      site_url: 'https://belanjaklik.my.id',
      image_url: metadata.image_url || form.value.image_url || '',
      price: metadata.price || form.value.price,
      original_price: metadata.original_price || form.value.original_price,
      shop_name: metadata.shop_name || form.value.shop_name || '',
      description: metadata.description || form.value.description || '',
      source: 'merchant_url_import',
      campaign_id: form.value.campaign_id || 'manual'
    };
    merchantUrl.value = metadata.product_url;
    importMessage.value = 'Data produk berhasil diambil. Silakan periksa sebelum disimpan.';
  } catch (error) {
    importFailed.value = true;
    importMessage.value = error instanceof Error ? error.message : 'Gagal membaca URL merchant.';
  } finally {
    isImporting.value = false;
  }
};
const handleSubmit = async () => {
  if (!form.value.name?.trim() || !form.value.affiliate_url?.trim()) return;
  
  isSubmitting.value = true;
  try {
    emit('save', { ...form.value });
  } finally {
    isSubmitting.value = false;
  }
};
</script>





