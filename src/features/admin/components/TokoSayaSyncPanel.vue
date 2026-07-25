<template>
  <div class="space-y-4">
    <!-- Header & URL Input Form -->
    <div class="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <RefreshCw class="w-5 h-5 text-brand-red animate-spin-slow" />
            <span>Toko Saya Product Sync Engine</span>
          </h3>
          <p class="text-xs text-gray-500 mt-0.5">
            Tempel URL produk resmi Toko Saya Alfamind untuk mengunduh dan menyinkronkan data katalog otomatis.
          </p>
        </div>
      </div>

      <form @submit.prevent="handleSyncInput" class="flex flex-col sm:flex-row gap-2 pt-1">
        <input 
          v-model="inputUrl"
          type="url"
          required
          placeholder="https://tokovirtualku.id/nessamart/detail/860865"
          class="flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-mono font-semibold focus:ring-2 focus:ring-brand-red outline-none"
        />
        <button 
          type="submit" 
          :disabled="isSyncing"
          class="bg-brand-red hover:bg-brand-red-dark text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition-all shrink-0 cursor-pointer"
        >
          <RefreshCw :class="{'animate-spin': isSyncing}" class="w-4 h-4" />
          <span>{{ isSyncing ? 'Proses Sync...' : 'Sinkronkan URL Produk' }}</span>
        </button>
      </form>

      <!-- Info banner about image scraping limitation -->
      <div class="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
        <ImageIcon class="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <span class="font-bold">Gambar Produk:</span> Karena tokovirtualku.id menggunakan rendering JavaScript (SPA), gambar asli tidak dapat diambil otomatis saat di localhost. 
          Klik ikon <span class="font-bold">🖼️</span> di kolom Aksi untuk menambahkan URL gambar asli secara manual dari halaman produk Toko Saya.
        </div>
      </div>
    </div>

    <!-- Accesstrade Affiliate Integration Panel -->
    <div class="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <Link2 class="w-5 h-5 text-emerald-500" />
            <span>Integrasi Afiliasi Accesstrade Indonesia</span>
          </h3>
          <p class="text-xs text-gray-500 mt-0.5">
            Aktifkan konversi otomatis tautan belanja ke Deep Link Afiliasi Accesstrade Indonesia.
          </p>
        </div>
        <span class="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {{ accesstradeConfig.isEnabled ? '● Afiliasi Aktif' : '○ Afiliasi Non-Aktif' }}
        </span>
      </div>

      <form @submit.prevent="saveAccesstradeSettings" class="space-y-3 pt-1">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Publisher Site ID (Accesstrade)</label>
            <input 
              v-model="accesstradeConfig.siteId" 
              type="text" 
              placeholder="Contoh: 123456" 
              class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">SubID / RK ID (Opsional)</label>
            <input 
              v-model="accesstradeConfig.rkId" 
              type="text" 
              placeholder="Contoh: belanjaklik_app" 
              class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
          </div>
        </div>

        <div class="flex items-center justify-between pt-1">
          <label class="flex items-center gap-2 font-bold text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" v-model="accesstradeConfig.isEnabled" class="w-4 h-4 accent-emerald-600 rounded" />
            <span>Aktifkan Konversi Otomatis Deep Link Afiliasi</span>
          </label>

          <button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-sm cursor-pointer">
            Simpan Pengaturan Afiliasi
          </button>
        </div>
      </form>
    </div>

    <!-- Sources Data Table -->
    <div class="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-sm text-gray-900 dark:text-white">
          Daftar Sumber Produk Toko Saya ({{ sources.length }})
        </h4>
        <button @click="loadSources" :disabled="isRefreshing" class="text-xs text-brand-blue font-bold hover:underline flex items-center gap-1 disabled:opacity-50">
          <RefreshCw :class="{'animate-spin': isRefreshing}" class="w-3.5 h-3.5" />
          <span>{{ isRefreshing ? 'Memuat...' : 'Refresh Table' }}</span>
        </button>
      </div>

      <div v-if="sources.length === 0" class="p-8 text-center space-y-2 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
        <p class="text-xs text-gray-400 font-semibold">Belum ada URL produk Toko Saya yang disinkronkan.</p>
        <p class="text-[11px] text-gray-400">Tempelkan URL produk Toko Saya pada form di atas untuk memulai sinkronisasi otomatis.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700 text-gray-400 font-bold uppercase text-[10px]">
              <th class="py-2.5 px-3">Produk</th>
              <th class="py-2.5 px-3">Kode External</th>
              <th class="py-2.5 px-3">Status Sync</th>
              <th class="py-2.5 px-3">Terakhir Sync</th>
              <th class="py-2.5 px-3">Sync Berikutnya</th>
              <th class="py-2.5 px-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700 font-semibold">
            <tr v-for="src in sources" :key="src.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
              <!-- Product Preview -->
              <td class="py-3 px-3">
                <div class="flex items-center gap-3">
                  <img :src="proxyImageUrl(src.product_image_url || '')" class="w-10 h-10 object-cover rounded-xl shrink-0" @error="($event.target as HTMLImageElement).src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=150'" />
                  <div>
                    <div class="font-bold text-gray-900 dark:text-white line-clamp-1">{{ src.product_name || 'Toko Saya Product' }}</div>
                    <a :href="src.source_url" target="_blank" class="text-[10px] text-blue-500 hover:underline font-mono line-clamp-1 flex items-center gap-1">
                      <span>{{ src.source_url }}</span>
                      <ExternalLink class="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </div>
              </td>

              <!-- External Code -->
              <td class="py-3 px-3 font-mono text-[11px] text-gray-600 dark:text-gray-300">
                {{ src.external_product_code }}
              </td>

              <!-- Status Badge -->
              <td class="py-3 px-3">
                <span 
                  class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-block"
                  :class="getStatusBadgeClass(src.sync_status)"
                >
                  {{ src.sync_status }}
                </span>
                <p v-if="src.last_error" class="text-[9px] text-red-500 mt-0.5 line-clamp-1" :title="src.last_error">
                  {{ src.last_error }}
                </p>
              </td>

              <!-- Timestamps -->
              <td class="py-3 px-3 text-gray-500 text-[11px]">
                {{ src.last_synced_at ? new Date(src.last_synced_at).toLocaleString('id-ID') : '-' }}
              </td>

              <td class="py-3 px-3 text-gray-500 text-[11px]">
                {{ src.next_sync_at ? new Date(src.next_sync_at).toLocaleString('id-ID') : '-' }}
              </td>

              <!-- Actions -->
              <td class="py-3 px-3 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <!-- Patch Images Button -->
                  <button @click="openImagePatch(src)" title="Tambah/Ubah Gambar Produk" class="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950 rounded-lg">
                    <ImageIcon class="w-4 h-4" />
                  </button>

                  <!-- Force Sync -->
                  <button @click="handleForceSync(src)" title="Paksa Sinkronkan Sekarang" class="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg">
                    <RefreshCw class="w-4 h-4" />
                  </button>

                  <!-- Pause / Resume -->
                  <button v-if="src.sync_status === 'paused'" @click="handleResume(src)" title="Lanjutkan Auto Sync" class="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg">
                    <Play class="w-4 h-4" />
                  </button>
                  <button v-else @click="handlePause(src)" title="Jeda Auto Sync" class="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 rounded-lg">
                    <Pause class="w-4 h-4" />
                  </button>

                  <!-- Delete -->
                  <button @click="handleDelete(src)" title="Hapus Sumber Produk" class="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Image Patch Modal -->
    <div v-if="imagePatchTarget" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" @click.self="imagePatchTarget = null">
      <div class="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <ImageIcon class="w-5 h-5 text-purple-600" />
            <span>Tambah / Ubah Gambar Produk</span>
          </h3>
          <button @click="imagePatchTarget = null" class="text-gray-400 hover:text-gray-600 font-bold">✕</button>
        </div>

        <div class="bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
          <div class="font-bold mb-1">{{ imagePatchTarget.product_name }}</div>
          <a :href="imagePatchTarget.source_url" target="_blank" class="text-blue-500 hover:underline font-mono text-[11px] flex items-center gap-1">
            {{ imagePatchTarget.source_url }} <ExternalLink class="w-3 h-3" />
          </a>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-bold text-gray-700 dark:text-gray-300">
            URL Gambar (paste dari halaman Toko Saya, satu per baris):
          </label>
          <textarea 
            v-model="imagePatchUrls"
            rows="5"
            placeholder="https://cdn.alfagift.id/product/image1.jpg&#10;https://cdn.alfagift.id/product/image2.jpg&#10;https://cdn.alfagift.id/product/image3.jpg"
            class="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono focus:ring-2 focus:ring-purple-500 outline-none resize-none"
          />
          <p class="text-[11px] text-gray-400">
            💡 Buka halaman Toko Saya → klik kanan foto produk → "Salin alamat gambar" → paste di sini.
          </p>
        </div>

        <!-- Preview -->
        <div v-if="parsedPatchUrls.length > 0" class="flex items-center gap-2 flex-wrap">
          <img 
            v-for="(url, i) in parsedPatchUrls" 
            :key="i"
            :src="url"
            class="w-16 h-16 object-cover rounded-xl border-2 border-purple-200"
            @error="($event.target as HTMLImageElement).style.display='none'"
          />
        </div>

        <div class="flex gap-2 pt-1">
          <button 
            @click="imagePatchTarget = null" 
            class="flex-1 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            Batal
          </button>
          <button 
            @click="handleApplyImagePatch"
            :disabled="parsedPatchUrls.length === 0 || isPatchSaving"
            class="flex-1 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw v-if="isPatchSaving" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isPatchSaving ? 'Menyimpan...' : `Simpan ${parsedPatchUrls.length} Gambar` }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RefreshCw, ExternalLink, Play, Pause, Trash2, Image as ImageIcon, Link2 } from 'lucide-vue-next';
import type { ProductSource } from '../../shared/types';
import { dataService } from '../../shared/db/dataService';
import { ProductSyncService } from '../../tokosaya-sync/services/ProductSyncService';
import { useCatalogStore } from '../../catalog/stores/catalogStore';
import { useAdminStore } from '../stores/adminStore';
import { proxyImageUrl } from '../../tokosaya-sync/services/ImageProxyService';
import { AccesstradeService, type AccesstradeConfig } from '../../affiliate/services/AccesstradeService';

const catalogStore = useCatalogStore();
const adminStore = useAdminStore();
const inputUrl = ref('');
const isSyncing = ref(false);
const isRefreshing = ref(false);
const sources = ref<ProductSource[]>([]);

// Accesstrade Config state
const accesstradeConfig = ref<AccesstradeConfig>({
  siteId: '',
  rkId: '',
  isEnabled: false
});

// Image Patch state
const imagePatchTarget = ref<ProductSource | null>(null);
const imagePatchUrls = ref('');
const isPatchSaving = ref(false);

const parsedPatchUrls = computed(() => {
  return imagePatchUrls.value
    .split('\n')
    .map(u => u.trim())
    .filter(u => u.startsWith('http'));
});

onMounted(() => {
  loadSources();
  accesstradeConfig.value = AccesstradeService.getConfig();
});

const saveAccesstradeSettings = () => {
  AccesstradeService.saveConfig(accesstradeConfig.value);
  alert('✓ Pengaturan Afiliasi Accesstrade Indonesia berhasil disimpan!');
};

const loadSources = async () => {
  isRefreshing.value = true;
  try {
    sources.value = await dataService.fetchProductSources();
  } finally {
    isRefreshing.value = false;
  }
};

const openImagePatch = (src: ProductSource) => {
  imagePatchTarget.value = src;
  imagePatchUrls.value = src.product_image_url ? src.product_image_url : '';
};

const handleApplyImagePatch = async () => {
  if (!imagePatchTarget.value || parsedPatchUrls.value.length === 0) return;
  isPatchSaving.value = true;
  try {
    const products = await dataService.fetchProducts();
    const linked = products.find(p => p.external_product_code === imagePatchTarget.value!.external_product_code);
    if (linked) {
      await dataService.saveProduct({
        ...linked,
        image_url: parsedPatchUrls.value[0],
        images: parsedPatchUrls.value
      });
      await catalogStore.fetchCatalogData();
      await loadSources();
      imagePatchTarget.value = null;
    }
  } finally {
    isPatchSaving.value = false;
  }
};

const handleSyncInput = async () => {
  if (!inputUrl.value.trim()) return;
  isSyncing.value = true;
  try {
    await ProductSyncService.syncProductUrl(inputUrl.value);
    inputUrl.value = '';
    await loadSources();
    await catalogStore.fetchCatalogData();
  } catch (err: any) {
    alert(err.message || 'Gagal menyinkronkan URL produk.');
  } finally {
    isSyncing.value = false;
  }
};

const handleForceSync = async (src: ProductSource) => {
  try {
    await ProductSyncService.syncProductUrl(src.source_url, src.id);
    await loadSources();
    await catalogStore.fetchCatalogData();
  } catch (err: any) {
    alert(err.message || 'Gagal sinkronisasi ulang.');
  }
};

const handlePause = async (src: ProductSource) => {
  await dataService.saveProductSource({ ...src, sync_status: 'paused' });
  await loadSources();
};

const handleResume = async (src: ProductSource) => {
  await dataService.saveProductSource({ ...src, sync_status: 'synced' });
  await loadSources();
};

const handleDelete = async (src: ProductSource) => {
  if (confirm(`Hapus sumber produk ${src.external_product_code}?`)) {
    await dataService.deleteProductSource(src.id);
    await loadSources();
  }
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'synced':
    case 'active': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
    case 'paused': return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
    case 'error':
    case 'failed': return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }
};
</script>
