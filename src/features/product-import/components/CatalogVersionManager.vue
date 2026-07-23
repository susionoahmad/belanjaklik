<template>
  <div class="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
          <History class="w-4 h-4 text-purple-600" />
          <span>Catalog Snapshot & Version Rollback</span>
        </h3>
        <p class="text-xs text-gray-500">Riwayat versi snapshot katalog produk sebelum & sesudah publikasi impor.</p>
      </div>

      <button @click="loadVersions" class="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1">
        <RefreshCw class="w-3.5 h-3.5" />
        <span>Refresh Versi</span>
      </button>
    </div>

    <div v-if="versions.length === 0" class="text-xs text-gray-400 italic text-center py-4">
      Belum ada versi snapshot tersimpan. Snapshot dibuat otomatis saat publikasi catalog.
    </div>

    <div v-else class="space-y-2 max-h-60 overflow-y-auto pr-1">
      <div 
        v-for="ver in versions" 
        :key="ver.id"
        class="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between"
      >
        <div>
          <div class="flex items-center gap-2">
            <span class="font-extrabold text-xs text-gray-900 dark:text-white">Versi v{{ ver.version_number }}</span>
            <span class="text-[10px] text-gray-400 font-mono">{{ new Date(ver.created_at).toLocaleString('id-ID') }}</span>
          </div>
          <p class="text-xs text-gray-500 mt-0.5">{{ ver.description }}</p>
          <p class="text-[10px] text-purple-600 font-semibold mt-0.5">{{ ver.snapshot_data?.length || 0 }} Produk Dalam Snapshot</p>
        </div>

        <button 
          @click="handleRollback(ver)" 
          class="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-purple-100 text-purple-800 hover:bg-purple-600 hover:text-white transition-all flex items-center gap-1 shadow-sm"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span>Rollback Versi Ini</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { History, RefreshCw, RotateCcw } from 'lucide-vue-next';
import { catalogVersioningService } from '../versioning/CatalogVersioningService';
import type { CatalogVersion } from '../types';

const emit = defineEmits<{ (e: 'rolledBack'): void }>();

const versions = ref<CatalogVersion[]>([]);

const loadVersions = async () => {
  versions.value = await catalogVersioningService.getVersions();
};

const handleRollback = async (ver: CatalogVersion) => {
  if (confirm(`Apakah Anda yakin ingin melakukan rollback katalog ke Versi v${ver.version_number}?`)) {
    const success = await catalogVersioningService.rollbackToVersion(ver.id);
    if (success) {
      alert(`Berhasil rollback katalog ke Versi v${ver.version_number}!`);
      emit('rolledBack');
      await loadVersions();
    }
  }
};

onMounted(() => {
  loadVersions();
});
</script>
