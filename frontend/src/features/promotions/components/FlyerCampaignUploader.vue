<template>
  <div class="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-soft space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
          <FileUp class="w-5 h-5 text-brand-red" />
          <span>Upload Flyer Kampanye Promo (JPG, PNG, PDF)</span>
        </h3>
        <p class="text-xs text-gray-500">Unggah brosur cetak atau pamflet promo untuk mengekstrak kampanye marketing otomatis.</p>
      </div>

      <span class="text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-200">
        AI Flyer Parser Active
      </span>
    </div>

    <!-- Drag & Drop Upload Zone -->
    <div 
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      class="border-2 border-dashed rounded-3xl p-6 text-center transition-all cursor-pointer relative overflow-hidden"
      :class="isDragging ? 'border-brand-red bg-red-50/50 dark:bg-red-950/20' : 'border-gray-200 dark:border-gray-700 hover:border-brand-red/50 bg-gray-50/50 dark:bg-gray-700/30'"
    >
      <input type="file" accept="image/*,.pdf" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" @change="handleFileChange" ref="fileInputRef" />
      
      <!-- Preview of uploaded flyer -->
      <div v-if="uploadedPreviewUrl" class="flex items-center gap-4">
        <div class="relative shrink-0">
          <img 
            :src="uploadedPreviewUrl" 
            class="w-28 h-20 object-cover rounded-2xl border-2 border-brand-red shadow-md" 
            alt="Preview Flyer"
          />
          <span class="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow">
            <Check class="w-3 h-3 text-white" />
          </span>
        </div>
        <div class="text-left flex-1 min-w-0">
          <div class="font-extrabold text-sm text-gray-900 dark:text-white truncate">{{ uploadedFileName }}</div>
          <div class="text-xs text-emerald-600 font-semibold mt-0.5">✓ Flyer ter-upload — sedang diproses AI...</div>
          <button 
            type="button" 
            @click.stop="clearUpload"
            class="mt-2 text-[11px] font-bold text-red-500 hover:underline flex items-center gap-1"
          >
            <X class="w-3 h-3" />
            Ganti Flyer Lain
          </button>
        </div>
      </div>

      <!-- Default upload prompt -->
      <div v-else class="max-w-md mx-auto space-y-3 pointer-events-none">
        <div class="w-14 h-14 rounded-2xl bg-brand-red/10 text-brand-red flex items-center justify-center mx-auto shadow-inner">
          <UploadCloud class="w-7 h-7" />
        </div>
        <div>
          <h4 class="font-extrabold text-sm text-gray-900 dark:text-white">Tarik & Lepas File Flyer / Brosur Di Sini</h4>
          <p class="text-xs text-gray-400 mt-0.5">Mendukung format JPG, PNG, atau PDF hingga 15 MB</p>
        </div>
        <button type="button" class="bg-brand-red text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow">
          Pilih File Dari Komputer
        </button>
      </div>
    </div>

    <!-- Preset Flyer Samples for Immediate Quick Test -->
    <div class="pt-2">
      <div class="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
        <Sparkles class="w-4 h-4 text-amber-500" />
        <span>Atau Pilih Sample Flyer Siap Pakai Untuk Pengujian Langsung:</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button 
          v-for="preset in presets" 
          :key="preset.id"
          @click="selectPreset(preset)"
          class="p-3 rounded-2xl border text-left transition-all flex items-center gap-3 group"
          :class="activePresetId === preset.id 
            ? 'bg-brand-red/5 border-brand-red shadow-sm ring-2 ring-brand-red/20' 
            : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-red-50/50 border-gray-200 dark:border-gray-700'"
        >
          <div class="relative shrink-0">
            <img :src="preset.preview" class="w-12 h-12 object-cover rounded-xl group-hover:scale-105 transition-transform" />
            <span v-if="activePresetId === preset.id" class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand-red rounded-full flex items-center justify-center">
              <Check class="w-2.5 h-2.5 text-white" />
            </span>
          </div>
          <div>
            <div class="font-extrabold text-xs text-gray-900 dark:text-white group-hover:text-brand-red" :class="activePresetId === preset.id ? 'text-brand-red' : ''">{{ preset.title }}</div>
            <div class="text-[10px] text-gray-400 font-mono mt-0.5">{{ preset.subtitle }}</div>
            <div v-if="activePresetId === preset.id" class="text-[10px] text-emerald-600 font-bold mt-0.5">✓ Aktif</div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { FileUp, UploadCloud, Sparkles, Check, X } from 'lucide-vue-next';

const emit = defineEmits(['flyerSelected']);
const isDragging = ref(false);
const uploadedPreviewUrl = ref('');
const uploadedFileName = ref('');
const activePresetId = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);

const presets = [
  {
    id: 'preset_dapur_bunda',
    title: 'Flyer Alfamart Kebutuhan Dapur Bunda',
    subtitle: '16 - 31 Juli 2026 • 7 Produk Dapur',
    preview: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=300'
  },
  {
    id: 'preset_body_care',
    title: 'Flyer Alfamart Body Care Fair',
    subtitle: '16 - 31 Juli 2026 • 14 Produk Body Care',
    preview: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300'
  },
  {
    id: 'preset_sembako_super',
    title: 'Pamflet Sembako Super Saver',
    subtitle: '20 - 27 Juli 2026 • 4 Produk Sembako',
    preview: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300'
  },
  {
    id: 'preset_weekend_flash',
    title: 'Brosur Promo Akhir Pekan',
    subtitle: 'Sabtu - Minggu • Flash Sale',
    preview: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300'
  }
];

const clearUpload = () => {
  uploadedPreviewUrl.value = '';
  uploadedFileName.value = '';
  activePresetId.value = '';
  if (fileInputRef.value) {
    fileInputRef.value.value = ''; // Reset the <input> so same file can be re-selected
  }
};

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    // Revoke previous object URL to avoid memory leak
    if (uploadedPreviewUrl.value && uploadedPreviewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(uploadedPreviewUrl.value);
    }
    const url = URL.createObjectURL(file);
    uploadedPreviewUrl.value = url;
    uploadedFileName.value = file.name;
    activePresetId.value = ''; // Clear active preset when file is uploaded
    emit('flyerSelected', { file, imageUrl: url, title: file.name });
  }
};

const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    const file = e.dataTransfer.files[0];
    if (uploadedPreviewUrl.value && uploadedPreviewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(uploadedPreviewUrl.value);
    }
    const url = URL.createObjectURL(file);
    uploadedPreviewUrl.value = url;
    uploadedFileName.value = file.name;
    activePresetId.value = '';
    emit('flyerSelected', { file, imageUrl: url, title: file.name });
  }
};

const selectPreset = (preset: any) => {
  uploadedPreviewUrl.value = ''; // Clear custom upload preview when preset is chosen
  uploadedFileName.value = '';
  activePresetId.value = preset.id;
  emit('flyerSelected', { imageUrl: preset.preview, title: preset.title, isPreset: true, presetId: preset.id });
};
</script>
