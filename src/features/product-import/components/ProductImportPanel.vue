<template>
  <div class="space-y-6">
    <!-- Header & Driver Selector -->
    <div class="bg-gradient-to-r from-brand-red to-red-700 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold text-white mb-2 backdrop-blur-sm">
          <Cpu class="w-3.5 h-3.5" />
          <span>Product Import Engine v2.0 Platform</span>
        </div>
        <h2 class="font-extrabold text-xl sm:text-2xl">Driver: Screenshot Scanner (Groceries AI)</h2>
        <p class="text-xs text-white/80 mt-1 max-w-2xl">
          Impor & bangun katalog sembako otomatis dari screenshot aplikasi Alfamind menggunakan AI Vision, OCR Adapter, Normalizer, AI Correction, & Matching Strategy.
        </p>
      </div>

      <!-- Drivers Registry Selector -->
      <div class="bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-md space-y-1.5 w-full md:w-auto">
        <label class="block text-[10px] font-bold text-white/90 uppercase tracking-wider">Pilih Import Driver Platform:</label>
        <select 
          v-model="selectedSourceType" 
          class="w-full bg-white text-gray-900 text-xs font-extrabold px-3 py-2 rounded-xl outline-none shadow"
        >
          <option value="SCREENSHOT">✓ Screenshot Driver (Active)</option>
          <option value="FLYER">Promo Flyer Driver (Future)</option>
          <option value="URL">URL Sync Driver (Future)</option>
          <option value="EXCEL">Excel / CSV Driver (Future)</option>
          <option value="API">Supplier API Driver (Future)</option>
        </select>
      </div>
    </div>

    <!-- Analytics Dashboard Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
      <div class="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-soft">
        <div class="text-[10px] font-bold text-gray-400 uppercase">Proses Impor</div>
        <div class="text-lg font-extrabold text-gray-900 dark:text-white mt-1">{{ analytics.totalSessions }} Sesi</div>
      </div>
      <div class="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-soft">
        <div class="text-[10px] font-bold text-gray-400 uppercase">Produk Terdeteksi</div>
        <div class="text-lg font-extrabold text-brand-red mt-1">{{ analytics.productsDetected }} Cards</div>
      </div>
      <div class="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-soft">
        <div class="text-[10px] font-bold text-gray-400 uppercase">Akurasi OCR</div>
        <div class="text-lg font-extrabold text-emerald-600 mt-1">{{ analytics.ocrAccuracy }}%</div>
      </div>
      <div class="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-soft">
        <div class="text-[10px] font-bold text-gray-400 uppercase">AI Correction Rate</div>
        <div class="text-lg font-extrabold text-brand-blue mt-1">{{ analytics.aiCorrectionRate }}%</div>
      </div>
      <div class="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-soft">
        <div class="text-[10px] font-bold text-gray-400 uppercase">Matching Score</div>
        <div class="text-lg font-extrabold text-purple-600 mt-1">{{ analytics.avgConfidence }}%</div>
      </div>
      <div class="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-soft">
        <div class="text-[10px] font-bold text-gray-400 uppercase">Waktu Pemrosesan</div>
        <div class="text-lg font-extrabold text-amber-600 mt-1">{{ analytics.avgProcessingTimeMs }}ms</div>
      </div>
    </div>

    <!-- Feature Flags & Pipeline Control Toggle Bar -->
    <div class="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <Sliders class="w-4 h-4 text-gray-500" />
        <span class="font-extrabold text-xs text-gray-900 dark:text-white">Feature Flags Engine:</span>
      </div>

      <div class="flex flex-wrap items-center gap-4 text-xs font-semibold">
        <label class="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" v-model="featureFlagService.flags.geminiVision" class="rounded text-brand-red focus:ring-brand-red" />
          <span>Gemini Vision OCR</span>
        </label>
        <label class="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" v-model="featureFlagService.flags.embeddingMatcher" class="rounded text-brand-red focus:ring-brand-red" />
          <span>Vector Image Matcher</span>
        </label>
        <label class="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" v-model="featureFlagService.flags.autoCategory" class="rounded text-brand-red focus:ring-brand-red" />
          <span>AI Auto Category</span>
        </label>
        <label class="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" v-model="featureFlagService.flags.autoDeduplication" class="rounded text-brand-red focus:ring-brand-red" />
          <span>Multi-Screenshot Deduplication</span>
        </label>
      </div>
    </div>

    <!-- Step 1: Upload Screenshot / Excel Uploader -->
    <div v-if="selectedSourceType === 'EXCEL'">
      <ExcelUploader 
        @filesSelected="handleFilesSelected"
        @presetSelected="handleExcelPresetSelected"
      />
    </div>
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <ScreenshotUploader 
          currentDriverName="Screenshot Driver (Groceries Scanner)" 
          @filesSelected="handleFilesSelected"
          @presetSelected="handlePresetSelected"
        />
      </div>

      <div>
        <ScanPreview 
          :imageSrc="activePreviewImage" 
          :cards="detectedCards" 
        />
      </div>
    </div>

    <!-- Processing Logs & Pipeline Stages Progress Bar -->
    <div v-if="isProcessing || logs.length > 0" class="bg-gray-900 text-emerald-400 p-4 rounded-3xl font-mono text-xs space-y-2 shadow-inner">
      <div class="flex items-center justify-between border-b border-gray-800 pb-2 text-white font-bold">
        <span class="flex items-center gap-2">
          <Terminal class="w-4 h-4 text-emerald-400" />
          <span>Pipeline Engine Execution Logs ({{ selectedSourceType }})</span>
        </span>
        <span v-if="isProcessing" class="text-amber-400 animate-pulse text-[11px]">Memproses Pipeline 11 Stages...</span>
      </div>

      <div class="max-h-36 overflow-y-auto space-y-1">
        <div v-for="(log, i) in logs" :key="i" class="flex items-start gap-2">
          <span class="text-gray-500 font-bold">[{{ i + 1 }}]</span>
          <span>{{ log }}</span>
        </div>
      </div>
    </div>

    <!-- Step 2: Review Table -->
    <div v-if="reviewItems.length > 0">
      <ProductReviewTable :reviewItems="reviewItems" />

      <!-- Review Action Toolbar -->
      <div class="pt-4 flex items-center justify-between">
        <div class="text-xs text-gray-500 font-semibold">
          Silakan periksa hasil deteksi lalu tekan tombol **Publikasikan Ke Katalog**.
        </div>

        <button 
          @click="isPublishDialogOpen = true" 
          class="bg-brand-red hover:bg-brand-red-dark text-white font-extrabold px-6 py-3 rounded-2xl shadow-lg text-xs transition-all flex items-center gap-2"
        >
          <Send class="w-4 h-4" />
          <span>Publikasikan {{ approvedCount }} Produk Ke Katalog</span>
        </button>
      </div>
    </div>

    <!-- Catalog Versioning & Rollback Section -->
    <CatalogVersionManager @rolledBack="handleCatalogRolledBack" />

    <!-- Publish Confirmation Dialog -->
    <PublishDialog 
      :isOpen="isPublishDialogOpen" 
      :reviewItems="reviewItems"
      :isPublishing="isPublishing"
      @close="isPublishDialogOpen = false"
      @confirm="handleConfirmPublish"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Cpu, Sliders, Terminal, Send } from 'lucide-vue-next';
import ScreenshotUploader from './ScreenshotUploader.vue';
import ExcelUploader from './ExcelUploader.vue';
import ScanPreview from './ScanPreview.vue';
import ProductReviewTable from './ProductReviewTable.vue';
import CatalogVersionManager from './CatalogVersionManager.vue';
import PublishDialog from './PublishDialog.vue';
import { productImportEngine } from '../engine/ProductImportEngine';
import { featureFlagService } from '../flags/FeatureFlagService';
import { ImportAnalyticsManager } from '../analytics/ImportAnalytics';
import type { DetectedCard, ImportAnalytics, ReviewItem, SourceType } from '../types';
import { useCatalogStore } from '../../catalog/stores/catalogStore';

const catalogStore = useCatalogStore();

const selectedSourceType = ref<SourceType>('EXCEL');
const isProcessing = ref(false);
const isPublishing = ref(false);
const isPublishDialogOpen = ref(false);

const activePreviewImage = ref('https://images.unsplash.com/photo-1542838132-92c53300491e?w=500');
const detectedCards = ref<DetectedCard[]>([]);
const reviewItems = ref<ReviewItem[]>([]);
const logs = ref<string[]>([]);

const analytics = ref<ImportAnalytics>({
  totalSessions: 1,
  totalJobs: 1,
  totalUploadedFiles: 2,
  productsDetected: 12,
  productsCreated: 8,
  productsUpdated: 4,
  productsIgnored: 0,
  ocrAccuracy: 96.5,
  aiCorrectionRate: 88.0,
  matchingAccuracy: 94.2,
  duplicateRate: 0,
  avgProcessingTimeMs: 1450,
  avgConfidence: 95.8,
  publishSuccessRate: 94,
  rollbackCount: 0
});

const approvedCount = computed(() => reviewItems.value.filter(i => i.action !== 'IGNORE').length);

const refreshMetrics = async () => {
  analytics.value = await ImportAnalyticsManager.calculateMetrics();
};

const handleFilesSelected = async (files: File[]) => {
  if (files && files.length > 0 && selectedSourceType.value === 'SCREENSHOT') {
    try {
      activePreviewImage.value = URL.createObjectURL(files[0]);
    } catch (e) {}
  }
  await executeImportSession({ files });
};

const handlePresetSelected = async (preset: { id: string; title: string; preview: string }) => {
  activePreviewImage.value = preset.preview;
  await executeImportSession({ fileUrls: [preset.preview] });
};

const handleExcelPresetSelected = async (url: string) => {
  await executeImportSession({ fileUrls: [url] });
};

const executeImportSession = async (input: any) => {
  isProcessing.value = true;
  logs.value = [`Initializing Pipeline Engine execution for ${selectedSourceType.value}...`];

  try {
    const result = await productImportEngine.runImportSession(selectedSourceType.value, input);
    reviewItems.value = result.reviewItems;
    detectedCards.value = result.reviewItems.map(r => r.card);
    logs.value = result.logs;
    await refreshMetrics();
  } catch (err: any) {
    alert(`Gagal menjalankan pipeline impor: ${err.message}`);
  } finally {
    isProcessing.value = false;
  }
};

const handleConfirmPublish = async () => {
  isPublishing.value = true;
  try {
    const res = await productImportEngine.publishApprovedReviews(reviewItems.value);
    await catalogStore.fetchCatalogData();
    await refreshMetrics();
    isPublishDialogOpen.value = false;
    alert(`Berhasil mempublikasikan ${res.createdCount} produk baru & memperbarui ${res.updatedCount} produk di katalog resmi!`);
  } catch (err: any) {
    alert(`Gagal mempublikasikan: ${err.message}`);
  } finally {
    isPublishing.value = false;
  }
};

const handleCatalogRolledBack = async () => {
  await catalogStore.fetchCatalogData();
  await refreshMetrics();
};

onMounted(async () => {
  await refreshMetrics();
});
</script>

