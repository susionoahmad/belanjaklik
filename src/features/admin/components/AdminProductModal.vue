<template>
  <Modal :isOpen="isOpen" @close="$emit('close')">
    <div class="space-y-4 max-h-[85vh] overflow-y-auto pr-1">
      <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
        <h3 class="font-bold text-base text-gray-900 dark:text-white">
          {{ isEditing ? 'Edit Produk Katalog' : 'Tambah Produk Baru' }}
        </h3>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-3.5">
        <div>
          <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nama Produk</label>
          <input v-model="form.name" type="text" required placeholder="Indomie Goreng 85g" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Harga Normal (Rp)</label>
            <input v-model.number="form.price" type="number" required placeholder="3100" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none" />
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Harga Promo (Rp)</label>
            <input v-model.number="form.promo_price" type="number" placeholder="2900" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Brand / Merk</label>
            <input v-model="form.brand" type="text" placeholder="Indomie" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none" />
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
            <select v-model="form.category_id" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none">
              <option value="">Pilih Kategori</option>
              <option v-for="cat in catalogStore.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Deskripsi Produk</label>
          <textarea v-model="form.description" rows="3" placeholder="Tuliskan deskripsi lengkap produk..." class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none"></textarea>
        </div>

        <!-- Channel Pemenuhan & Purchase Method Configuration -->
        <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
          <div class="font-bold text-xs text-brand-red uppercase tracking-wider">Konfigurasi Channel & Purchase Method</div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Channel Pemenuhan</label>
              <select v-model="form.channel_id" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none">
                <option value="">Default Channel</option>
                <option v-for="ch in catalogStore.channels" :key="ch.id" :value="ch.id">{{ ch.name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Metode Pembelian</label>
              <select v-model="form.purchase_method" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none">
                <option value="owner_checkout">🛒 Asisten Belanja (Keranjang WhatsApp)</option>
                <option value="self_checkout">✅ Beli Langsung (Redirect Link External)</option>
                <option value="quote_request">💬 Permintaan Penawaran Grosir B2B</option>
                <option value="coming_soon">⏳ Segera Hadir</option>
              </select>
            </div>
          </div>

          <!-- External Product Code (Visible for Self Checkout) -->
          <div v-if="form.purchase_method === 'self_checkout'">
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Kode Produk Eksternal (External Product Code)</label>
            <input v-model="form.external_product_code" type="text" placeholder="Contoh: 860865" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs font-mono font-bold focus:ring-2 focus:ring-brand-red outline-none" />
          </div>

          <!-- Dynamic Live URL Preview Generated via UrlGeneratorService -->
          <div v-if="form.purchase_method === 'self_checkout'" class="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
            <div class="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Preview Live URL Destinasi:</div>
            <div class="font-mono text-[11px] text-emerald-900 dark:text-emerald-200 break-all select-all font-semibold">
              {{ previewUrl }}
            </div>
          </div>
        </div>

        <!-- Multi-Image Uploader & Gallery Section -->
        <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-gray-700 dark:text-gray-300">Galeri Foto Produk (Bisa Lebih dari 1 Foto)</label>
            <span class="text-[10px] text-gray-500 font-semibold">{{ form.images.length }} Foto</span>
          </div>

          <!-- Upload Trigger Button -->
          <div class="flex flex-wrap items-center gap-2">
            <label class="bg-brand-red hover:bg-brand-red-dark text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm">
              <Upload class="w-4 h-4" />
              <span>{{ isUploading ? 'Mengunggah...' : 'Upload File Foto (Bisa Banyak)' }}</span>
              <input type="file" accept="image/*" multiple class="hidden" :disabled="isUploading" @change="handleFileUpload" />
            </label>

            <span class="text-[11px] text-gray-400">atau masukkan URL gambar di bawah</span>
          </div>

          <!-- Image URL Input -->
          <div class="flex gap-2">
            <input v-model="newImageUrl" type="text" placeholder="https://images.unsplash.com/..." class="flex-1 px-3 py-2 rounded-xl border text-xs font-semibold" />
            <button type="button" @click="addImageUrl" class="px-3 py-2 bg-gray-200 dark:bg-gray-600 rounded-xl text-xs font-bold hover:bg-gray-300">Tambah URL</button>
          </div>

          <!-- Multi Image Thumbnail Grid -->
          <div v-if="form.images.length > 0" class="grid grid-cols-4 sm:grid-cols-5 gap-2 pt-1">
            <div v-for="(img, idx) in form.images" :key="idx" class="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
              <img :src="proxyImageUrl(img)" class="w-full h-full object-cover" @error="($event.target as HTMLImageElement).src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=150'" />
              
              <!-- Primary Badge -->
              <span v-if="idx === 0" class="absolute top-1 left-1 bg-brand-red text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">Utama</span>
              
              <!-- Action Overlay -->
              <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button type="button" @click="setAsPrimaryImage(idx)" title="Jadikan Foto Utama" class="p-1 bg-white text-gray-900 rounded-md text-[10px] font-bold">⭐</button>
                <button type="button" @click="removeImage(idx)" title="Hapus Foto" class="p-1 bg-red-600 text-white rounded-md text-[10px] font-bold">✕</button>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-3 flex items-center gap-2">
          <button v-if="isEditing" type="button" @click="handleDelete" class="px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:border-red-900 border border-red-200 flex items-center gap-1.5">
            <Trash2 class="w-4 h-4" />
            <span>Hapus</span>
          </button>
          <button type="button" @click="$emit('close')" class="flex-1 py-2.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-50">Batal</button>
          <button type="submit" class="flex-1 py-2.5 rounded-xl text-xs font-extrabold bg-brand-red text-white hover:bg-brand-red-dark shadow-md">Simpan Produk</button>
        </div>
      </form>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { Upload, Trash2 } from 'lucide-vue-next';
import Modal from '../../shared/components/Modal.vue';
import type { Product, PurchaseMethod, FulfillmentChannel } from '../../shared/types';
import { useCatalogStore } from '../../catalog/stores/catalogStore';
import { dataService } from '../../shared/db/dataService';
import { storageService } from '../../shared/db/storageService';
import { UrlGeneratorService } from '../../purchase/services/UrlGeneratorService';
import { proxyImageUrl } from '../../tokosaya-sync/services/ImageProxyService';

const props = defineProps<{
  isOpen: boolean;
  product?: Product | null;
}>();

const emit = defineEmits(['close', 'saved']);
const catalogStore = useCatalogStore();

const isEditing = computed(() => !!props.product?.id);
const isUploading = ref(false);
const newImageUrl = ref('');

const form = ref<{
  id?: string;
  name: string;
  price: number;
  promo_price?: number;
  brand?: string;
  description?: string;
  category_id?: string;
  channel_id?: string;
  purchase_method: PurchaseMethod;
  external_product_code?: string;
  unit: string;
  image_url: string;
  images: string[];
  is_available: boolean;
}>({
  name: '',
  price: 0,
  promo_price: undefined,
  brand: '',
  description: '',
  category_id: '',
  channel_id: '',
  purchase_method: 'owner_checkout',
  external_product_code: '',
  unit: 'pcs',
  image_url: '',
  images: [],
  is_available: true
});

watch(() => props.product, (newP) => {
  if (newP) {
    const list = newP.images && newP.images.length > 0 
      ? [...newP.images] 
      : (newP.image_url ? [newP.image_url] : []);

    form.value = {
      id: newP.id,
      name: newP.name,
      price: newP.price,
      promo_price: newP.promo_price,
      brand: newP.brand || '',
      description: newP.description || '',
      category_id: newP.category_id || '',
      channel_id: newP.channel_id || '',
      purchase_method: newP.purchase_method || 'owner_checkout',
      external_product_code: newP.external_product_code || '',
      unit: newP.unit || 'pcs',
      image_url: newP.image_url || (list[0] || ''),
      images: list,
      is_available: newP.is_available ?? true
    };
  } else {
    form.value = {
      name: '',
      price: 0,
      promo_price: undefined,
      brand: '',
      description: '',
      category_id: '',
      channel_id: '',
      purchase_method: 'owner_checkout',
      external_product_code: '',
      unit: 'pcs',
      image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
      images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'],
      is_available: true
    };
  }
}, { immediate: true });

const selectedChannel = computed<FulfillmentChannel | undefined>(() => {
  return catalogStore.channels.find(c => c.id === form.value.channel_id);
});

const previewUrl = computed(() => {
  const dummyProduct: any = {
    id: form.value.id || 'preview',
    name: form.value.name,
    slug: form.value.name.toLowerCase().replace(/\s+/g, '-'),
    external_product_code: form.value.external_product_code
  };
  return UrlGeneratorService.generateUrl(dummyProduct, selectedChannel.value);
});

const handleFileUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  isUploading.value = true;
  try {
    for (let i = 0; i < target.files.length; i++) {
      const file = target.files[i];
      const uploadedUrl = await storageService.uploadProductImage(file);
      if (uploadedUrl) {
        form.value.images.push(uploadedUrl);
        if (!form.value.image_url) {
          form.value.image_url = uploadedUrl;
        }
      }
    }
  } catch (err) {
    alert('Gagal mengunggah beberapa file gambar.');
  } finally {
    isUploading.value = false;
    target.value = '';
  }
};

const addImageUrl = () => {
  if (newImageUrl.value.trim()) {
    form.value.images.push(newImageUrl.value.trim());
    if (!form.value.image_url) {
      form.value.image_url = newImageUrl.value.trim();
    }
    newImageUrl.value = '';
  }
};

const setAsPrimaryImage = (idx: number) => {
  if (idx >= 0 && idx < form.value.images.length) {
    const selected = form.value.images.splice(idx, 1)[0];
    form.value.images.unshift(selected);
    form.value.image_url = selected;
  }
};

const removeImage = (idx: number) => {
  form.value.images.splice(idx, 1);
  form.value.image_url = form.value.images[0] || '';
};

const handleSubmit = async () => {
  const primaryImg = form.value.images[0] || form.value.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400';
  const selectedCat = catalogStore.categories.find(c => c.id === form.value.category_id);
  const payload: Partial<Product> = {
    ...form.value,
    category_id: form.value.category_id,
    category: selectedCat ? selectedCat.name : 'Health & Beauty',
    image_url: primaryImg,
    images: form.value.images,
    slug: form.value.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    is_promo: !!form.value.promo_price && form.value.promo_price < form.value.price
  };

  await dataService.saveProduct(payload);
  emit('saved');
  emit('close');
};

const handleDelete = async () => {
  if (!form.value.id) return;
  if (confirm(`Yakin ingin menghapus produk "${form.value.name}"?`)) {
    const targetId = form.value.id;
    emit('close');
    await dataService.deleteProduct(targetId);
    emit('saved');
  }
};

</script>
