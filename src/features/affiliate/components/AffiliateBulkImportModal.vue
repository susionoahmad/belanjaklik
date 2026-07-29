<template>
  <Modal :isOpen="isOpen" maxWidthClass="max-w-4xl" @close="handleClose">
    <div class="space-y-4 max-h-[82vh] overflow-y-auto pr-1">
      <!-- Modal Header & Wizard Steps -->
      <div class="border-b border-gray-100 dark:border-gray-700 pb-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <UploadCloud class="w-5 h-5 text-emerald-500" />
            <span>Import Massal Product Feed (CSV / Excel)</span>
          </h3>
          <span class="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Langkah {{ step }} dari 3
          </span>
        </div>
        <p class="text-xs text-gray-500 mt-0.5">
          Upload file Product Feed hasil download ACCESSTRADE untuk import ribuan produk promo sekaligus dengan pembersihan otomatis.
        </p>

        <!-- Wizard Step Indicators -->
        <div class="grid grid-cols-3 gap-2 mt-3">
          <div 
            class="py-1.5 px-2 rounded-xl text-[10px] font-bold text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
            :class="step === 1 ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'"
            @click="selectedFile && (step = 1)"
          >
            <span>1. Upload File</span>
          </div>

          <div 
            class="py-1.5 px-2 rounded-xl text-[10px] font-bold text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
            :class="step === 2 ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'"
            @click="parsedRows.length > 0 && (step = 2)"
          >
            <span>2. Map & Preview Data</span>
          </div>

          <div 
            class="py-1.5 px-2 rounded-xl text-[10px] font-bold text-center transition-colors flex items-center justify-center gap-1"
            :class="step === 3 ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'"
          >
            <span>3. Hasil Import</span>
          </div>
        </div>
      </div>

      <!-- STEP 1: Upload File -->
      <div v-if="step === 1" class="space-y-4">
        <div 
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleFileDrop"
          class="border-2 border-dashed rounded-3xl p-8 text-center transition-colors flex flex-col items-center justify-center cursor-pointer"
          :class="isDragging ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30' : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 hover:border-emerald-500'"
          @click="triggerFileInput"
        >
          <input 
            ref="fileInputRef"
            type="file" 
            accept=".csv, .xlsx, .xls" 
            class="hidden" 
            @change="handleFileSelect"
          />

          <div class="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <FileSpreadsheet class="w-8 h-8" />
          </div>

          <div class="font-extrabold text-sm text-gray-900 dark:text-white">
            {{ selectedFile ? selectedFile.name : 'Klik atau seret file Product Feed di sini' }}
          </div>

          <p class="text-xs text-gray-500 mt-1 max-w-sm">
            Menerima format file <strong class="text-emerald-600">.CSV</strong>, <strong class="text-emerald-600">.XLSX</strong>, atau <strong class="text-emerald-600">.XLS</strong> hasil download dari ACCESSTRADE.
          </p>

          <span v-if="selectedFile" class="mt-3 inline-block text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-3 py-1 rounded-full">
            Ukuran: {{ (selectedFile.size / (1024 * 1024)).toFixed(2) }} MB
          </span>
        </div>

        <!-- Default Settings -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Merchant / Platform Default</label>
            <select v-model="defaultMerchant" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="shopee">Shopee</option>
              <option value="tokopedia">Tokopedia</option>
              <option value="lazada">Lazada</option>
              <option value="tiktok_shop">TikTok Shop</option>
              <option value="other">Lainnya / Merchant Lain</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Campaign ID Default (Opsional)</label>
            <input v-model="defaultCampaignId" type="text" placeholder="manual_feed" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">ACCESSTRADE Site ID</label>
            <input v-model="defaultSiteId" type="text" placeholder="contoh: 127950" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">URL Sumber Traffic</label>
            <input v-model="defaultSiteUrl" type="url" placeholder="https://belanjaklik.my.id" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button 
            type="button" 
            @click="handleClose" 
            class="px-4 py-2.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700"
          >
            Batal
          </button>

          <button 
            type="button" 
            :disabled="!selectedFile || isParsing" 
            @click="parseAndNext" 
            class="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer transition-all"
          >
            <span v-if="isParsing" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span>{{ isParsing ? 'Membaca File...' : 'Lanjut ke Pemetaan & Preview â†’' }}</span>
          </button>
        </div>
      </div>

      <!-- STEP 2: Mapping & Interactive Data Preview -->
      <div v-else-if="step === 2" class="space-y-4">
        <!-- Collapsible Mapping Section -->
        <div class="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sliders class="w-4 h-4 text-emerald-500" />
              <span>Pemetaan Kolom File ke Tabel Database</span>
            </h4>
            <span class="text-[10px] text-gray-400 font-mono">Auto-detected dari Header File</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label class="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-0.5">Nama Produk <span class="text-red-500">*</span></label>
              <select v-model="mapping.name" @change="updatePreview" class="w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold bg-white dark:bg-gray-700">
                <option value="">-- Pilih Kolom Nama --</option>
                <option v-for="h in fileHeaders" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-0.5">Link Affiliate Tracking <span class="text-red-500">*</span></label>
              <select v-model="mapping.affiliate_url" @change="updatePreview" class="w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold bg-white dark:bg-gray-700">
                <option value="">-- Pilih Kolom Link Affiliate --</option>
                <option v-for="h in fileHeaders" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-0.5">Link Produk Asli</label>
              <select v-model="mapping.product_url" @change="updatePreview" class="w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold bg-white dark:bg-gray-700">
                <option value="">-- Pilih Kolom Link Asli --</option>
                <option v-for="h in fileHeaders" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-0.5">URL Gambar</label>
              <select v-model="mapping.image_url" @change="updatePreview" class="w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold bg-white dark:bg-gray-700">
                <option value="">-- Pilih Kolom Gambar --</option>
                <option v-for="h in fileHeaders" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-0.5">Harga Promo (Rp)</label>
              <select v-model="mapping.price" @change="updatePreview" class="w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold bg-white dark:bg-gray-700">
                <option value="">-- Pilih Kolom Harga --</option>
                <option v-for="h in fileHeaders" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-0.5">Harga Coret / Asli (Rp)</label>
              <select v-model="mapping.original_price" @change="updatePreview" class="w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold bg-white dark:bg-gray-700">
                <option value="">-- Pilih Kolom Harga Coret --</option>
                <option v-for="h in fileHeaders" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-0.5">Komisi (%)</label>
              <select v-model="mapping.commission_rate" @change="updatePreview" class="w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold bg-white dark:bg-gray-700">
                <option value="">-- Pilih Kolom Komisi --</option>
                <option v-for="h in fileHeaders" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-0.5">Nama Toko / Seller</label>
              <select v-model="mapping.shop_name" @change="updatePreview" class="w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold bg-white dark:bg-gray-700">
                <option value="">-- Pilih Kolom Toko --</option>
                <option v-for="h in fileHeaders" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-0.5">Kategori / Sub-Kategori</label>
              <select v-model="mapping.category" @change="updatePreview" class="w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold bg-white dark:bg-gray-700">
                <option value="">-- Pilih Kolom Kategori --</option>
                <option v-for="h in fileHeaders" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Interactive Clean Data Preview -->
        <div class="space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h4 class="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles class="w-4 h-4 text-amber-500 shrink-0" />
              <span>Pratinjau Hasil Pembersihan AI/Regex (15 Baris Pertama)</span>
            </h4>
            <span class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              {{ validPreviewCount }} Valid dari {{ previewItems.length }} sampel
            </span>
          </div>

          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-x-auto overflow-y-auto max-h-72 shadow-2xs">
            <table class="w-full text-left text-[11px] min-w-[680px]">
              <thead class="bg-gray-100 dark:bg-gray-700 text-gray-500 font-bold uppercase sticky top-0 z-10">
                <tr>
                  <th class="p-2">No</th>
                  <th class="p-2">Judul Bersih (Clean Title)</th>
                  <th class="p-2">Harga Promo</th>
                  <th class="p-2">Komisi %</th>
                  <th class="p-2">Kategori</th>
                  <th class="p-2">Status Validasi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr v-for="item in previewItems.slice(0, 15)" :key="item.rawRowIndex" class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td class="p-2 font-mono text-gray-400">{{ item.rawRowIndex }}</td>
                  <td class="p-2">
                    <div class="font-bold text-gray-900 dark:text-white line-clamp-1" :title="item.name">
                      {{ item.name || item.rawName || '-' }}
                    </div>
                    <div v-if="item.rawName !== item.name" class="text-[9px] text-gray-400 line-clamp-1">
                      Asli: {{ item.rawName }}
                    </div>
                  </td>
                  <td class="p-2 font-bold text-emerald-600 whitespace-nowrap">
                    {{ item.price ? formatRupiah(item.price) : '-' }}
                  </td>
                  <td class="p-2 font-bold text-amber-600 whitespace-nowrap">
                    {{ item.commission_rate !== null && item.commission_rate !== undefined ? `${item.commission_rate}%` : '-' }}
                  </td>
                  <td class="p-2 text-gray-500 truncate max-w-[100px]">
                    {{ item.category || '-' }}
                  </td>
                  <td class="p-2 whitespace-nowrap">
                    <span 
                      :class="item.isValid ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'"
                      class="px-2 py-0.5 rounded text-[9px] font-bold"
                    >
                      {{ item.isValid ? 'âœ“ Valid' : item.validationError }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex justify-between items-center pt-2">
          <button 
            type="button" 
            @click="step = 1" 
            class="px-4 py-2.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700"
          >
            â† Kembali
          </button>

          <button 
            type="button" 
            :disabled="validPreviewCount === 0 || isImporting" 
            @click="startImport" 
            class="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer transition-all"
          >
            <span v-if="isImporting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span>{{ isImporting ? `Meng-import (${progressText})...` : `Proses Import (${parsedRows.length} Produk) â†’` }}</span>
          </button>
        </div>
      </div>

      <!-- STEP 3: Summary Report -->
      <div v-else-if="step === 3" class="space-y-4">
        <div class="text-center p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-3xl border border-emerald-100 dark:border-emerald-900 space-y-2">
          <div class="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto">
            <CheckCircle2 class="w-6 h-6" />
          </div>
          <h4 class="font-extrabold text-lg text-gray-900 dark:text-white">Import Produk Feed Selesai!</h4>
          <p class="text-xs text-gray-600 dark:text-gray-300">
            Data produk telah dibersihkan dan berhasil di-upsert ke database.
          </p>
        </div>

        <!-- Summary Metrics Cards -->
        <div v-if="importSummary" class="grid grid-cols-3 gap-3 text-center">
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div class="text-[10px] font-bold text-gray-400 uppercase">Total Baris</div>
            <div class="font-extrabold text-base text-gray-900 dark:text-white">{{ importSummary.totalRows }}</div>
          </div>

          <div class="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl border border-emerald-100 dark:border-emerald-900">
            <div class="text-[10px] font-bold text-emerald-600 uppercase">Berhasil Upsert</div>
            <div class="font-extrabold text-base text-emerald-600">{{ importSummary.successCount }}</div>
          </div>

          <div class="p-3 bg-red-50 dark:bg-red-950/50 rounded-2xl border border-red-100 dark:border-red-900">
            <div class="text-[10px] font-bold text-red-600 uppercase">Gagal / Skipped</div>
            <div class="font-extrabold text-base text-red-600">{{ importSummary.failedCount }}</div>
          </div>
        </div>

        <!-- Failure Details (If any) -->
        <div v-if="importSummary && importSummary.failures.length > 0" class="space-y-2">
          <h5 class="font-bold text-xs text-red-600 dark:text-red-400">Rincian Baris Ditolak / Gagal:</h5>
          <div class="max-h-36 overflow-y-auto border border-red-100 dark:border-red-900 rounded-xl p-2 bg-red-50/50 dark:bg-red-950/30 text-[11px] space-y-1">
            <div v-for="f in importSummary.failures.slice(0, 10)" :key="f.row" class="text-red-700 dark:text-red-300">
              Baris {{ f.row }}: <strong>{{ f.name }}</strong> ({{ f.reason }})
            </div>
            <div v-if="importSummary.failures.length > 10" class="text-gray-400 text-[10px] font-mono">
              ...dan {{ importSummary.failures.length - 10 }} baris gagal lainnya.
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button 
            type="button" 
            @click="handleFinished" 
            class="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md cursor-pointer"
          >
            Tutup & Perbarui Tabel Admin
          </button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { UploadCloud, FileSpreadsheet, Sliders, Sparkles, CheckCircle2 } from 'lucide-vue-next';
import Modal from '@/features/shared/components/Modal.vue';
import { formatRupiah } from '@/features/shared/utils/formatters';
import { 
  parseFeedFile, 
  autoDetectMapping, 
  transformAndCleanRows, 
  bulkUpsertAffiliateFeed,
  type ColumnMappingConfig,
  type ParsedFeedItem,
  type ImportResultSummary
} from '@/features/affiliate/services/affiliateImportService';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'imported'): void;
}>();

const step = ref(1);
const selectedFile = ref<File | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const isParsing = ref(false);
const isImporting = ref(false);
const progressText = ref('0/0');

const defaultMerchant = ref('shopee');
const defaultCampaignId = ref('manual_feed');
const defaultSiteId = ref('');
const defaultSiteUrl = ref(typeof window !== 'undefined' ? window.location.origin : '');

const fileHeaders = ref<string[]>([]);
const parsedRows = ref<Record<string, any>[]>([]);
const mapping = ref<ColumnMappingConfig>({
  name: '',
  affiliate_url: '',
  product_url: '',
  image_url: '',
  price: '',
  original_price: '',
  commission_rate: '',
  shop_name: '',
  category: '',
  description: '',
  external_product_id: ''
});

const previewItems = ref<ParsedFeedItem[]>([]);
const importSummary = ref<ImportResultSummary | null>(null);

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0];
  }
};

const handleFileDrop = (e: DragEvent) => {
  isDragging.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    selectedFile.value = e.dataTransfer.files[0];
  }
};

const parseAndNext = async () => {
  if (!selectedFile.value) return;
  isParsing.value = true;

  try {
    const result = await parseFeedFile(selectedFile.value);
    fileHeaders.value = result.headers;
    parsedRows.value = result.rows;

    mapping.value = autoDetectMapping(result.headers);
    updatePreview();
    step.value = 2;
  } catch (err) {
    alert('Gagal membaca file: Format file tidak didukung atau corrupt.');
  } finally {
    isParsing.value = false;
  }
};

const updatePreview = () => {
  previewItems.value = transformAndCleanRows(parsedRows.value, mapping.value);
};

const validPreviewCount = computed(() => {
  return previewItems.value.filter(i => i.isValid).length;
});

const startImport = async () => {
  if (previewItems.value.length === 0) return;
  isImporting.value = true;

  try {
    const summary = await bulkUpsertAffiliateFeed(previewItems.value, {
      merchant: defaultMerchant.value,
      campaignId: defaultCampaignId.value,
      siteId: defaultSiteId.value,
      siteUrl: defaultSiteUrl.value,
      source: 'manual_csv_import',
      onProgress: (processed, total) => {
        progressText.value = `${processed}/${total}`;
      }
    });

    importSummary.value = summary;
    step.value = 3;
  } catch (err) {
    alert('Gagal memproses import data.');
  } finally {
    isImporting.value = false;
  }
};

const handleFinished = () => {
  emit('imported');
  handleClose();
};

const handleClose = () => {
  step.value = 1;
  selectedFile.value = null;
  parsedRows.value = [];
  previewItems.value = [];
  importSummary.value = null;
  emit('close');
};
</script>

