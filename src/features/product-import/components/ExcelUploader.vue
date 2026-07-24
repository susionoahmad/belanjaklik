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

    <!-- Quick Sample Preset Button -->
    <div class="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <FileCheck class="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <div class="text-xs font-extrabold text-emerald-900 dark:text-emerald-300">File Contoh Tersedia: data_produk_ekstraksi.xlsx</div>
          <div class="text-[10px] text-emerald-700 dark:text-emerald-400">Terdiri dari 4 produk sembako hasil ekstraksi gambar Gemini (Sedaap, Sarimi, Indomie)</div>
        </div>
      </div>

      <button 
        @click.stop="handleLoadPreset"
        class="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5"
      >
        <Sparkles class="w-3.5 h-3.5" />
        <span>Muat File Contoh data_produk_ekstraksi.xlsx</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { FileSpreadsheet, UploadCloud, FileCheck, Sparkles } from 'lucide-vue-next';

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
    emit('filesSelected', Array.from(target.files));
  }
};

const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    emit('filesSelected', Array.from(e.dataTransfer.files));
  }
};

const handleLoadPreset = () => {
  emit('presetSelected', '/data_produk_ekstraksi.xlsx');
};
</script>
