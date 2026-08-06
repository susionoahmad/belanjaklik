<template>
  <div class="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-soft space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="font-extrabold text-gray-900 dark:text-white text-sm flex items-center gap-2">
          <FileSpreadsheet class="w-5 h-5 text-emerald-600" />
          <span>Upload File Excel / CSV Katalog Produk</span>
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Pilih file spreadsheet (.xlsx, .xls, .csv) untuk diekstrak secara otomatis ke dalam sistem review admin.
        </p>
      </div>
    </div>

    <!-- Dropzone -->
    <div 
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
      class="border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3"
      :class="isDragging ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-gray-200 dark:border-gray-700 hover:border-emerald-400 bg-gray-50/50 dark:bg-gray-800/50'"
    >
      <input 
        ref="fileInput" 
        type="file" 
        accept=".xlsx,.xls,.csv" 
        class="hidden" 
        @change="handleFileChange"
      />
      <div class="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shadow-sm">
        <UploadCloud class="w-6 h-6" />
      </div>
      <div>
        <div class="text-xs font-extrabold text-gray-900 dark:text-white">
          Tarik & Lepas File Excel (.xlsx, .csv) di Sini
        </div>
        <div class="text-[11px] text-gray-400 mt-0.5">atau klik untukjelajah file dari komputer Anda</div>
      </div>
    </div>

    <!-- Quick Sample Preset Buttons -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
      <div class="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5">
        <div class="flex items-center gap-2.5">
          <FileCheck class="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div class="text-xs font-extrabold text-emerald-900 dark:text-emerald-300">data_produk_ekstraksi.xlsx</div>
            <div class="text-[10px] text-emerald-700 dark:text-emerald-400">4 produk sembako (Sedaap, Sarimi, Indomie)</div>
          </div>
        </div>
        <button 
          @click.stop="handleLoadPreset('/data_produk_ekstraksi.xlsx')"
          class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span>Muat Excel Ekstraksi Standard</span>
        </button>
      </div>

      <div class="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5">
        <div class="flex items-center gap-2.5">
          <Flame class="w-5 h-5 text-brand-red shrink-0" />
          <div>
            <div class="text-xs font-extrabold text-red-900 dark:text-red-300">promo_jsm_juli_2026.xlsx</div>
            <div class="text-[10px] text-red-700 dark:text-red-400">15 produk Promo JSM (Fres&Nat, Lifebuoy, Pepsodent, Emeron, Systema)</div>
          </div>
        </div>
        <button 
          @click.stop="handleLoadPreset('/promo_jsm_juli_2026.xlsx')"
          class="w-full bg-brand-red hover:bg-brand-red-dark text-white font-extrabold text-xs py-2 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span>Muat Excel Promo JSM (24-26 Juli)</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { FileSpreadsheet, UploadCloud, FileCheck, Sparkles, Flame } from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'filesSelected', files: File[]): void;
  (e: 'presetSelected', url: string): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const files = Array.from(target.files);
    target.value = ''; // Reset input value so re-uploading or changing files triggers @change smoothly
    emit('filesSelected', files);
  }
};

const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    const files = Array.from(e.dataTransfer.files);
    if (fileInput.value) fileInput.value.value = '';
    emit('filesSelected', files);
  }
};

const handleLoadPreset = (url: string = '/data_produk_ekstraksi.xlsx') => {
  emit('presetSelected', url);
};
</script>

