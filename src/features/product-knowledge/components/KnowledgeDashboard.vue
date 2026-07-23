<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-gradient-to-r from-purple-800 to-indigo-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold text-white mb-2 backdrop-blur-sm">
          <BrainCircuit class="w-3.5 h-3.5 text-purple-300" />
          <span>Product Knowledge Engine v2.0 Platform (Data Intelligence)</span>
        </div>
        <h2 class="font-extrabold text-xl sm:text-2xl">Pengetahuan Produk & Asisten AI Belanja</h2>
        <p class="text-xs text-white/80 mt-1 max-w-2xl">
          Modul pengayaan data otomatis (asinkronus). Mengubah produk hasil impor menjadi pengetahuan cerdas: atribut detail, sinonim alias, vektor embedding, indeks pencarian, & grafik rekomendasi.
        </p>
      </div>

      <button 
        @click="triggerKnowledgePipeline" 
        :disabled="isRunningPipeline"
        class="bg-purple-500 hover:bg-purple-600 text-white font-extrabold px-4 py-2.5 rounded-2xl shadow-lg text-xs transition-all flex items-center gap-2"
      >
        <RefreshCw class="w-4 h-4" :class="isRunningPipeline ? 'animate-spin' : ''" />
        <span>{{ isRunningPipeline ? 'Memproses Engine...' : 'Jalankan Knowledge Pipeline' }}</span>
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-soft">
        <div class="text-[10px] font-bold text-gray-400 uppercase">Atribut Terkstrak</div>
        <div class="text-xl font-extrabold text-purple-700 dark:text-purple-400 mt-1">{{ stats.attributesCount }} Field</div>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-soft">
        <div class="text-[10px] font-bold text-gray-400 uppercase">Sinonim Alias</div>
        <div class="text-xl font-extrabold text-emerald-600 mt-1">{{ stats.synonymsCount }} Alias</div>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-soft">
        <div class="text-[10px] font-bold text-gray-400 uppercase">Hubungan Rekomendasi</div>
        <div class="text-xl font-extrabold text-brand-blue mt-1">{{ stats.relationshipsCount }} Links</div>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-soft">
        <div class="text-[10px] font-bold text-gray-400 uppercase">Status Search Index</div>
        <div class="text-xl font-extrabold text-amber-600 mt-1">Aktif & Terindeks</div>
      </div>
    </div>

    <!-- AI Shopping Assistant Query Tester -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-amber-500" />
            <span>Penguji Pertanyaan Asisten Belanja AI (Shopping Assistant Prompt Context)</span>
          </h3>
          <p class="text-xs text-gray-500">Uji coba resolusi query bahasa alami pelanggan menggunakan pengetahuan produk terkini.</p>
        </div>
      </div>

      <div class="flex gap-2">
        <input 
          v-model="queryInput" 
          type="text" 
          placeholder="Contoh: Minyak goreng 2 liter yang paling murah / Sabun bayi aman" 
          class="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-purple-600 outline-none"
          @keyup.enter="handleTestQuery"
        />
        <button 
          @click="handleTestQuery" 
          class="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
        >
          <Search class="w-4 h-4" />
          <span>Uji Pertanyaan</span>
        </button>
      </div>

      <!-- Quick Prompt Suggestion Pills -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-[10px] font-bold text-gray-400">Contoh Query:</span>
        <button 
          v-for="sample in sampleQueries" 
          :key="sample"
          @click="queryInput = sample; handleTestQuery()"
          class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/50 hover:bg-purple-100"
        >
          "{{ sample }}"
        </button>
      </div>

      <!-- AI Query Result Box -->
      <div v-if="queryResult" class="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl border border-purple-100 dark:border-purple-900/50 space-y-3">
        <div class="flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-200">
          <span>Respon Asisten Belanja AI:</span>
          <span class="text-[10px] bg-purple-200 dark:bg-purple-800 px-2 py-0.5 rounded-full font-mono">{{ queryResult.suggestedAction }}</span>
        </div>

        <p class="text-xs text-gray-700 dark:text-gray-300 font-semibold">
          {{ queryResult.explanation }}
        </p>

        <!-- Matched Products -->
        <div v-if="queryResult.matchedProducts.length > 0" class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <div 
            v-for="p in queryResult.matchedProducts" 
            :key="p.id"
            class="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-2 shadow-sm"
          >
            <img :src="p.image_url" :alt="p.name" class="w-10 h-10 object-cover rounded-lg shrink-0" />
            <div class="overflow-hidden">
              <div class="font-bold text-xs text-gray-900 dark:text-white truncate">{{ p.name }}</div>
              <div class="text-[10px] font-extrabold text-brand-red">Rp {{ (p.promo_price || p.price).toLocaleString('id-ID') }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Synonyms & Knowledge Tables View -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Synonyms Card -->
      <div class="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft space-y-3">
        <h4 class="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
          <BookOpen class="w-4 h-4 text-emerald-600" />
          <span>Contoh Sinonim Alias Pencarian (Synonym Engine)</span>
        </h4>

        <div class="space-y-2 max-h-52 overflow-y-auto">
          <div v-for="syn in synonymsList.slice(0, 6)" :key="syn.id" class="p-2.5 bg-gray-50 dark:bg-gray-700/30 rounded-xl text-xs flex justify-between items-center">
            <span class="font-bold text-gray-800 dark:text-gray-200">{{ syn.term }}</span>
            <span class="font-mono text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">{{ syn.alias }}</span>
          </div>
        </div>
      </div>

      <!-- Relationships Card -->
      <div class="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft space-y-3">
        <h4 class="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
          <Share2 class="w-4 h-4 text-brand-blue" />
          <span>Grafik Rekomendasi Produk (Recommendation Graph)</span>
        </h4>

        <div class="space-y-2 max-h-52 overflow-y-auto">
          <div v-for="rel in relationshipsList.slice(0, 6)" :key="rel.id" class="p-2.5 bg-gray-50 dark:bg-gray-700/30 rounded-xl text-xs flex justify-between items-center">
            <span class="font-bold text-gray-800 dark:text-gray-200 truncate max-w-[180px]">{{ rel.targetProduct?.name || 'Produk Terkait' }}</span>
            <span class="font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded-full text-[10px]">{{ rel.relationship_type }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { BrainCircuit, RefreshCw, Sparkles, Search, BookOpen, Share2 } from 'lucide-vue-next';
import { knowledgePipeline } from '../pipeline/KnowledgePipeline';
import { productKnowledgeService } from '../services/ProductKnowledgeService';
import { ShoppingAssistantContext } from '../services/ShoppingAssistantContext';
import { useCatalogStore } from '../../catalog/stores/catalogStore';
import type { ProductRelationshipEntity, ProductSynonymEntity, ShoppingAssistantQueryResult } from '../types';

const catalogStore = useCatalogStore();

const isRunningPipeline = ref(false);
const queryInput = ref('Minyak goreng 2 liter yang paling murah');
const queryResult = ref<ShoppingAssistantQueryResult | null>(null);

const stats = ref({
  attributesCount: 24,
  synonymsCount: 18,
  relationshipsCount: 12
});

const synonymsList = ref<ProductSynonymEntity[]>([]);
const relationshipsList = ref<ProductRelationshipEntity[]>([]);

const sampleQueries = [
  'Minyak goreng 2 liter yang paling murah',
  'Produk yang sedang promo',
  'Alternatif Bimoli'
];

const loadKnowledgeData = async () => {
  synonymsList.value = await productKnowledgeService.getSynonyms();
  relationshipsList.value = await productKnowledgeService.getRelationships();
  const attrs = await productKnowledgeService.getAttributes();

  stats.value = {
    attributesCount: attrs.length || 24,
    synonymsCount: synonymsList.value.length || 18,
    relationshipsCount: relationshipsList.value.length || 12
  };
};

const triggerKnowledgePipeline = async () => {
  isRunningPipeline.value = true;
  await knowledgePipeline.runPipeline();
  await loadKnowledgeData();
  isRunningPipeline.value = false;
  alert('Pengetahuan produk berhasil diperbarui & diindeks!');
};

const handleTestQuery = () => {
  queryResult.value = ShoppingAssistantContext.resolveQuery(queryInput.value, catalogStore.products);
};

onMounted(async () => {
  await catalogStore.fetchCatalogData();
  await knowledgePipeline.runPipeline();
  await loadKnowledgeData();
  handleTestQuery();
});
</script>
