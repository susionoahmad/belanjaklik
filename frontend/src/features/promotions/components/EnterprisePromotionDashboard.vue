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
      <!-- JSM Promo Settings & Expiry Control Card -->
      <div class="bg-gradient-to-r from-amber-500/10 via-red-500/10 to-amber-500/10 dark:from-amber-950/40 dark:to-red-950/40 rounded-3xl p-5 border border-amber-300 dark:border-amber-700/60 space-y-4 shadow-soft">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-200 dark:border-amber-800/60 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-2xl bg-amber-400 text-red-950 flex items-center justify-center shrink-0 shadow-xs font-black">
              <Flame class="w-5 h-5 text-red-600 fill-red-600 animate-pulse" />
            </div>
            <div>
              <h4 class="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <span>Pengaturan Promo JSM (Jumat Sabtu Minggu)</span>
              </h4>
              <p class="text-[11px] text-gray-600 dark:text-gray-300">
                Atur periode aktif promo JSM. Produk yang berakhir otomatis hilang dari section JSM & harganya kembali normal.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <span 
              class="px-3 py-1 rounded-full text-xs font-black uppercase shadow-xs flex items-center gap-1"
              :class="isJsmCurrentlyExpired ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'"
            >
              <span>{{ isJsmCurrentlyExpired ? '🔴 PROMO BERAKHIR' : '🟢 PROMO AKTIF' }}</span>
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Tanggal Mulai JSM</label>
            <input 
              v-model="jsmForm.startDate" 
              type="date" 
              class="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800 text-xs font-bold focus:ring-2 focus:ring-brand-red outline-none" 
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Tanggal Selesai JSM</label>
            <input 
              v-model="jsmForm.endDate" 
              type="date" 
              class="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800 text-xs font-bold focus:ring-2 focus:ring-brand-red outline-none" 
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Status Kampanye JSM</label>
            <select 
              v-model="jsmForm.isActive" 
              class="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800 text-xs font-bold focus:ring-2 focus:ring-brand-red outline-none"
            >
              <option :value="true">✅ Aktifkan Promo JSM</option>
              <option :value="false">🚫 Nonaktifkan / Akhiri Promo JSM</option>
            </select>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div class="text-[11px] font-mono text-gray-600 dark:text-gray-400">
            Periode Aktif Tampilan: <strong class="text-amber-700 dark:text-amber-300">{{ formattedJsmRange }}</strong>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button 
              @click="handleSaveJsmConfig" 
              type="button" 
              class="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save class="w-3.5 h-3.5" />
              <span>Simpan Tanggal JSM</span>
            </button>

            <button 
              @click="handleQuickResetJsm" 
              type="button" 
              class="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              <span>Set JSM Baru (+2 Hari)</span>
            </button>

            <button 
              @click="handleForceExpireJsm" 
              type="button" 
              class="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 class="w-3.5 h-3.5" />
              <span>Akhiri JSM & Restore Harga</span>
            </button>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-soft space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 class="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar class="w-4 h-4 text-brand-red" />
              <span>Manajemen Banner Kampanye & Link Afiliasi</span>
            </h4>
            <p class="text-xs text-gray-500">Kelola banner promo, resolusi gambar, dan link afiliasi yang dituju saat pengunjung mengklik banner.</p>
          </div>

          <div class="flex items-center gap-2">
            <button 
              @click="handleResetDefaultBanners"
              type="button"
              class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 flex items-center gap-1.5 cursor-pointer"
              title="Reset data banner ke versi default terbaru"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              <span>Reset Banner Default</span>
            </button>
            <button 
              @click="openAddBannerModal"
              type="button"
              class="bg-brand-red hover:bg-brand-red-dark text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus class="w-4 h-4" />
              <span>Tambah Banner Afiliasi Baru</span>
            </button>
          </div>
        </div>

        <div class="space-y-3 pt-1">
          <div v-for="camp in campaigns" :key="camp.id" class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-gray-100 dark:border-gray-700 hover:border-brand-red/30 transition-all">
            <div class="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
              <div class="relative shrink-0">
                <img v-if="camp.desktop_banner || camp.banner_image" :src="camp.desktop_banner || camp.banner_image" class="w-24 h-14 object-cover rounded-xl border border-gray-200 dark:border-gray-600 shadow-xs" />
                <div v-else class="w-24 h-14 bg-gray-200 dark:bg-gray-600 rounded-xl flex items-center justify-center text-xs text-gray-400 font-bold">No Image</div>
                <span class="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded bg-gray-900/80 text-white text-[8px] font-mono font-bold">
                  {{ camp.banner_size || '1200x450' }}
                </span>
              </div>

              <div class="min-w-0 flex-1">
                <div class="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <span>{{ camp.title }}</span>
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase" :class="camp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-gray-200 text-gray-700'">
                    {{ camp.status }}
                  </span>
                  <span v-if="camp.affiliate_link || camp.target_url" class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
                    <ExternalLink class="w-2.5 h-2.5" /> Link Afiliasi Aktif
                  </span>
                </div>

                <div class="text-xs text-gray-500 line-clamp-1 mt-0.5 font-medium">
                  {{ camp.subtitle || camp.description || 'Banner kampanye promosi' }}
                </div>

                <!-- Link Afiliasi Details -->
                <div class="text-[11px] text-gray-600 dark:text-gray-300 font-mono mt-1.5 flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-gray-700 dark:text-gray-400">Target Link Afiliasi:</span>
                  <a 
                    :href="camp.affiliate_link || camp.target_url || `/campaign/${camp.slug}`" 
                    target="_blank" 
                    class="text-brand-red font-bold underline hover:text-red-700 truncate max-w-xs sm:max-w-md inline-block"
                  >
                    {{ camp.affiliate_link || camp.target_url || `/campaign/${camp.slug}` }}
                  </a>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
              <a
                :href="camp.affiliate_link || camp.target_url || `/campaign/${camp.slug}`"
                target="_blank"
                class="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center gap-1"
                title="Buka link afiliasi di tab baru untuk pengetesan"
              >
                <ExternalLink class="w-3.5 h-3.5" />
                <span>Tes Link ↗</span>
              </a>

              <button
                @click="copyAffiliateLink(camp.affiliate_link || camp.target_url || `/campaign/${camp.slug}`)"
                type="button"
                class="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 transition-all flex items-center gap-1 cursor-pointer"
                title="Salin link afiliasi"
              >
                <Copy class="w-3.5 h-3.5" />
                <span>Salin</span>
              </button>

              <button
                @click="openEditModal(camp)"
                type="button"
                class="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all cursor-pointer"
              >
                ✏️ Edit
              </button>

              <button
                @click="toggleCampaignStatus(camp)"
                type="button"
                class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer"
                :class="camp.status === 'ACTIVE'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'"
              >
                {{ camp.status === 'ACTIVE' ? '⏸️ Nonaktifkan' : '▶️ Aktifkan' }}
              </button>

              <button
                @click="deleteCampaign(camp.id)"
                type="button"
                class="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all cursor-pointer"
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

    <!-- Edit Campaign & Banner Modal -->
    <div v-if="editingCampaign" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
          <h3 class="font-black text-base text-gray-900 dark:text-white flex items-center gap-2">
            <span>✏️ Edit Banner Kampanye & Link Afiliasi</span>
          </h3>
          <button @click="editingCampaign = null" class="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer">&times;</button>
        </div>

        <div class="space-y-3 text-xs">
          <!-- Judul -->
          <div>
            <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Judul Kampanye Promo</label>
            <input v-model="editingCampaign.title" type="text" placeholder="Contoh: 8.8 Merdeka Sale" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 font-bold outline-none focus:ring-2 focus:ring-brand-red" />
          </div>

          <!-- Sub-Judul -->
          <div>
            <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Sub-Judul / Deskripsi Promo</label>
            <input v-model="editingCampaign.subtitle" type="text" placeholder="Diskon hingga 45% untuk tiket & hotel" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 font-semibold outline-none focus:ring-2 focus:ring-brand-red" />
          </div>

          <!-- Link Afiliasi (CRITICAL FEATURE) -->
          <div class="p-3 bg-red-50/60 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900/50 space-y-2">
            <div class="flex items-center justify-between">
              <label class="block font-extrabold text-red-900 dark:text-red-300 flex items-center gap-1.5">
                <ExternalLink class="w-4 h-4 text-brand-red" />
                <span>Link Afiliasi (Target URL Saat Banner Diklik)</span>
              </label>
              <span class="text-[10px] text-red-600 font-bold">Resmi / AccessTrade / Shopee</span>
            </div>
            <input 
              v-model="editingCampaign.affiliate_link" 
              type="url" 
              placeholder="https://atid.me/go/Rkcak4ql atau https://shopee.co.id/..." 
              class="w-full px-3 py-2 rounded-xl border border-red-300 dark:border-red-700 bg-white dark:bg-gray-800 font-mono text-xs font-bold text-brand-red focus:ring-2 focus:ring-brand-red outline-none" 
            />
            <p class="text-[10px] text-gray-500">Saat pengunjung mengklik banner di landing page atau homepage, pengunjung akan langsung diarahkan ke link ini.</p>
          </div>

          <!-- Banner Image & Resolution -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">URL Gambar Banner</label>
              <input v-model="editingCampaign.desktop_banner" type="url" placeholder="https://..." class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 font-medium outline-none focus:ring-2 focus:ring-brand-red" />
            </div>

            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Ukuran Resolusi Banner</label>
              <select v-model="editingCampaign.banner_size" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 font-bold outline-none focus:ring-2 focus:ring-brand-red">
                <option value="1200x450">1200 x 450 (Hero Slider)</option>
                <option value="960x368">960 x 368 (Medium Banner)</option>
                <option value="1080x1080">1080 x 1080 (Square Instagram)</option>
                <option value="1920x1080">1920 x 1080 (Full HD Banner)</option>
                <option value="600x300">600 x 300 (Mobile Banner)</option>
                <option value="800x250">800 x 250 (Category Header)</option>
              </select>
            </div>
          </div>

          <!-- Preview Banner -->
          <div v-if="editingCampaign.desktop_banner || editingCampaign.banner_image" class="space-y-1">
            <div class="text-[10px] font-bold text-gray-400">Preview Tampilan Banner:</div>
            <img :src="editingCampaign.desktop_banner || editingCampaign.banner_image" class="w-full h-28 object-cover rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs" />
          </div>

          <!-- Dates -->
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

          <!-- Syarat & Ketentuan -->
          <div>
            <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Syarat & Ketentuan</label>
            <textarea v-model="editingCampaign.terms_conditions" rows="2" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 font-medium outline-none focus:ring-2 focus:ring-brand-red"></textarea>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <button @click="editingCampaign = null" type="button" class="px-4 py-2 rounded-xl font-extrabold text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer">
            Batal
          </button>
          <button @click="saveEditedCampaign" type="button" class="px-5 py-2 rounded-xl font-extrabold text-xs text-white bg-brand-red hover:bg-brand-red-dark transition-all shadow-md cursor-pointer">
            Simpan Perubahan Banner
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { BarChart3, Calendar, Sliders, Wand2, Sparkles, Flame, Save, RotateCcw, Trash2, Plus, ExternalLink, Copy } from 'lucide-vue-next';
import { dataService } from '../../shared/db/dataService';
import { CampaignAnalyticsEngine } from '../engine/CampaignAnalyticsEngine';
import { AIBannerEnhancementEngine } from '../engine/AIBannerEnhancementEngine';
import { CampaignTemplateLibrary } from '../engine/CampaignTemplateLibrary';
import { JsmPromoService } from '../services/JsmPromoService';
import { useCatalogStore } from '../../catalog/stores/catalogStore';
import { usePromotionStore } from '../stores/promotionStore';
import type { BannerVariant } from '../types/enterpriseTypes';

const catalogStore = useCatalogStore();
const promotionStore = usePromotionStore();

const activeSubTab = ref('scheduler'); // default to scheduler & banner management tab for admin quick access
const campaigns = ref<any[]>([]);

const openEditModal = (camp: any) => {
  editingCampaign.value = {
    ...camp,
    banner_size: camp.banner_size || '1200x450',
    affiliate_link: camp.affiliate_link || camp.target_url || '',
    desktop_banner: camp.desktop_banner || camp.banner_image || ''
  };
};

const openAddBannerModal = () => {
  const newId = `camp_${Date.now()}`;
  editingCampaign.value = {
    id: newId,
    title: '',
    slug: `promo-${Date.now().toString().slice(-4)}`,
    subtitle: '',
    desktop_banner: '',
    banner_size: '1200x450',
    affiliate_link: '',
    target_url: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    campaign_type: 'FAIR',
    priority: 10,
    status: 'ACTIVE',
    terms_conditions: ''
  };
};

const handleResetDefaultBanners = async () => {
  if (confirm('Reset data banner & kampanye promo ke versi default terbaru? (Mengembalikan banner 8.8 Merdeka Sale & Body Care Fair)')) {
    const fresh = await dataService.resetPromotionCampaigns();
    campaigns.value = fresh;
    await promotionStore.loadCampaignBanners();
    alert('✅ Data banner promo telah diperbarui ke versi default!');
  }
};

const copyAffiliateLink = (url: string) => {
  if (!url) return;
  navigator.clipboard.writeText(url);
  alert(`✅ Link Afiliasi berhasil disalin ke clipboard:\n${url}`);
};

const saveEditedCampaign = async () => {
  if (!editingCampaign.value) return;
  if (!editingCampaign.value.title) {
    alert('Mohon isi Judul Kampanye Promo');
    return;
  }

  // Auto set target_url to affiliate_link if provided
  if (editingCampaign.value.affiliate_link && !editingCampaign.value.target_url) {
    editingCampaign.value.target_url = editingCampaign.value.affiliate_link;
  }

  if (!editingCampaign.value.slug) {
    editingCampaign.value.slug = editingCampaign.value.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  await dataService.savePromotionCampaign(editingCampaign.value);
  await promotionStore.loadCampaignBanners();
  campaigns.value = await dataService.fetchPromotionCampaigns();
  editingCampaign.value = null;
  alert('✅ Banner Kampanye & Link Afiliasi berhasil disimpan!');
};

const jsmConfig = ref(JsmPromoService.getJsmConfig());
const jsmForm = ref({
  startDate: jsmConfig.value.startDate,
  endDate: jsmConfig.value.endDate,
  isActive: jsmConfig.value.isActive
});

const isJsmCurrentlyExpired = computed(() => {
  return JsmPromoService.isJsmExpired(jsmConfig.value);
});

const formattedJsmRange = computed(() => {
  return JsmPromoService.formatJsmDateRange(jsmConfig.value.startDate, jsmConfig.value.endDate);
});

const handleSaveJsmConfig = async () => {
  jsmConfig.value = JsmPromoService.saveJsmConfig({
    startDate: jsmForm.value.startDate,
    endDate: jsmForm.value.endDate,
    isActive: Boolean(jsmForm.value.isActive)
  });

  await catalogStore.fetchCatalogData();
  alert('✅ Pengaturan Promo JSM berhasil diperbarui!');
};

const handleQuickResetJsm = async () => {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 2);

  const startDateStr = today.toISOString().slice(0, 10);
  const endDateStr = endDate.toISOString().slice(0, 10);

  jsmForm.value = {
    startDate: startDateStr,
    endDate: endDateStr,
    isActive: true
  };

  jsmConfig.value = JsmPromoService.saveJsmConfig({
    startDate: startDateStr,
    endDate: endDateStr,
    isActive: true
  });

  await catalogStore.fetchCatalogData();
  alert(`✅ Periode Promo JSM baru berhasil diaktifkan: ${JsmPromoService.formatJsmDateRange(startDateStr, endDateStr)}!`);
};

const handleForceExpireJsm = async () => {
  if (!confirm('Apakah Anda yakin ingin mengakhiri Promo JSM sekarang? Seluruh produk JSM yang berakhir akan hilang dari section JSM dan harganya kembali ke harga normal semula.')) return;

  const result = await JsmPromoService.forceExpireAllJsmPromos(catalogStore.products);
  catalogStore.products = result.updatedProducts;
  jsmConfig.value = JsmPromoService.getJsmConfig();
  jsmForm.value.isActive = false;

  await catalogStore.fetchCatalogData();
  alert(`✅ Promo JSM telah diakhiri! ${result.expiredCount} produk JSM telah dikembalikan ke harga semula.`);
};
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

const sampleRule = ref({ min_purchase_amount: 50000, member_only: false });

const subTabs = [
  { id: 'scheduler', name: 'Manajemen Banner & Link Afiliasi', icon: Calendar },
  { id: 'analytics', name: 'Analisis & ROI', icon: BarChart3 },
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
