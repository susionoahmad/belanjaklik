<template>
  <div class="space-y-6 pb-20">
    <!-- Panel Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-extrabold text-xl sm:text-2xl text-gray-900 dark:text-white">Panel Pengelola Toko</h1>
        <p class="text-xs text-gray-500">Kelola produk, toko, channel pemenuhan, dan kampanye promosi</p>
      </div>

      <div v-if="adminStore.isAuthenticated" class="flex items-center gap-3">
        <span v-if="adminStore.user?.email" class="text-xs font-semibold text-gray-500 dark:text-gray-400 hidden sm:inline-block">
          {{ adminStore.user.email }}
        </span>
        <button 
          @click="adminStore.logout()" 
          class="text-xs font-bold text-red-500 hover:underline flex items-center gap-1 bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-xl border border-red-100 dark:border-red-900"
        >
          <LogOut class="w-4 h-4" />
          <span>Keluar Sesi</span>
        </button>
      </div>
    </div>

    <!-- Login View (Umum & Praktis) -->
    <div v-if="!adminStore.isAuthenticated" class="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-xl space-y-4">
      <div class="w-12 h-12 rounded-2xl bg-brand-red/10 text-brand-red flex items-center justify-center mx-auto mb-2">
        <Lock class="w-6 h-6" />
      </div>
      <div class="text-center">
        <h3 class="font-extrabold text-base text-gray-900 dark:text-white">Masuk Pengelola Toko</h3>
        <p class="text-xs text-gray-500 mt-1">Masukkan Email dan Kata Sandi untuk mengakses panel pengelolaan toko</p>
      </div>

      <!-- Error Alert -->
      <div v-if="adminStore.errorMessage" class="bg-red-50 text-red-600 text-xs font-semibold p-3 rounded-xl border border-red-200">
        {{ adminStore.errorMessage }}
      </div>

      <form @submit.prevent="handleLogin" class="space-y-3">
        <div>
          <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Email / Username</label>
          <input 
            v-model="adminStore.email" 
            type="email" 
            placeholder="pengelola@tokoberkah.com" 
            required 
            class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-brand-red outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Kata Sandi</label>
          <input 
            v-model="adminStore.password" 
            type="password" 
            placeholder="Masukkan Kata Sandi" 
            required 
            class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-brand-red outline-none"
          />
        </div>

        <button 
          type="submit" 
          :disabled="adminStore.isLoading"
          class="w-full bg-brand-red hover:bg-brand-red-dark text-white font-extrabold py-3 rounded-2xl shadow-md text-sm transition-all flex items-center justify-center gap-2"
        >
          <span v-if="adminStore.isLoading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <span>{{ adminStore.isLoading ? 'Memproses...' : 'Masuk ke Dashboard' }}</span>
        </button>
      </form>
    </div>

    <!-- Authenticated CMS Dashboard -->
    <div v-else class="space-y-5">
      <!-- Nav Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5"
          :class="activeTab === tab.id ? 'bg-brand-red text-white border-brand-red shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-red/50'"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          <span>{{ tab.name }}</span>
        </button>
      </div>

      <!-- Tab 1: Analytics -->
      <div v-if="activeTab === 'analytics'">
        <AnalyticsDashboard />
      </div>

      <!-- Tab 2: Product Import Engine (Scanner Sembako AI) -->
      <div v-else-if="activeTab === 'import-engine'">
        <ProductImportPanel />
      </div>

      <!-- Tab 2.5: Promotion Campaign Engine (Flyer AI & Enterprise Promotion Platform) -->
      <div v-else-if="activeTab === 'campaign-engine'" class="space-y-6">
        <FlyerCampaignUploader @flyerSelected="handleFlyerSelected" />
        <CampaignReviewPanel 
          v-if="activeCampaignData" 
          :key="flyerKey"
          :parsedData="activeCampaignData" 
          :flyerImageUrl="activeFlyerUrl" 
          @published="handleCampaignPublished"
        />
        <EnterprisePromotionDashboard />
      </div>

      <!-- Tab 3: Product Knowledge AI Engine -->
      <div v-else-if="activeTab === 'knowledge-engine'">
        <KnowledgeDashboard />
      </div>

      <!-- Tab 4: Products Management -->
      <div v-else-if="activeTab === 'products'" class="space-y-4">
        <!-- Top Toolbar -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <button 
              @click="openAddProduct" 
              class="bg-brand-red hover:bg-brand-red-dark text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md"
            >
              <Plus class="w-4 h-4" />
              <span>Tambah Produk</span>
            </button>

            <!-- Excel/CSV Import Trigger -->
            <label class="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md">
              <Upload class="w-4 h-4" />
              <span>Impor Excel / CSV</span>
              <input type="file" accept=".csv, .xlsx, .xls" class="hidden" @change="handleFileImport" />
            </label>
          </div>

          <span class="text-xs text-gray-500 font-semibold">
            Menampilkan {{ filteredAdminProducts.length }} dari {{ catalogStore.products.length }} Produk
          </span>
        </div>

        <!-- Search & Filter Controls -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-soft">
          <div class="relative">
            <Search class="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input 
              v-model="searchProductQuery" 
              type="text" 
              placeholder="Cari nama, brand, atau barcode..." 
              class="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none" 
            />
          </div>

          <div>
            <select v-model="selectedCategoryFilter" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none">
              <option value="">Semua Kategori</option>
              <option v-for="cat in catalogStore.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>

          <div>
            <select v-model="selectedStatusFilter" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none">
              <option value="">Semua Status Stok</option>
              <option value="available">Tersedia (Ready)</option>
              <option value="out_of_stock">Stok Habis</option>
            </select>
          </div>
        </div>

        <!-- Products Table -->
        <div class="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-soft">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th class="p-3.5">Produk</th>
                  <th class="p-3.5">Brand</th>
                  <th class="p-3.5">Harga</th>
                  <th class="p-3.5">Status</th>
                  <th class="p-3.5 text-right min-w-[160px]">Aksi Management</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr v-if="filteredAdminProducts.length === 0">
                  <td colspan="5" class="p-8 text-center text-gray-400 font-semibold">
                    Tidak ada produk yang cocok dengan pencarian atau filter.
                  </td>
                </tr>
                <tr v-for="p in filteredAdminProducts" :key="p.id" class="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                  <td class="p-3.5 flex items-center gap-2.5">
                    <img :src="proxyImageUrl(p.image_url || '')" :alt="p.name" class="w-10 h-10 object-cover rounded-xl shrink-0" @error="($event.target as HTMLImageElement).src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=150'" />
                    <div>
                      <div class="font-bold text-gray-900 dark:text-white line-clamp-1">{{ p.name }}</div>
                      <div class="text-[10px] text-gray-400 font-mono">{{ p.barcode || p.id.slice(0, 8) }}</div>
                    </div>
                  </td>
                  <td class="p-3.5 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">{{ p.brand || '-' }}</td>
                  <td class="p-3.5 whitespace-nowrap">
                    <div class="font-bold text-brand-red">{{ formatRupiah(p.promo_price || p.price) }}</div>
                    <div v-if="p.promo_price" class="text-[10px] text-gray-400 line-through">{{ formatRupiah(p.price) }}</div>
                  </td>
                  <td class="p-3.5 whitespace-nowrap">
                    <span :class="p.is_available ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900' : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900'" class="px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 w-fit">
                      <span class="w-1.5 h-1.5 rounded-full" :class="p.is_available ? 'bg-emerald-500' : 'bg-red-500'"></span>
                      <span>{{ p.is_available ? 'Tersedia' : 'Habis' }}</span>
                    </span>
                  </td>
                  <td class="p-3.5 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-1.5">
                      <!-- Action 1: Edit Detail Produk -->
                      <button 
                        @click="openEditProduct(p)" 
                        title="Edit Detail Produk"
                        class="px-2 py-1 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 dark:border-blue-900 text-[10px] font-extrabold flex items-center gap-1"
                      >
                        <Edit3 class="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <!-- Action 2: Duplikat Produk -->
                      <button 
                        @click="handleDuplicateProduct(p)" 
                        title="Duplikat / Salin Produk"
                        class="px-2 py-1 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200 dark:border-purple-900 text-[10px] font-extrabold flex items-center gap-1"
                      >
                        <Copy class="w-3.5 h-3.5" />
                        <span>+ Duplikat</span>
                      </button>

                      <!-- Action 3: Quick Toggle Status Stok -->
                      <button 
                        @click="handleToggleAvailability(p)" 
                        :title="p.is_available ? 'Tandai Stok Habis' : 'Tandai Stok Tersedia'"
                        class="px-2 py-1 rounded-lg transition-colors border text-[10px] font-extrabold flex items-center gap-1"
                        :class="p.is_available ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900' : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900'"
                      >
                        <Power class="w-3.5 h-3.5" />
                        <span>{{ p.is_available ? 'Ready' : 'Habis' }}</span>
                      </button>

                      <!-- Action 4: Pratinjau Detail -->
                      <button 
                        @click="openPreviewProduct(p)" 
                        title="Pratinjau Produk"
                        class="px-2 py-1 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200 dark:border-gray-600 text-[10px] font-extrabold flex items-center gap-1"
                      >
                        <Eye class="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>

                      <!-- Action 5: Hapus Produk -->
                      <button 
                        @click="confirmDeleteProduct(p)" 
                        title="Hapus Produk"
                        class="px-2 py-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 rounded-lg transition-colors border border-red-200 dark:border-red-900 text-[10px] font-extrabold flex items-center gap-1"
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
        </div>
      </div>

      <!-- Tab 3: Fulfillment Channels -->
      <div v-else-if="activeTab === 'channels'" class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-bold text-base text-gray-900 dark:text-white">Channel Pemenuhan Terhubung</h3>
            <p class="text-xs text-gray-500">Kelola channel penjualan, URL dasar redirect, dan integrasi mitra</p>
          </div>
          <button @click="openAddChannel" class="bg-brand-red hover:bg-brand-red-dark text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md">
            <Plus class="w-4 h-4" />
            <span>Tambah Channel</span>
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div v-for="ch in channels" :key="ch.id" class="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between shadow-soft">
            <div class="flex items-center gap-3">
              <img :src="ch.icon_url || ch.logo || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=150'" :alt="ch.name" class="w-12 h-12 object-cover rounded-xl shrink-0" />
              <div>
                <h4 class="font-bold text-sm text-gray-900 dark:text-white">{{ ch.name }}</h4>
                <p class="text-xs text-gray-500 line-clamp-1">{{ ch.description }}</p>
                <p v-if="ch.base_url" class="text-[10px] text-emerald-600 font-mono mt-0.5">{{ ch.base_url }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Aktif</span>
              <button @click="openEditChannel(ch)" class="p-1.5 text-brand-blue hover:bg-blue-50 rounded-lg">
                <Edit3 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 3.5: Paket Belanja Hemat Management Panel -->
      <div v-else-if="activeTab === 'packages'">
        <PackageManagementPanel />
      </div>

      <!-- Tab 4: Toko Saya Sync Engine -->
      <div v-else-if="activeTab === 'sync'">
        <TokoSayaSyncPanel />
      </div>

      <!-- Tab 4: Store Profile Settings -->
      <div v-else-if="activeTab === 'settings'" class="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 space-y-4 max-w-xl shadow-soft">
        <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
          <h3 class="font-bold text-base text-gray-900 dark:text-white">Profil Toko & Kontak WhatsApp</h3>
          <span class="text-[11px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full">Tersimpan ke Supabase</span>
        </div>

        <form @submit.prevent="handleSaveProfile" class="space-y-3.5">
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nama Toko</label>
            <input v-model="adminStore.storeProfile.name" type="text" required class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none" />
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nama Pemilik Toko</label>
            <input v-model="adminStore.storeProfile.owner" type="text" placeholder="Contoh: Budi Santoso" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none" />
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nomor WhatsApp Penerima Pesanan (Format: 628...)</label>
            <input v-model="adminStore.storeProfile.phone" type="text" required placeholder="6281234567890" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-mono font-bold focus:ring-2 focus:ring-brand-red outline-none" />
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Alamat Lengkap Toko</label>
            <textarea v-model="adminStore.storeProfile.address" rows="2" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none"></textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Jam Operasional Toko</label>
              <input v-model="adminStore.storeProfile.business_hours" type="text" placeholder="07:00 - 21:00 WIB" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none" />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Informasi Pengiriman</label>
              <input v-model="adminStore.storeProfile.delivery_info" type="text" placeholder="Gratis ongkir radius 3 km" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none" />
            </div>
          </div>

          <div class="pt-3">
            <button 
              type="submit" 
              class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-2xl shadow-md text-xs transition-all flex items-center justify-center gap-2"
            >
              <Save class="w-4 h-4" />
              <span>Simpan Profil Toko Ke Supabase</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Product Modal -->
    <AdminProductModal 
      :isOpen="isProductModalOpen" 
      :product="editingProduct" 
      @close="isProductModalOpen = false" 
      @saved="catalogStore.fetchCatalogData(); showToast('Produk berhasil disimpan!');"
    />

    <!-- Channel Modal -->
    <Modal :isOpen="isChannelModalOpen" @close="isChannelModalOpen = false">
      <div class="space-y-4">
        <h3 class="font-bold text-base text-gray-900 dark:text-white">
          {{ editingChannel.id ? 'Edit Channel Pemenuhan' : 'Tambah Channel Baru' }}
        </h3>
        <form @submit.prevent="handleSaveChannel" class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nama Channel</label>
            <input v-model="editingChannel.name" type="text" required placeholder="Alfamind Official (Toko Saya)" class="w-full px-3.5 py-2 rounded-xl border text-xs font-semibold" />
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">URL Dasar Redirect (Base URL)</label>
            <input v-model="editingChannel.base_url" type="text" placeholder="https://tokosaya.alfamind.id/product/" class="w-full px-3.5 py-2 rounded-xl border text-xs font-mono font-semibold" />
            <p class="text-[10px] text-gray-400 mt-0.5">Biarkan kosong jika produk channel ini berupa pesanan WhatsApp grosir.</p>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Deskripsi Singkat</label>
            <input v-model="editingChannel.description" type="text" placeholder="Toko Resmi Alfamind - Beli Langsung di App" class="w-full px-3.5 py-2 rounded-xl border text-xs font-semibold" />
          </div>
          <div class="pt-2 flex gap-2">
            <button type="button" @click="isChannelModalOpen = false" class="flex-1 py-2 rounded-xl text-xs font-bold border">Batal</button>
            <button type="submit" class="flex-1 py-2 rounded-xl text-xs font-extrabold bg-brand-red text-white">Simpan Channel</button>
          </div>
        </form>
      </div>
    </Modal>

    <!-- Confirm Delete Product Modal -->
    <Modal :isOpen="isConfirmDeleteOpen" @close="isConfirmDeleteOpen = false">
      <div v-if="productToDelete" class="space-y-4 text-center p-2">
        <div class="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
          <AlertTriangle class="w-6 h-6" />
        </div>
        <div>
          <h3 class="font-extrabold text-base text-gray-900 dark:text-white">Hapus Produk Katalog?</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Anda yakin ingin menghapus <strong>"{{ productToDelete.name }}"</strong>? Tindakan ini akan menghapus produk dari daftar katalog.
          </p>
        </div>
        <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700 text-left">
          <img :src="proxyImageUrl(productToDelete.image_url || '')" class="w-12 h-12 object-cover rounded-xl shrink-0" />
          <div>
            <div class="font-bold text-xs text-gray-900 dark:text-white line-clamp-1">{{ productToDelete.name }}</div>
            <div class="text-[11px] font-bold text-brand-red mt-0.5">{{ formatRupiah(productToDelete.promo_price || productToDelete.price) }}</div>
          </div>
        </div>
        <div class="flex gap-2 pt-2">
          <button @click="isConfirmDeleteOpen = false" class="flex-1 py-2.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
            Batal
          </button>
          <button @click="executeDeleteProduct" class="flex-1 py-2.5 rounded-xl text-xs font-extrabold bg-red-600 text-white hover:bg-red-700 shadow-md">
            Ya, Hapus Sekarang
          </button>
        </div>
      </div>
    </Modal>

    <!-- Product Preview Modal -->
    <Modal :isOpen="isPreviewProductOpen" @close="isPreviewProductOpen = false">
      <div v-if="productToPreview" class="space-y-4">
        <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
          <h3 class="font-bold text-base text-gray-900 dark:text-white">Detail Pratinjau Produk</h3>
        </div>

        <div class="flex flex-col sm:flex-row gap-4">
          <img :src="proxyImageUrl(productToPreview.image_url || '')" :alt="productToPreview.name" class="w-full sm:w-36 h-36 object-cover rounded-2xl border border-gray-100 dark:border-gray-700 shrink-0" />
          <div class="space-y-2 flex-1">
            <h4 class="font-extrabold text-base text-gray-900 dark:text-white">{{ productToPreview.name }}</h4>
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {{ productToPreview.brand || 'Tanpa Brand' }}
              </span>
              <span :class="productToPreview.is_available ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'" class="text-xs font-bold px-2.5 py-0.5 rounded-md">
                {{ productToPreview.is_available ? 'Tersedia' : 'Stok Habis' }}
              </span>
            </div>
            <div class="font-extrabold text-lg text-brand-red">
              {{ formatRupiah(productToPreview.promo_price || productToPreview.price) }}
              <span v-if="productToPreview.promo_price" class="text-xs font-normal text-gray-400 line-through ml-2">{{ formatRupiah(productToPreview.price) }}</span>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-300 line-clamp-3">{{ productToPreview.description || 'Tidak ada deskripsi' }}</p>
          </div>
        </div>

        <div class="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
          <button @click="openEditProduct(productToPreview); isPreviewProductOpen = false;" class="bg-brand-red hover:bg-brand-red-dark text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm">
            <Edit3 class="w-4 h-4" />
            <span>Edit Produk Ini</span>
          </button>
          <button @click="isPreviewProductOpen = false" class="py-2 px-4 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700">
            Tutup
          </button>
        </div>
      </div>
    </Modal>

    <!-- Floating Toast Notification -->
    <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="transform translate-y-4 opacity-0" enter-to-class="transform translate-y-0 opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="transform translate-y-0 opacity-100" leave-to-class="transform translate-y-4 opacity-0">
      <div v-if="toastMessage" class="fixed bottom-6 right-6 z-50 bg-gray-900 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-gray-700">
        <CheckCircle class="w-4 h-4 text-emerald-400 shrink-0" />
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Lock, LogOut, BarChart2, Package, Store, Settings, Plus, Upload, Edit3, Save, RefreshCw, ScanLine, BrainCircuit, Copy, Trash2, Power, Search, Eye, CheckCircle, AlertTriangle, Megaphone, PackageCheck } from 'lucide-vue-next';
import Modal from '../features/shared/components/Modal.vue';
import type { Product, FulfillmentChannel } from '../features/shared/types';
import { formatRupiah } from '../features/shared/utils/formatters';
import { dataService } from '../features/shared/db/dataService';
import { updatePageSeo } from '../features/shared/utils/seo';
import AnalyticsDashboard from '../features/admin/components/AnalyticsDashboard.vue';
import AdminProductModal from '../features/admin/components/AdminProductModal.vue';
import TokoSayaSyncPanel from '../features/admin/components/TokoSayaSyncPanel.vue';
import ProductImportPanel from '../features/product-import/components/ProductImportPanel.vue';
import KnowledgeDashboard from '../features/product-knowledge/components/KnowledgeDashboard.vue';
import FlyerCampaignUploader from '../features/promotions/components/FlyerCampaignUploader.vue';
import CampaignReviewPanel from '../features/promotions/components/CampaignReviewPanel.vue';
import EnterprisePromotionDashboard from '../features/promotions/components/EnterprisePromotionDashboard.vue';
import PackageManagementPanel from '../features/admin/components/PackageManagementPanel.vue';
import { PromotionCampaignEngine } from '../features/promotions/engine/PromotionCampaignEngine';
import type { CampaignParsedData } from '../features/promotions/types/campaignTypes';
import { parseProductFile } from '../features/admin/services/csvImportService';
import { useAdminStore } from '../features/admin/stores/adminStore';
import { useCatalogStore } from '../features/catalog/stores/catalogStore';
import { proxyImageUrl } from '../features/tokosaya-sync/services/ImageProxyService';

const adminStore = useAdminStore();
const catalogStore = useCatalogStore();

const activeTab = ref('analytics');
const channels = ref<FulfillmentChannel[]>([]);
const isProductModalOpen = ref(false);
const editingProduct = ref<Product | null>(null);

const isChannelModalOpen = ref(false);
const editingChannel = ref<Partial<FulfillmentChannel>>({ name: '', base_url: '', description: '', is_active: true });

// Product Table Search, Filter & Actions state
const searchProductQuery = ref('');
const selectedCategoryFilter = ref('');
const selectedStatusFilter = ref('');
const isConfirmDeleteOpen = ref(false);
const productToDelete = ref<Product | null>(null);
const isPreviewProductOpen = ref(false);
const productToPreview = ref<Product | null>(null);
const toastMessage = ref('');

// Campaign Engine state
const activeCampaignData = ref<CampaignParsedData | null>(null);
const activeFlyerUrl = ref('');
const flyerKey = ref(0); // Increment on every new flyer to force CampaignReviewPanel remount

const showToast = (msg: string) => {
  toastMessage.value = msg;
  setTimeout(() => {
    toastMessage.value = '';
  }, 3500);
};

const handleFlyerSelected = async (payload: { imageUrl: string; title: string; presetId?: string }) => {
  // Reset & force full re-mount of review panel
  activeCampaignData.value = null;
  activeFlyerUrl.value = payload.imageUrl;
  flyerKey.value++; // Always increment so :key forces component remount
  
  // Run Promotion Campaign Engine Pipeline
  const result = await PromotionCampaignEngine.processFlyerCampaign(
    payload.imageUrl,
    payload.title,
    payload.presetId,
    catalogStore.products
  );

  activeCampaignData.value = result.parsedData;
  showToast(`Berhasil meng-ekstrak Kampanye "${result.parsedData.title}" & ${result.parsedData.extracted_products.length} produk promo otomatis!`);
};

const handleCampaignPublished = async () => {
  await catalogStore.fetchCatalogData();
  showToast('Kampanye promo & landing page berhasil dipublikasikan!');
};

const tabs = [
  { id: 'analytics', name: 'Analisis & Stat', icon: BarChart2 },
  { id: 'campaign-engine', name: 'Kampanye & Flyer AI', icon: Megaphone },
  { id: 'import-engine', name: 'Product Import Engine (Scanner)', icon: ScanLine },
  { id: 'knowledge-engine', name: 'Product Knowledge AI', icon: BrainCircuit },
  { id: 'packages', name: 'Paket Belanja Hemat', icon: PackageCheck },
  { id: 'products', name: 'Kelola Produk', icon: Package },
  { id: 'channels', name: 'Channel Pemenuhan', icon: Store },
  { id: 'sync', name: 'Sync Toko Saya', icon: RefreshCw },
  { id: 'settings', name: 'Profil Toko', icon: Settings }
];

onMounted(async () => {
  updatePageSeo('Admin Panel', 'Panel Pengelolaan Toko Sembako.');
  await catalogStore.fetchCatalogData();
  await adminStore.loadProfile();
  channels.value = await dataService.fetchFulfillmentChannels();
});

const filteredAdminProducts = computed(() => {
  let list = catalogStore.products;

  if (searchProductQuery.value.trim()) {
    const q = searchProductQuery.value.toLowerCase().trim();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      p.id.toLowerCase().includes(q)
    );
  }

  if (selectedCategoryFilter.value) {
    list = list.filter(p => p.category_id === selectedCategoryFilter.value || p.category === selectedCategoryFilter.value);
  }

  if (selectedStatusFilter.value === 'available') {
    list = list.filter(p => p.is_available);
  } else if (selectedStatusFilter.value === 'out_of_stock') {
    list = list.filter(p => !p.is_available);
  }

  return list;
});

const openAddChannel = () => {
  editingChannel.value = { name: '', slug: `ch-${Date.now()}`, base_url: '', description: '', is_active: true };
  isChannelModalOpen.value = true;
};

const openEditChannel = (ch: FulfillmentChannel) => {
  editingChannel.value = { ...ch };
  isChannelModalOpen.value = true;
};

const handleSaveChannel = async () => {
  await dataService.saveFulfillmentChannel(editingChannel.value);
  channels.value = await dataService.fetchFulfillmentChannels();
  await catalogStore.fetchCatalogData();
  isChannelModalOpen.value = false;
  showToast('Channel pemenuhan berhasil disimpan!');
};

const handleSaveProfile = async () => {
  await adminStore.updateProfile(adminStore.storeProfile);
  showToast('Profil toko & nomor kontak WhatsApp berhasil disimpan!');
};

const handleLogin = async () => {
  await adminStore.loginWithSupabase(adminStore.email, adminStore.password);
};

const openAddProduct = () => {
  editingProduct.value = null;
  isProductModalOpen.value = true;
};

const openEditProduct = (p: Product) => {
  editingProduct.value = p;
  isProductModalOpen.value = true;
};

const handleDuplicateProduct = (p: Product) => {
  editingProduct.value = {
    ...p,
    id: undefined,
    name: `${p.name} (Salin)`,
    external_product_code: p.external_product_code ? `${p.external_product_code}-COPY` : undefined
  } as any;
  isProductModalOpen.value = true;
  showToast(`Membuka modal duplikasi untuk "${p.name}"`);
};

const handleToggleAvailability = async (p: Product) => {
  await dataService.toggleProductAvailability(p);
  await catalogStore.fetchCatalogData();
  showToast(`Status "${p.name}" diubah ke ${!p.is_available ? 'Tersedia' : 'Stok Habis'}`);
};

const confirmDeleteProduct = (p: Product) => {
  productToDelete.value = p;
  isConfirmDeleteOpen.value = true;
};

const executeDeleteProduct = async () => {
  if (productToDelete.value) {
    const name = productToDelete.value.name;
    await dataService.deleteProduct(productToDelete.value.id);
    await catalogStore.fetchCatalogData();
    showToast(`Produk "${name}" telah dihapus!`);
    isConfirmDeleteOpen.value = false;
    productToDelete.value = null;
  }
};

const openPreviewProduct = (p: Product) => {
  productToPreview.value = p;
  isPreviewProductOpen.value = true;
};

const handleFileImport = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    try {
      const parsed = await parseProductFile(target.files[0]);
      await adminStore.bulkImportProducts(parsed);
      await catalogStore.fetchCatalogData();
      showToast(`Berhasil mengimpor ${parsed.length} produk ke dalam katalog!`);
    } catch (err) {
      alert('Gagal membaca file Excel/CSV. Pastikan format kolom sesuai.');
    }
  }
};
</script>
