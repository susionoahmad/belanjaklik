<template>
  <div class="space-y-6">
    <!-- Sub-tabs Navigation -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-soft">
      <button
        v-for="tab in subTabs"
        :key="tab.id"
        @click="activeSubTab = tab.id"
        class="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5"
        :class="activeSubTab === tab.id ? 'bg-brand-red text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        <span>{{ tab.name }}</span>
      </button>
    </div>

    <!-- Sub-Tab 1: Analytics & ROI -->
    <div v-if="activeSubTab === 'analytics'" class="space-y-4">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-soft">
          <div class="text-xs text-gray-400 font-bold">Total Impression Banner</div>
          <div class="font-black text-xl text-gray-900 dark:text-white mt-1">{{ analytics.impressions.toLocaleString('id-ID') }}</div>
          <div class="text-[10px] text-emerald-600 font-extrabold mt-0.5">CTR: {{ analytics.ctr_percentage }}%</div>
        </div>

        <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-soft">
          <div class="text-xs text-gray-400 font-bold">Kunjungan Landing Page</div>
          <div class="font-black text-xl text-brand-blue mt-1">{{ analytics.landing_page_visits.toLocaleString('id-ID') }}</div>
          <div class="text-[10px] text-gray-400 font-semibold mt-0.5">{{ analytics.products_clicked }} Klik Produk</div>
        </div>

        <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-soft">
          <div class="text-xs text-gray-400 font-bold">Pesanan Dari Kampanye</div>
          <div class="font-black text-xl text-purple-600 mt-1">{{ analytics.orders_count }} Transaksi</div>
          <div class="text-[10px] text-emerald-600 font-extrabold mt-0.5">Konversi: {{ analytics.conversion_rate }}%</div>
        </div>

        <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-soft">
          <div class="text-xs text-gray-400 font-bold">Estimasi ROI Kampanye</div>
          <div class="font-black text-xl text-emerald-600 mt-1">{{ analytics.roi_percentage }}%</div>
          <div class="text-[10px] text-gray-400 font-semibold mt-0.5">Pendapatan: Rp {{ analytics.total_revenue.toLocaleString('id-ID') }}</div>
        </div>
      </div>
    </div>

    <!-- Sub-Tab 2: Scheduler & Active Campaigns -->
    <div v-else-if="activeSubTab === 'scheduler'" class="space-y-4">
      <div class="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-soft space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar class="w-4 h-4 text-brand-red" />
            <span>Manajemen Lifecycle & Jadwal Kampanye</span>
          </h4>
          <span class="text-[10px] font-mono text-gray-400">Timezone: Asia/Jakarta (WIB)</span>
        </div>

        <div class="space-y-2">
          <div v-for="camp in campaigns" :key="camp.id" class="p-3.5 bg-gray-50 dark:bg-gray-700/50 rounded-2xl flex flex-wrap items-center justify-between gap-3 border border-gray-100 dark:border-gray-700">
            <div class="flex items-center gap-3">
              <img v-if="camp.desktop_banner || camp.banner_image" :src="camp.desktop_banner || camp.banner_image" class="w-12 h-12 object-cover rounded-xl border border-gray-200" />
              <div>
                <div class="font-extrabold text-xs text-gray-900 dark:text-white flex items-center gap-2">
                  <span>{{ camp.title }}</span>
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase" :class="camp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'">
                    {{ camp.status }}
                  </span>
                </div>
                <div class="text-[10px] text-gray-400 mt-0.5">
                  Periode: {{ camp.start_date }} s/d {{ camp.end_date }} • URL: <span class="font-mono text-brand-red">/campaign/{{ camp.slug }}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                @click="openEditModal(camp)"
                type="button"
                class="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all"
              >
                ✏️ Edit
              </button>

              <button
                @click="toggleCampaignStatus(camp)"
                type="button"
                class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border"
                :class="camp.status === 'ACTIVE'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'"
              >
                {{ camp.status === 'ACTIVE' ? '⏸️ Nonaktifkan Banner' : '▶️ Aktifkan Banner' }}
              </button>

              <button
                @click="deleteCampaign(camp.id)"
                type="button"
                class="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all"
                title="Hapus kampanye ini"
              >
                🗑️ Hapus
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sub-Tab 3: Placements & Rules -->
    <div v-else-if="activeSubTab === 'placements'" class="space-y-4">
      <div class="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-soft space-y-3">
        <h4 class="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
          <Sliders class="w-4 h-4 text-purple-600" />
          <span>Konfigurasi Aturan & Area Placement Promo</span>
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300">Minimal Belanja (Syarat Syarat Promo)</label>
            <input v-model.number="sampleRule.min_purchase_amount" type="number" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-bold" />
          </div>

          <div class="space-y-2">
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300">Batasan Akses Pelanggan</label>
            <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input type="checkbox" v-model="sampleRule.member_only" class="rounded text-brand-red focus:ring-brand-red" />
              <span>Hanya Untuk Pelanggan Member Terdaftar</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Sub-Tab 4: AI Banner Variants -->
    <div v-else-if="activeSubTab === 'variants'" class="space-y-4">
      <div class="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-soft space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Wand2 class="w-4 h-4 text-amber-500" />
            <span>AI Auto-Generated Banner Variants (8 Formats)</span>
          </h4>
          <button @click="generateVariants" class="bg-brand-red text-white text-xs font-extrabold px-3 py-1.5 rounded-xl">
            Generate Variant
          </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div v-for="variant in generatedVariants" :key="variant.id" class="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-2xl space-y-1.5 border border-gray-200 dark:border-gray-700">
            <div class="text-[10px] font-extrabold text-gray-700 dark:text-gray-300 truncate">{{ variant.variant_type }}</div>
            <img :src="variant.image_url" class="w-full h-16 object-cover rounded-xl border border-gray-200" />
            <div class="text-[9px] text-gray-400 font-mono text-center">{{ variant.width }} x {{ variant.height }} px</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sub-Tab 5: Templates & A/B Tests -->
    <div v-else-if="activeSubTab === 'templates'" class="space-y-4">
      <div class="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-soft space-y-3">
        <h4 class="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles class="w-4 h-4 text-emerald-500" />
          <span>Pustaka Template Kampanye & Pengujian A/B Test</span>
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div v-for="tpl in CampaignTemplateLibrary.templates" :key="tpl.template_id" class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl space-y-2 border border-gray-200 dark:border-gray-700">
            <div class="font-extrabold text-xs text-gray-900 dark:text-white">{{ tpl.name }}</div>
            <p class="text-[10px] text-gray-400 leading-tight">{{ tpl.description }}</p>
            <button class="w-full text-center bg-gray-200 dark:bg-gray-600 hover:bg-brand-red hover:text-white text-gray-800 dark:text-white font-extrabold text-[10px] py-1 rounded-xl transition-colors">
              Gunakan Template Ini
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Campaign Modal -->
    <div v-if="editingCampaign" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
        <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
          <h3 class="font-black text-base text-gray-900 dark:text-white flex items-center gap-2">
            <span>✏️ Edit Detail Kampanye & Banner</span>
          </h3>
          <button @click="editingCampaign = null" class="text-gray-400 hover:text-gray-600 font-bold text-lg">&times;</button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Judul Kampanye Promo</label>
            <input v-model="editingCampaign.title" type="text" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 font-bold outline-none focus:ring-2 focus:ring-brand-red" />
          </div>

          <div>
            <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Sub-Judul / Deskripsi</label>
            <input v-model="editingCampaign.subtitle" type="text" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 font-semibold outline-none focus:ring-2 focus:ring-brand-red" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Tanggal Mulai</label>
              <input v-model="editingCampaign.start_date" type="date" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 font-bold outline-none focus:ring-2 focus:ring-brand-red" />
            </div>
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Tanggal Selesai</label>
              <input v-model="editingCampaign.end_date" type="date" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 font-bold outline-none focus:ring-2 focus:ring-brand-red" />
            </div>
          </div>

          <div>
            <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Syarat & Ketentuan</label>
            <textarea v-model="editingCampaign.terms_conditions" rows="2" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 font-medium outline-none focus:ring-2 focus:ring-brand-red"></textarea>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <button @click="editingCampaign = null" type="button" class="px-4 py-2 rounded-xl font-extrabold text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all">
            Batal
          </button>
          <button @click="saveEditedCampaign" type="button" class="px-5 py-2 rounded-xl font-extrabold text-xs text-white bg-brand-red hover:bg-brand-red-dark transition-all shadow-md">
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { BarChart3, Calendar, Sliders, Wand2, Sparkles } from 'lucide-vue-next';
import { dataService } from '../../shared/db/dataService';
import { CampaignAnalyticsEngine } from '../engine/CampaignAnalyticsEngine';
import { AIBannerEnhancementEngine } from '../engine/AIBannerEnhancementEngine';
import { CampaignTemplateLibrary } from '../engine/CampaignTemplateLibrary';
import type { BannerVariant } from '../types/enterpriseTypes';

const activeSubTab = ref('analytics');
const campaigns = ref<any[]>([]);
const analytics = ref<any>({
  impressions: 1240,
  banner_clicks: 186,
  landing_page_visits: 142,
  ctr_percentage: 15.0,
  products_clicked: 310,
  cart_additions: 84,
  orders_count: 38,
  total_revenue: 2850000,
  total_discount_given: 420000,
  conversion_rate: 26.8,
  roi_percentage: 578
});

const generatedVariants = ref<BannerVariant[]>([]);
const editingCampaign = ref<any>(null);

const openEditModal = (camp: any) => {
  editingCampaign.value = { ...camp };
};

const saveEditedCampaign = async () => {
  if (!editingCampaign.value) return;
  await dataService.savePromotionCampaign(editingCampaign.value);
  await promotionStore.loadCampaignBanners();
  campaigns.value = await dataService.fetchPromotionCampaigns();
  editingCampaign.value = null;
  alert('✅ Kampanye berhasil diperbarui!');
};
const sampleRule = ref({ min_purchase_amount: 50000, member_only: false });

const subTabs = [
  { id: 'analytics', name: 'Analisis & ROI', icon: BarChart3 },
  { id: 'scheduler', name: 'Jadwal & Status', icon: Calendar },
  { id: 'placements', name: 'Placement & Rules', icon: Sliders },
  { id: 'variants', name: 'AI Banner Variants', icon: Wand2 },
  { id: 'templates', name: 'Template & A/B Test', icon: Sparkles }
];

const generateVariants = () => {
  generatedVariants.value = AIBannerEnhancementEngine.generateAllVariants(
    'camp_body_care_2026',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200',
    'Body Care Fair'
  );
};

import { usePromotionStore } from '../stores/promotionStore';

const promotionStore = usePromotionStore();

const toggleCampaignStatus = async (camp: any) => {
  const newStatus = camp.status === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE';
  camp.status = newStatus;
  await dataService.savePromotionCampaign(camp);
  await promotionStore.loadCampaignBanners();
  campaigns.value = await dataService.fetchPromotionCampaigns();
};

const deleteCampaign = async (campaignId: string) => {
  if (!confirm('Apakah Anda yakin ingin menghapus kampanye promo dan banner ini?')) return;
  await dataService.deletePromotionCampaign(campaignId);
  await promotionStore.loadCampaignBanners();
  campaigns.value = await dataService.fetchPromotionCampaigns();
};

onMounted(async () => {
  campaigns.value = await dataService.fetchPromotionCampaigns();
  if (campaigns.value.length > 0) {
    analytics.value = await CampaignAnalyticsEngine.getAnalytics(campaigns.value[0].id);
  }
  generateVariants();
});
</script>
