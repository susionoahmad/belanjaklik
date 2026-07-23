<template>
  <div class="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
          <Upload class="w-4 h-4 text-brand-red" />
          <span>Upload Screenshot Alfamind</span>
        </h3>
        <p class="text-xs text-gray-500">Mendukung format PNG, JPG, JPEG dari Android, iPhone & Tablet.</p>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-red-50 text-brand-red dark:bg-red-950/50">
          Driver: {{ currentDriverName }}
        </span>
      </div>
    </div>

    <!-- Drop Zone -->
    <div 
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      class="border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
      :class="isDragging ? 'border-brand-red bg-red-50/50 dark:bg-red-950/20 scale-[0.99]' : 'border-gray-200 dark:border-gray-700 hover:border-brand-red/50 bg-gray-50/50 dark:bg-gray-700/30'"
      @click="triggerFileInput"
    >
      <input ref="fileInput" type="file" multiple accept="image/png, image/jpeg, image/jpg" class="hidden" @change="handleFileSelect" />
      
      <div class="w-12 h-12 rounded-2xl bg-brand-red/10 text-brand-red flex items-center justify-center">
        <ImagePlus class="w-6 h-6" />
      </div>

      <div>
        <p class="text-xs font-bold text-gray-800 dark:text-gray-200">
          Tarik & Lepas screenshot Alfamind di sini, atau <span class="text-brand-red underline">Pilih File</span>
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5">Dapat memilih sekaligus beberapa file screenshot (Multi-Screenshot Session)</p>
      </div>
    </div>

    <!-- Preset Demo Screenshots -->
    <div class="pt-2">
      <div class="text-[11px] font-bold text-gray-500 mb-2 flex items-center gap-1">
        <Sparkles class="w-3.5 h-3.5 text-amber-500" />
        <span>Atau Uji Coba Langsung Sampel Screenshot Alfamind:</span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button 
          v-for="sample in samplePresets" 
          :key="sample.id"
          @click="selectPresetSample(sample)"
          class="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-red text-left transition-all bg-gray-50 dark:bg-gray-700/40 group flex items-center gap-2"
        >
          <img :src="sample.preview" :alt="sample.title" class="w-8 h-8 object-cover rounded-lg shrink-0 group-hover:scale-105 transition-transform" />
          <div class="overflow-hidden">
            <div class="font-bold text-[11px] text-gray-900 dark:text-white truncate">{{ sample.title }}</div>
            <div class="text-[9px] text-gray-400">{{ sample.itemCount }} Produk Card</div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Upload, ImagePlus, Sparkles } from 'lucide-vue-next';

const props = defineProps<{
  currentDriverName: string;
}>();

const emit = defineEmits<{
  (e: 'filesSelected', files: File[]): void;
  (e: 'presetSelected', preset: { id: string; title: string; preview: string }): void;
}>();

const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const samplePresets = [
  { id: 's1', title: 'Screenshot Minyak & Sembako', itemCount: 4, preview: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=150' },
  { id: 's2', title: 'Screenshot Indomie & Snack', itemCount: 4, preview: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=150' },
  { id: 's3', title: 'Screenshot Beras & Gula', itemCount: 4, preview: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150' },
  { id: 's4', title: 'Screenshot Multi-Session (4 Grid)', itemCount: 6, preview: 'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=150' }
];

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (e: Event) => {
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

const selectPresetSample = (preset: any) => {
  emit('presetSelected', preset);
};
</script>
