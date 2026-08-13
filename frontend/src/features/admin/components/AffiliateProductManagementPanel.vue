<template>
  <div class="space-y-5">
    <!-- Top Toolbar Header -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="font-extrabold text-lg sm:text-xl text-gray-900 dark:text-white flex items-center gap-2">
          <Share2 class="w-6 h-6 text-emerald-500" />
          <span>Kelola Produk Afiliasi Manual</span>
        </h2>
        <p class="text-xs text-gray-500 mt-0.5">
          Manajemen katalog produk rekomendasi belanja dari Shopee, Tokopedia, Blibli, Lazada & TikTok Shop via ACCESSTRADE
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button 
          @click="isBulkImportOpen = true" 
          class="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
        >
          <UploadCloud class="w-4 h-4" />
          <span>Import Feed (CSV/Excel)</span>
        </button>

        <button
          @click="isCaptureOpen = true"
          class="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
        >
          <Code2 class="w-4 h-4" />
          <span>Capture ACCESSTRADE</span>
        </button>
        <button 
          @click="openAddModal" 
          class="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
        >
          <Plus class="w-4 h-4" />
          <span>Tambah Produk Afiliasi</span>
        </button>

        <button 
          @click="loadProducts" 
          :disabled="isLoading" 
          title="Refresh Data"
          class="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:text-emerald-600 shadow-soft cursor-pointer disabled:opacity-50"
        >
          <RefreshCw :class="{ 'animate-spin': isLoading }" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Summary Metrics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <!-- Card 1: Total Produk -->
      <div class="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft flex items-center gap-3">
        <div class="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl text-emerald-600 dark:text-emerald-400">
          <Package class="w-6 h-6" />
        </div>
        <div>
          <div class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Produk Afiliasi</div>
          <div class="font-extrabold text-xl text-gray-900 dark:text-white">{{ totalProducts }}</div>
        </div>
      </div>

      <!-- Card 2: Produk Aktif -->
      <div class="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft flex items-center gap-3">
        <div class="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-2xl text-blue-600 dark:text-blue-400">
          <CheckCircle2 class="w-6 h-6" />
        </div>
        <div>
          <div class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Produk Aktif Tampil</div>
          <div class="font-extrabold text-xl text-emerald-600 dark:text-emerald-400">{{ activeProductsCount }}</div>
        </div>
      </div>

      <!-- Card 3: Rata-rata Komisi -->
      <div class="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft flex items-center gap-3">
        <div class="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-2xl text-amber-600 dark:text-amber-400">
          <Percent class="w-6 h-6" />
        </div>
        <div>
          <div class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Rata-Rata Komisi</div>
          <div class="font-extrabold text-xl text-amber-600 dark:text-amber-400">{{ averageCommission }}%</div>
        </div>
      </div>
    </div>

    <!-- Accesstrade Affiliate Integration Settings -->
    <div class="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <Link2 class="w-5 h-5 text-emerald-500" />
            <span>Integrasi Afiliasi Accesstrade Indonesia</span>
          </h3>
          <p class="text-xs text-gray-500 mt-0.5">
            Atur Publisher Site ID & SubID untuk konversi otomatis tautan belanja ke Deep Link Afiliasi Accesstrade Indonesia.
          </p>
        </div>
        <span class="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {{ accesstradeConfig.isEnabled ? '● Afiliasi Aktif' : '○ Afiliasi Non-Aktif' }}
        </span>
      </div>

      <form @submit.prevent="saveAccesstradeSettings" class="space-y-3 pt-1">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Publisher Site ID (Accesstrade)</label>
            <input 
              v-model="accesstradeConfig.siteId" 
              type="text" 
              placeholder="Contoh: 123456" 
              class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">SubID / RK ID (Opsional)</label>
            <input 
              v-model="accesstradeConfig.rkId" 
              type="text" 
              placeholder="Contoh: belanjaklik_app" 
              class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
          </div>
        </div>

        <div class="flex items-center justify-between pt-1">
          <label class="flex items-center gap-2 font-bold text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" v-model="accesstradeConfig.isEnabled" class="w-4 h-4 accent-emerald-600 rounded" />
            <span>Aktifkan Konversi Otomatis Deep Link Afiliasi</span>
          </label>

          <button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-sm cursor-pointer">
            Simpan Pengaturan Afiliasi
          </button>
        </div>
      </form>
    </div>

    <!-- Search & Filter Controls -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-soft">
      <!-- Search Input -->
      <div class="relative">
        <Search class="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Cari nama produk, toko, atau kategori..." 
          class="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none" 
        />
      </div>

      <!-- Sort Filter -->
      <div>
        <select 
          v-model="selectedSort" 
          class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          <option value="">Urutkan: Terbaru</option>
          <option value="sold">Terlaris (Item Sold)</option>
          <option value="discount">Diskon Terbesar</option>
          <option value="rating">Rating Terbaik</option>
          <option value="price_low">Harga Terendah</option>
          <option value="price_high">Harga Tertinggi</option>
        </select>
      </div>

      <!-- Merchant Filter -->
      <div>
        <select 
          v-model="selectedMerchantFilter" 
          class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          <option value="">Semua Merchant / Platform</option>
          <option value="shopee">Shopee</option>
          <option value="tokopedia">Tokopedia</option>
          <option value="blibli">Blibli</option>
          <option value="lazada">Lazada</option>
          <option value="tiktok_shop">TikTok Shop</option>
          <option value="oppo">OPPO</option>
          <option value="traveloka">Traveloka</option>
          <option value="other">Lainnya</option>
        </select>
      </div>

      <!-- Status Filter -->
      <div>
        <select 
          v-model="selectedStatusFilter" 
          class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          <option value="">Semua Status</option>
          <option value="active">Aktif (Tampil di App)</option>
          <option value="inactive">Non-Aktif (Disembunyikan)</option>
        </select>
      </div>
    </div>

    <!-- Affiliate Products Data Table -->
    <div class="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-soft">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th class="p-3.5">Produk Afiliasi</th>
              <th class="p-3.5">Merchant</th>
              <th class="p-3.5">Harga</th>
              <th class="p-3.5">Komisi (%)</th>
              <th class="p-3.5">Status</th>
              <th class="p-3.5 text-right min-w-[150px]">Aksi Management</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-if="isLoading && products.length === 0">
              <td colspan="6" class="p-8 text-center text-gray-400 font-semibold">
                Memuat data produk afiliasi...
              </td>
            </tr>
            <tr v-else-if="filteredProducts.length === 0">
              <td colspan="6" class="p-8 text-center text-gray-400 font-semibold">
                Tidak ada produk afiliasi yang cocok dengan kriteria filter.
              </td>
            </tr>
            <tr 
              v-for="p in filteredProducts" 
              :key="p.id" 
              class="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
            >
              <!-- Info Produk & Gambar -->
              <td class="p-3.5 flex items-center gap-3">
                <img 
                  :src="proxyImageUrl(p.image_url || '')" 
                  :alt="p.name" 
                  class="w-10 h-10 object-cover rounded-xl shrink-0 border border-gray-100 dark:border-gray-700" 
                  @error="($event.target as HTMLImageElement).src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=150'" 
                />
                <div class="min-w-0 max-w-xs sm:max-w-md">
                  <div class="font-bold text-gray-900 dark:text-white line-clamp-1" :title="p.name">
                    {{ p.name }}
                  </div>
                  <div class="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                    <span v-if="p.shop_name" class="font-medium text-gray-500 dark:text-gray-400">
                      🛍️ {{ p.shop_name }}
                    </span>
                    <span v-if="p.category" class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 font-mono">
                      {{ p.category }}
                    </span>
                    <span class="text-emerald-600 dark:text-emerald-400 font-mono">
                      Tag: {{ p.source || 'manual_link' }}
                    </span>
                    <span v-if="p.site_id" class="text-blue-600 dark:text-blue-400 font-mono">
                      Site: {{ p.site_id }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- Merchant Badge -->
              <td class="p-3.5 whitespace-nowrap">
                <span 
                  :class="getMerchantBadgeClass(p.merchant)" 
                  class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 w-fit shadow-xs"
                >
                  <span>{{ getMerchantName(p.merchant) }}</span>
                </span>
              </td>

              <!-- Harga & Harga Coret -->
              <td class="p-3.5 whitespace-nowrap">
                <div class="font-bold text-emerald-600 dark:text-emerald-400">
                  {{ p.price ? formatRupiah(p.price) : '-' }}
                </div>
                <div v-if="p.original_price && p.price && p.original_price > p.price" class="text-[10px] text-gray-400 line-through">
                  {{ formatRupiah(p.original_price) }}
                  <span class="text-red-500 font-bold ml-0.5">-{{ p.discount_percent }}%</span>
                </div>
              </td>

              <!-- Komisi (%) -->
              <td class="p-3.5 whitespace-nowrap">
                <span v-if="p.commission_rate !== undefined && p.commission_rate !== null" class="font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-900">
                  {{ p.commission_rate }}%
                </span>
                <span v-else class="text-gray-400 font-mono">-</span>
              </td>

              <!-- Status Toggle Direct -->
              <td class="p-3.5 whitespace-nowrap">
                <button 
                  @click="handleToggleActive(p)" 
                  :title="p.is_active ? 'Klik untuk Non-Aktifkan' : 'Klik untuk Aktifkan'"
                  class="px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-colors border"
                  :class="p.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900 hover:bg-emerald-100' : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600 hover:bg-gray-200'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="p.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'"></span>
                  <span>{{ p.is_active ? 'Aktif (Tampil)' : 'Non-Aktif' }}</span>
                </button>
              </td>

              <!-- Aksi Edit & Hapus -->
              <td class="p-3.5 text-right whitespace-nowrap">
                <div class="flex items-center justify-end gap-1.5">
                  <!-- External Link Test -->
                  <a 
                    :href="getProductClickUrl(p)" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    title="Buka Link Affiliate" 
                    class="p-1.5 text-gray-500 hover:text-emerald-600 bg-gray-50 dark:bg-gray-700 hover:bg-emerald-50 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
                  >
                    <ExternalLink class="w-3.5 h-3.5" />
                  </a>

                  <!-- Share Promo -->
                  <button 
                    @click="openShareModal(p)" 
                    title="Buat Posting Promo & Bagikan ke Sosmed"
                    class="px-2.5 py-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-900 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <Share2 class="w-3.5 h-3.5" />
                    <span>Promo</span>
                  </button>

                  <!-- Edit -->
                  <button 
                    @click="openEditModal(p)" 
                    title="Edit Produk"
                    class="px-2.5 py-1 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 dark:border-blue-900 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 class="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <!-- Hapus -->
                  <button 
                    @click="confirmDelete(p)" 
                    title="Hapus Produk"
                    class="px-2.5 py-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 rounded-lg transition-colors border border-red-200 dark:border-red-900 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="p-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50">
        <div class="flex flex-wrap items-center gap-2">
          <span>Tampilkan</span>
          <select 
            v-model="pageSize" 
            @change="handlePageSizeChange" 
            class="px-2.5 py-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 font-bold text-gray-800 dark:text-gray-200 outline-none"
          >
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <span>per halaman</span>
          <span class="mx-1 text-gray-300 dark:text-gray-600">•</span>
          <span class="font-medium text-gray-600 dark:text-gray-300">
            Menampilkan {{ totalProducts > 0 ? (currentPage - 1) * pageSize + 1 : 0 }} - {{ Math.min(currentPage * pageSize, totalProducts) }} dari {{ totalProducts }} produk
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button 
            @click="goToPage(currentPage - 1)" 
            :disabled="currentPage <= 1 || isLoading" 
            class="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-gray-700 dark:text-gray-200 transition-all flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft class="w-4 h-4" />
            <span>Sebelumnya</span>
          </button>

          <span class="px-3 py-1.5 font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-xl">
            {{ currentPage }} / {{ totalPages }}
          </span>

          <button 
            @click="goToPage(currentPage + 1)" 
            :disabled="currentPage >= totalPages || isLoading" 
            class="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-gray-700 dark:text-gray-200 transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>Berikutnya</span>
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Browser Capture Instructions -->
    <Modal :isOpen="isCaptureOpen" @close="isCaptureOpen = false">
      <div class="space-y-4 p-1">
        <div>
          <h3 class="font-extrabold text-base text-gray-900 dark:text-white">Capture Produk ACCESSTRADE</h3>
          <p class="text-xs text-gray-500 mt-1">Gunakan bookmarklet ini di halaman ACCESSTRADE yang sudah login. Sistem mengambil data kartu produk dan link GET LINK.</p>
        </div>
        <ol class="list-decimal pl-5 space-y-1 text-xs text-gray-600 dark:text-gray-300">
          <li>Salin kode di bawah, buat bookmark browser baru, lalu tempel kode sebagai URL bookmark.</li>
          <li>Buka halaman daftar produk ACCESSTRADE dan klik bookmark tersebut.</li>
          <li>Hasil capture otomatis disalin ke clipboard. Kembali ke sini dan klik Import Clipboard.</li>
        </ol>
        <textarea :value="captureBookmarklet" readonly rows="5" class="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-2 text-[10px] font-mono break-all"></textarea>
        <div class="flex gap-2">
          <button @click="copyCaptureBookmarklet" class="flex-1 px-3 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5"><Clipboard class="w-4 h-4" /> Salin Bookmarklet</button>
          <button @click="importFromClipboard" class="flex-1 px-3 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5"><UploadCloud class="w-4 h-4" /> Import Clipboard</button>
        </div>
        <p v-if="captureMessage" :class="['text-xs font-semibold', captureFailed ? 'text-red-600' : 'text-emerald-700']">{{ captureMessage }}</p>
      </div>
    </Modal>
    <!-- Edit/Add Modal Component -->
    <AffiliateProductModal 
      :isOpen="isModalOpen" 
      :product="selectedProduct" 
      @close="isModalOpen = false" 
      @save="handleSaveProduct" 
    />

    <!-- Modal Confirm Delete -->
    <Modal :isOpen="isConfirmDeleteOpen" @close="isConfirmDeleteOpen = false">
      <div v-if="productToDelete" class="space-y-4 text-center p-2">
        <div class="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
          <AlertTriangle class="w-6 h-6" />
        </div>
        <div>
          <h3 class="font-extrabold text-base text-gray-900 dark:text-white">Hapus Produk Afiliasi?</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Anda yakin ingin menghapus <strong>"{{ productToDelete.name }}"</strong> dari daftar rekomendasi afiliasi?
          </p>
        </div>
        <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700 text-left">
          <img :src="proxyImageUrl(productToDelete.image_url || '')" class="w-12 h-12 object-cover rounded-xl shrink-0" />
          <div class="min-w-0">
            <div class="font-bold text-xs text-gray-900 dark:text-white line-clamp-1">{{ productToDelete.name }}</div>
            <div class="text-[10px] text-gray-400 mt-0.5">Platform: {{ getMerchantName(productToDelete.merchant) }}</div>
          </div>
        </div>
        <div class="flex gap-2 pt-2">
          <button @click="isConfirmDeleteOpen = false" class="flex-1 py-2.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            Batal
          </button>
          <button @click="executeDelete" class="flex-1 py-2.5 rounded-xl text-xs font-extrabold bg-red-600 text-white hover:bg-red-700 shadow-md cursor-pointer">
            Ya, Hapus Sekarang
          </button>
        </div>
      </div>
    </Modal>

    <!-- Bulk Import Modal Component -->
    <AffiliateBulkImportModal 
      :isOpen="isBulkImportOpen" 
      @close="isBulkImportOpen = false" 
      @imported="handleBulkImported" 
    />

    <!-- Share Promo Modal -->
    <AffiliatePromoShareModal 
      :isOpen="isShareOpen" 
      :product="productToShare" 
      @close="isShareOpen = false" 
    />

    <!-- Toast Notification -->
    <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="transform translate-y-4 opacity-0" enter-to-class="transform translate-y-0 opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="transform translate-y-0 opacity-100" leave-to-class="transform translate-y-4 opacity-0">
      <div v-if="toastMessage" class="fixed bottom-6 right-6 z-50 bg-gray-900 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-gray-700">
        <CheckCircle class="w-4 h-4 text-emerald-400 shrink-0" />
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { 
  Share2, Plus, RefreshCw, Package, CheckCircle2, Percent, Search, Clipboard, Code2, 
  ExternalLink, Edit3, Trash2, AlertTriangle, CheckCircle, UploadCloud, Store, Link2,
  ChevronLeft, ChevronRight
} from 'lucide-vue-next';import Modal from '@/features/shared/components/Modal.vue';
import AffiliateProductModal from '@/features/affiliate/components/AffiliateProductModal.vue';
import AffiliateBulkImportModal from '@/features/affiliate/components/AffiliateBulkImportModal.vue';
import AffiliatePromoShareModal from '@/features/affiliate/components/AffiliatePromoShareModal.vue';
import type { AffiliateProduct } from '@/features/affiliate/types';
import { formatRupiah } from '@/features/shared/utils/formatters';
import { proxyImageUrl } from '@/features/tokosaya-sync/services/ImageProxyService';
import { getAccesstradeCaptureBookmarklet, readCapturedAffiliateProducts, readAffiliateCaptureFromHash } from '@/features/affiliate/services/affiliateCaptureService';
import { AccesstradeEngine, type AccesstradeConfig } from '@/features/affiliate/services/AccesstradeService';
import { 
  getAllAffiliateProductsAdmin, 
  getAffiliateProductByIdAdmin,
  getAffiliateProductsCount,
  saveAffiliateProduct, 
  deleteAffiliateProduct, 
  toggleAffiliateProductStatus 
} from '@/features/affiliate/services/affiliateService';

const getProductClickUrl = (p: AffiliateProduct): string => {
  const affUrl = p.affiliate_url?.trim() || '';
  const prodUrl = p.product_url?.trim() || '';
  if (prodUrl && prodUrl.startsWith('http')) {
    if (affUrl.toLowerCase().includes('accesstrade.co.id/click')) {
      return affUrl;
    }
    return AccesstradeEngine.convertToAffiliateUrl(prodUrl);
  }
  return affUrl || prodUrl;
};

const products = ref<AffiliateProduct[]>([]);
const totalProducts = ref(0);
const activeProductsCount = ref(0);
const isLoading = ref(false);
const searchQuery = ref('');
const selectedMerchantFilter = ref('');
const selectedStatusFilter = ref('');
const selectedSort = ref('');
const isShareOpen = ref(false);
const productToShare = ref<AffiliateProduct | null>(null);

const currentPage = ref(1);
const pageSize = ref(20);

const totalPages = computed(() => {
  return Math.ceil(totalProducts.value / pageSize.value) || 1;
});

const isModalOpen = ref(false);
const isCaptureOpen = ref(false);
const captureMessage = ref('');
const captureFailed = ref(false);
const captureBookmarklet = getAccesstradeCaptureBookmarklet(`${window.location.origin}/admin`);
const isBulkImportOpen = ref(false);
const selectedProduct = ref<AffiliateProduct | null>(null);

const isConfirmDeleteOpen = ref(false);
const productToDelete = ref<AffiliateProduct | null>(null);

// Accesstrade Config state
const accesstradeConfig = ref<AccesstradeConfig>({
  siteId: '',
  rkId: '',
  isEnabled: false
});

const saveAccesstradeSettings = () => {
  AccesstradeEngine.saveConfig(accesstradeConfig.value);
  showToast('Pengaturan Afiliasi Accesstrade Indonesia berhasil disimpan!');
};

const toastMessage = ref('');

const showToast = (msg: string) => {
  toastMessage.value = msg;
  setTimeout(() => {
    toastMessage.value = '';
  }, 3500);
};

const importCaptureFromHash = async () => {
  try {
    const captured = readAffiliateCaptureFromHash();
    if (!captured.length) return;
    let saved = 0;
    for (const product of captured) {
      const result = await saveAffiliateProduct({ ...product, site_id: '127950', source: 'accesstrade_browser_capture', is_active: true });
      if (result) saved++;
    }
    window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
    await loadProducts();
    showToast(`${saved} produk ACCESSTRADE berhasil diimport.`);
  } catch (error) {
    captureMessage.value = error instanceof Error ? error.message : 'Gagal membaca hasil capture.';
    captureFailed.value = true;
    isCaptureOpen.value = true;
  }
};
const copyCaptureBookmarklet = async () => {
  try {
    await navigator.clipboard.writeText(captureBookmarklet);
    captureMessage.value = 'Bookmarklet berhasil disalin. Tempel sebagai URL bookmark browser.';
    captureFailed.value = false;
  } catch {
    captureMessage.value = 'Clipboard browser tidak tersedia. Salin kode dari kotak secara manual.';
    captureFailed.value = true;
  }
};

const importFromClipboard = async () => {
  try {
    const captured = await readCapturedAffiliateProducts();
    let saved = 0;
    for (const product of captured) {
      const result = await saveAffiliateProduct({ ...product, site_id: '127950', source: 'accesstrade_browser_capture', is_active: true });
      if (result) saved++;
    }
    await loadProducts();
    captureMessage.value = `${saved} produk berhasil diimport dari ACCESSTRADE.`;
    captureFailed.value = false;
  } catch (error) {
    captureMessage.value = error instanceof Error ? error.message : 'Gagal membaca hasil capture.';
    captureFailed.value = true;
  }
};

const loadProducts = async () => {
  isLoading.value = true;
  try {
    const res = await getAllAffiliateProductsAdmin({
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchQuery.value.trim() || undefined,
      merchant: selectedMerchantFilter.value || undefined,
      sort: selectedSort.value || undefined,
    });
    products.value = res.data;
    totalProducts.value = res.total;

    // Hitung produk aktif tidak memblok render tabel (fire-and-forget)
    getAffiliateProductsCount({ is_active: true })
      .then(c => { activeProductsCount.value = c; })
      .catch(() => {});
  } finally {
    isLoading.value = false;
  }
};

let searchDebounceTimer: any = null;
watch(searchQuery, () => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    currentPage.value = 1;
    loadProducts();
  }, 300);
});

watch(selectedMerchantFilter, () => {
  currentPage.value = 1;
  loadProducts();
});

watch(selectedSort, () => {
  currentPage.value = 1;
  loadProducts();
});

const openShareModal = (p: AffiliateProduct) => {
  productToShare.value = p;
  isShareOpen.value = true;
};

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  loadProducts();
};

const handlePageSizeChange = () => {
  currentPage.value = 1;
  loadProducts();
};

onMounted(() => {
  accesstradeConfig.value = AccesstradeEngine.getConfig();
  loadProducts();
});

const averageCommission = computed(() => {
  const withComm = products.value.filter(p => p.commission_rate !== undefined && p.commission_rate !== null && p.commission_rate > 0);
  if (withComm.length === 0) return '0';
  const total = withComm.reduce((acc, p) => acc + (p.commission_rate || 0), 0);
  return (total / withComm.length).toFixed(1);
});

const filteredProducts = computed(() => {
  let list = products.value;

  if (selectedStatusFilter.value === 'active') {
    list = list.filter(p => p.is_active);
  } else if (selectedStatusFilter.value === 'inactive') {
    list = list.filter(p => !p.is_active);
  }

  return list;
});

const getMerchantName = (merchant: string): string => {
  switch (merchant?.toLowerCase()) {
    case 'shopee': return 'Shopee';
    case 'tokopedia': return 'Tokopedia';
    case 'blibli': return 'Blibli';
    case 'lazada': return 'Lazada';
    case 'tiktok_shop': return 'TikTok Shop';
    case 'traveloka': return 'Traveloka';
    case 'oppo': return 'OPPO';
    default: return 'Merchant Lain';
  }
};

const getMerchantBadgeClass = (merchant: string): string => {
  switch (merchant?.toLowerCase()) {
    case 'shopee': 
      return 'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900';
    case 'tokopedia': 
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900';
    case 'lazada': 
      return 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900';
    case 'tiktok_shop': 
      return 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-900';
    case 'traveloka':
      return 'bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-900';
    case 'oppo':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900';
    default: 
      return 'bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
  }
};

const openAddModal = () => {
  selectedProduct.value = null;
  isModalOpen.value = true;
};

const openEditModal = async (p: AffiliateProduct) => {
  selectedProduct.value = p;
  isModalOpen.value = true;
  // Fetch full details (including description & raw_data) via single-row query
  const fullProduct = await getAffiliateProductByIdAdmin(p.id);
  if (fullProduct) {
    selectedProduct.value = fullProduct;
  }
};

const handleSaveProduct = async (payload: Partial<AffiliateProduct>) => {
  isModalOpen.value = false;
  const result = await saveAffiliateProduct(payload);
  if (result) {
    showToast(`Produk afiliasi "${result.name}" berhasil disimpan!`);
    await loadProducts();
  }
};

const handleToggleActive = async (p: AffiliateProduct) => {
  const newStatus = !p.is_active;
  p.is_active = newStatus; // Optimistic update
  const ok = await toggleAffiliateProductStatus(p.id, newStatus);
  if (ok) {
    showToast(`Status "${p.name}" diubah menjadi ${newStatus ? 'Aktif' : 'Non-Aktif'}`);
  } else {
    await loadProducts();
  }
};

const confirmDelete = (p: AffiliateProduct) => {
  productToDelete.value = p;
  isConfirmDeleteOpen.value = true;
};

const executeDelete = async () => {
  if (!productToDelete.value) return;
  const target = productToDelete.value;
  isConfirmDeleteOpen.value = false;
  const ok = await deleteAffiliateProduct(target.id);
  if (ok) {
    showToast(`Produk "${target.name}" telah dihapus!`);
    await loadProducts();
  }
};

const handleBulkImported = async () => {
  showToast('Import massal produk feed berhasil!');
  await loadProducts();
};
</script>
