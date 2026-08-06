<template>
  <div class="space-y-6">
    <!-- Top Toolbar Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-red/10 text-brand-red text-xs font-black uppercase tracking-wider mb-1">
          <PackageCheck class="w-3.5 h-3.5" />
          <span>Kelola Bundel & Template Belanja</span>
        </div>
        <h2 class="font-extrabold text-lg sm:text-xl text-gray-900 dark:text-white">Manajemen Paket Belanja Hemat</h2>
        <p class="text-xs text-gray-500 mt-0.5">Buat, edit, dan atur isi paket bundel hemat siap sekali tekan masuk keranjang</p>
      </div>

      <div class="flex items-center gap-2">
        <router-link
          to="/packages"
          target="_blank"
          class="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 font-extrabold text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 border border-gray-200 dark:border-gray-600 transition-all shrink-0"
        >
          <ExternalLink class="w-4 h-4" />
          <span>Lihat Landing Page Publik</span>
        </router-link>

        <button 
          @click="openCreateModal" 
          class="bg-brand-red hover:bg-brand-red-dark text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 shrink-0"
        >
          <Plus class="w-4 h-4" />
          <span>Buat Paket Baru</span>
        </button>
      </div>
    </div>

    <!-- Package List Grid -->
    <div v-if="shoppingStore.templates.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div 
        v-for="tpl in shoppingStore.templates" 
        :key="tpl.id"
        class="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-soft hover:shadow-hover transition-all duration-300 flex flex-col justify-between space-y-4 group relative overflow-hidden"
      >
        <!-- Package Header -->
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <span class="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-extrabold text-[10px] border border-amber-200 dark:border-amber-900 uppercase tracking-wider flex items-center gap-1">
              <Sparkles class="w-3 h-3 text-amber-500" />
              <span>{{ tpl.category || 'Hemat' }}</span>
            </span>

            <span class="text-[10px] font-bold text-gray-400 font-mono">
              {{ tpl.items.length }} Jenis Barang
            </span>
          </div>

          <h3 class="font-extrabold text-base text-gray-900 dark:text-white group-hover:text-brand-red transition-colors leading-tight">
            {{ tpl.name }}
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed font-semibold">
            {{ tpl.description }}
          </p>
        </div>

        <!-- Items Breakdown List -->
        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-3.5 space-y-2 border border-gray-100 dark:border-gray-700">
          <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Rincian Isi Paket:</span>
            <span class="text-brand-red font-mono font-black text-xs">{{ formatRupiah(calculateTotal(tpl)) }}</span>
          </div>

          <ul class="space-y-1.5 text-xs text-gray-700 dark:text-gray-200 font-semibold">
            <li v-for="(item, idx) in tpl.items" :key="idx" class="flex items-center justify-between border-b border-gray-100 dark:border-gray-600/50 pb-1 last:border-0 last:pb-0">
              <div class="flex items-center gap-1.5 min-w-0 pr-2">
                <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span class="truncate text-[11px]">{{ item.product_name }}</span>
              </div>
              <span class="font-mono text-[11px] text-gray-500 shrink-0">{{ item.quantity }} {{ item.unit || 'pcs' }}</span>
            </li>
          </ul>
        </div>

        <!-- Management Actions Toolbar -->
        <div class="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
          <button 
            @click="shoppingStore.loadTemplateToCart(tpl)"
            class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-extrabold text-[11px] px-3 py-2 rounded-xl flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 transition-colors"
            title="Coba simulasi sekali tekan masuk keranjang"
          >
            <ShoppingCart class="w-3.5 h-3.5" />
            <span>Test Cart</span>
          </button>

          <div class="flex items-center gap-1.5">
            <button 
              @click="openEditModal(tpl)"
              class="bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-extrabold text-[11px] px-2.5 py-2 rounded-xl flex items-center gap-1 border border-blue-200 dark:border-blue-800 transition-colors"
              title="Edit Paket"
            >
              <Edit3 class="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            <button 
              @click="duplicatePackage(tpl)"
              class="bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-extrabold text-[11px] px-2.5 py-2 rounded-xl flex items-center gap-1 border border-purple-200 dark:border-purple-800 transition-colors"
              title="Duplikat Paket"
            >
              <Copy class="w-3.5 h-3.5" />
            </button>

            <button 
              @click="confirmDelete(tpl)"
              class="bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-extrabold text-[11px] px-2.5 py-2 rounded-xl flex items-center gap-1 border border-red-200 dark:border-red-800 transition-colors"
              title="Hapus Paket"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="bg-white dark:bg-gray-800 p-12 rounded-3xl text-center border border-gray-100 dark:border-gray-700 text-gray-400 font-semibold text-xs space-y-3">
      <PackageCheck class="w-10 h-10 mx-auto text-gray-300" />
      <p>Belum ada Paket Belanja Hemat terdaftar.</p>
      <button @click="openCreateModal" class="bg-brand-red text-white font-extrabold px-4 py-2 rounded-xl">
        + Buat Paket Sekarang
      </button>
    </div>

    <!-- Create / Edit Package Modal Form -->
    <div v-if="editingPackage" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4" @click.self="editingPackage = null">
      <div class="bg-white dark:bg-gray-800 rounded-3xl p-5 sm:p-6 max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
        <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
          <h3 class="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <PackageCheck class="w-5 h-5 text-brand-red" />
            <span>{{ editingPackage.id ? 'Edit Paket Belanja Hemat' : 'Buat Paket Belanja Hemat Baru' }}</span>
          </h3>
          <button @click="editingPackage = null" class="text-gray-400 hover:text-gray-600 font-extrabold text-xl line-none">&times;</button>
        </div>

        <form @submit.prevent="savePackage" class="space-y-4">
          <!-- Package Meta Details -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nama Paket Bundel</label>
              <input 
                v-model="editingPackage.name" 
                type="text" 
                placeholder="Contoh: Paket Anak Kos Hemat" 
                required 
                class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Kategori Paket</label>
              <select v-model="editingPackage.category" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none">
                <option value="Hemat">Hemat</option>
                <option value="Keluarga">Keluarga</option>
                <option value="Rumah">Rumah</option>
                <option value="Kos">Kos</option>
                <option value="Kesehatan">Kesehatan</option>
                <option value="Spesial">Spesial</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Deskripsi Singkat Paket</label>
            <textarea 
              v-model="editingPackage.description" 
              rows="2" 
              placeholder="Contoh: Kebutuhan masak & saus bumbu lengkap untuk 1 minggu..." 
              class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none"
            ></textarea>
          </div>

          <!-- Section: Interactive Catalog Product Picker -->
          <div class="p-4 bg-gradient-to-br from-red-50/50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-2xl border border-red-100 dark:border-gray-700 space-y-3 shadow-inner">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span class="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  <PackagePlus class="w-4 h-4 text-brand-red" />
                  <span>Tambah Produk dari Katalog</span>
                </span>
                <p class="text-[11px] text-gray-500">Cari produk di katalog dan klik <b>+ Tambah</b> untuk menambahkannya ke paket ini</p>
              </div>

              <!-- Filter Kategori in Picker -->
              <select v-model="pickerCategoryFilter" class="px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold outline-none shrink-0">
                <option value="">Semua Kategori Katalog</option>
                <option v-for="cat in catalogStore.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>

            <!-- Search Bar in Picker -->
            <div class="relative">
              <Search class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                v-model="pickerSearchQuery" 
                type="text" 
                placeholder="Cari nama produk, brand, atau barcode..." 
                class="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none"
              />
              <button v-if="pickerSearchQuery" type="button" @click="pickerSearchQuery = ''" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-xs">
                &times;
              </button>
            </div>

            <!-- Catalog Products Scrollable Picker Cards -->
            <div class="max-h-48 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div 
                v-for="prod in filteredCatalogProducts.slice(0, 12)" 
                :key="prod.id"
                class="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-2xs hover:border-brand-red/40 transition-colors"
              >
                <div class="flex items-center gap-2 min-w-0 flex-1 pr-2">
                  <img 
                    :src="proxyImageUrl(prod.image_url || '')" 
                    :alt="prod.name" 
                    class="w-9 h-9 object-cover rounded-lg shrink-0 border border-gray-100 dark:border-gray-700" 
                    @error="($event.target as HTMLImageElement).src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=150'" 
                  />
                  <div class="min-w-0 flex-1">
                    <div class="text-xs font-bold text-gray-900 dark:text-white truncate" :title="prod.name">{{ prod.name }}</div>
                    <div class="text-[10px] text-gray-400 flex items-center gap-1">
                      <span>{{ formatRupiah(prod.promo_price || prod.price) }}</span>
                      <span v-if="prod.brand" class="truncate">• {{ prod.brand }}</span>
                    </div>
                  </div>
                </div>

                <!-- Add / Adjustment Buttons -->
                <div class="shrink-0">
                  <div v-if="getQuantityInPackage(prod) > 0" class="flex items-center gap-1 bg-brand-red/10 border border-brand-red/30 px-1.5 py-0.5 rounded-lg">
                    <button 
                      type="button" 
                      @click="decrementCatalogProductInPackage(prod)" 
                      class="text-brand-red hover:bg-brand-red/20 rounded p-0.5"
                    >
                      <Minus class="w-3 h-3" />
                    </button>
                    <span class="text-xs font-mono font-black text-brand-red px-1">{{ getQuantityInPackage(prod) }}</span>
                    <button 
                      type="button" 
                      @click="addCatalogProductToPackage(prod)" 
                      class="text-brand-red hover:bg-brand-red/20 rounded p-0.5"
                    >
                      <Plus class="w-3 h-3" />
                    </button>
                  </div>
                  <button 
                    v-else
                    type="button" 
                    @click="addCatalogProductToPackage(prod)"
                    class="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 active:scale-95 shadow-2xs"
                  >
                    <Plus class="w-3 h-3" />
                    <span>Tambah</span>
                  </button>
                </div>
              </div>

              <div v-if="filteredCatalogProducts.length === 0" class="col-span-full py-4 text-center text-xs text-gray-400">
                Tidak ada produk catalog yang sesuai dengan pencarian "{{ pickerSearchQuery }}"
              </div>
            </div>
          </div>

          <!-- Package Items Manager List -->
          <div class="space-y-3 pt-2">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                <ShoppingCart class="w-4 h-4 text-brand-red" />
                <span>Rincian Barang Isi Paket ({{ editingPackage.items.length }})</span>
              </label>

              <button 
                type="button" 
                @click="addItemRow" 
                class="text-xs font-bold text-brand-red hover:underline flex items-center gap-1"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>Tambah Baris Manual</span>
              </button>
            </div>

            <!-- Items Table Rows -->
            <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
              <div 
                v-for="(item, idx) in editingPackage.items" 
                :key="idx"
                class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs group"
              >
                <!-- Thumbnail if matched -->
                <div class="shrink-0">
                  <img 
                    :src="proxyImageUrl(getItemImage(item) || '')" 
                    alt="product" 
                    class="w-8 h-8 object-cover rounded-lg border border-gray-200 dark:border-gray-700" 
                    @error="($event.target as HTMLImageElement).src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'"
                  />
                </div>

                <!-- Product Selection / Name Input -->
                <div class="flex-1 min-w-0 flex items-center gap-1">
                  <select 
                    v-if="!item.is_custom"
                    v-model="item.product_id" 
                    @change="onSelectProductInRow(item)"
                    class="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-red truncate"
                  >
                    <option value="">-- Pilih Produk Katalog --</option>
                    <option v-for="p in catalogStore.products" :key="p.id" :value="p.id">
                      {{ p.name }} ({{ formatRupiah(p.promo_price || p.price) }})
                    </option>
                    <option value="__custom__">✏️ Ketik Produk Manual / Custom...</option>
                  </select>

                  <input 
                    v-else
                    v-model="item.product_name" 
                    type="text" 
                    placeholder="Ketik nama produk custom..." 
                    required 
                    class="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-red"
                  />

                  <button 
                    type="button" 
                    @click="toggleCustomNameMode(item)"
                    class="text-[10px] font-extrabold text-gray-400 hover:text-brand-red px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 shrink-0 transition-colors"
                    :title="item.is_custom ? 'Pilih dari Katalog' : 'Ketik Manual Custom'"
                  >
                    {{ item.is_custom ? 'Katalog' : 'Custom' }}
                  </button>
                </div>
                
                <!-- Qty buttons -->
                <div class="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5 shrink-0 bg-gray-50 dark:bg-gray-700/50">
                  <button 
                    type="button" 
                    @click="item.quantity = Math.max(1, (item.quantity || 1) - 1)" 
                    class="px-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 font-bold"
                  >-</button>
                  <input 
                    v-model.number="item.quantity" 
                    type="number" 
                    min="1" 
                    placeholder="Qty" 
                    required 
                    class="w-10 text-xs font-bold font-mono text-center outline-none bg-transparent"
                  />
                  <button 
                    type="button" 
                    @click="item.quantity = (item.quantity || 1) + 1" 
                    class="px-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 font-bold"
                  >+</button>
                </div>

                <input 
                  v-model="item.unit" 
                  type="text" 
                  placeholder="Unit (pcs)" 
                  class="w-16 sm:w-20 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold outline-none"
                />

                <input 
                  v-model.number="item.default_price" 
                  type="number" 
                  placeholder="Harga" 
                  required 
                  class="w-20 sm:w-24 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold font-mono text-right outline-none"
                />

                <button 
                  type="button" 
                  @click="removeItemRow(idx)" 
                  class="text-gray-400 hover:text-red-500 p-1 font-bold shrink-0 transition-colors"
                  title="Hapus Baris"
                >
                  &times;
                </button>
              </div>

              <div v-if="editingPackage.items.length === 0" class="p-6 text-center text-xs text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                Belum ada produk di paket ini. Gunakan pencarian catalog di atas untuk menambah produk.
              </div>
            </div>

            <!-- Estimasi Total Paket -->
            <div class="flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 p-3 rounded-2xl border border-amber-200 dark:border-amber-900 text-xs">
              <span class="font-bold text-amber-800 dark:text-amber-300">Estimasi Total Harga Bundel:</span>
              <span class="font-black font-mono text-sm text-brand-red">{{ formatRupiah(calculateTotal(editingPackage)) }}</span>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button 
              type="button" 
              @click="editingPackage = null" 
              class="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300"
            >
              Batal
            </button>
            <button 
              type="submit" 
              class="px-5 py-2.5 rounded-xl bg-brand-red hover:bg-brand-red-dark text-white text-xs font-extrabold shadow-md transition-all active:scale-95"
            >
              Simpan Paket Belanja
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { PackageCheck, Plus, Minus, Sparkles, ShoppingCart, Edit3, Copy, Trash2, CheckCircle2, ExternalLink, Search, PackagePlus } from 'lucide-vue-next';
import { useShoppingStore } from '../../shopping/stores/shoppingStore';
import { useCatalogStore } from '../../catalog/stores/catalogStore';
import { formatRupiah } from '../../shared/utils/formatters';
import { proxyImageUrl } from '../../tokosaya-sync/services/ImageProxyService';

const shoppingStore = useShoppingStore();
const catalogStore = useCatalogStore();

const editingPackage = ref<any>(null);
const pickerSearchQuery = ref('');
const pickerCategoryFilter = ref('');

onMounted(async () => {
  await shoppingStore.fetchShoppingData();
  await catalogStore.fetchCatalogData();
});

const calculateTotal = (pkg: any) => {
  if (!pkg || !pkg.items) return 0;
  return pkg.items.reduce((sum: number, item: any) => sum + ((item.default_price || 0) * (item.quantity || 1)), 0);
};

const filteredCatalogProducts = computed(() => {
  let list = catalogStore.products || [];

  if (pickerCategoryFilter.value) {
    list = list.filter(p => p.category_id === pickerCategoryFilter.value);
  }

  if (pickerSearchQuery.value.trim()) {
    const q = pickerSearchQuery.value.toLowerCase().trim();
    list = list.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.brand && p.brand.toLowerCase().includes(q)) || 
      (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  }

  return list;
});

const getQuantityInPackage = (prod: any) => {
  if (!editingPackage.value || !editingPackage.value.items) return 0;
  const item = editingPackage.value.items.find((i: any) => 
    (i.product_id && i.product_id === prod.id) ||
    i.product_name.toLowerCase().trim() === prod.name.toLowerCase().trim()
  );
  return item ? (item.quantity || 1) : 0;
};

const addCatalogProductToPackage = (prod: any) => {
  if (!editingPackage.value) return;
  if (!editingPackage.value.items) editingPackage.value.items = [];

  const existing = editingPackage.value.items.find((i: any) => 
    (i.product_id && i.product_id === prod.id) ||
    i.product_name.toLowerCase().trim() === prod.name.toLowerCase().trim()
  );

  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
    existing.product_id = prod.id;
    existing.default_price = prod.promo_price || prod.price;
    existing.unit = prod.unit || 'pcs';
    existing.is_custom = false;
  } else {
    editingPackage.value.items.push({
      product_id: prod.id,
      product_name: prod.name,
      quantity: 1,
      default_price: prod.promo_price || prod.price,
      unit: prod.unit || 'pcs',
      is_custom: false
    });
  }
};

const decrementCatalogProductInPackage = (prod: any) => {
  if (!editingPackage.value || !editingPackage.value.items) return;
  const idx = editingPackage.value.items.findIndex((i: any) => 
    (i.product_id && i.product_id === prod.id) ||
    i.product_name.toLowerCase().trim() === prod.name.toLowerCase().trim()
  );

  if (idx >= 0) {
    const item = editingPackage.value.items[idx];
    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      editingPackage.value.items.splice(idx, 1);
    }
  }
};

const getItemImage = (item: any) => {
  if (!item) return '';
  const matched = catalogStore.products.find(p => 
    (item.product_id && p.id === item.product_id) || 
    p.name.toLowerCase().trim() === item.product_name.toLowerCase().trim()
  );
  return matched?.image_url || '';
};

const onSelectProductInRow = (item: any) => {
  if (item.product_id === '__custom__') {
    item.is_custom = true;
    item.product_id = '';
    return;
  }
  const matched = catalogStore.products.find(p => p.id === item.product_id);
  if (matched) {
    item.is_custom = false;
    item.product_name = matched.name;
    item.default_price = matched.promo_price || matched.price;
    item.unit = matched.unit || 'pcs';
  }
};

const toggleCustomNameMode = (item: any) => {
  item.is_custom = !item.is_custom;
  if (item.is_custom) {
    item.product_id = '';
  } else if (catalogStore.products.length > 0) {
    const matched = catalogStore.products.find(p => p.name.toLowerCase().trim() === item.product_name.toLowerCase().trim());
    item.product_id = matched ? matched.id : catalogStore.products[0].id;
    onSelectProductInRow(item);
  }
};

const openCreateModal = () => {
  pickerSearchQuery.value = '';
  editingPackage.value = {
    name: '',
    category: 'Hemat',
    description: '',
    icon: 'package',
    is_active: true,
    items: []
  };
};

const openEditModal = (tpl: any) => {
  pickerSearchQuery.value = '';
  const pkg = JSON.parse(JSON.stringify(tpl));
  if (pkg.items) {
    pkg.items.forEach((item: any) => {
      const matched = catalogStore.products.find(p => 
        (item.product_id && p.id === item.product_id) || 
        p.name.toLowerCase().trim() === item.product_name.toLowerCase().trim()
      );
      if (matched) {
        item.product_id = matched.id;
        item.is_custom = false;
      } else {
        item.is_custom = true;
      }
    });
  }
  editingPackage.value = pkg;
};

const duplicatePackage = (tpl: any) => {
  const dup = JSON.parse(JSON.stringify(tpl));
  delete dup.id;
  dup.name = `${dup.name} (Salinan)`;
  if (dup.items) {
    dup.items.forEach((item: any) => {
      const matched = catalogStore.products.find(p => 
        (item.product_id && p.id === item.product_id) || 
        p.name.toLowerCase().trim() === item.product_name.toLowerCase().trim()
      );
      if (matched) {
        item.product_id = matched.id;
        item.is_custom = false;
      } else {
        item.is_custom = true;
      }
    });
  }
  editingPackage.value = dup;
};

const addItemRow = () => {
  if (!editingPackage.value) return;
  if (!editingPackage.value.items) editingPackage.value.items = [];
  editingPackage.value.items.push({
    product_id: '',
    product_name: '',
    quantity: 1,
    default_price: 10000,
    unit: 'pcs',
    is_custom: true
  });
};

const removeItemRow = (index: number) => {
  if (!editingPackage.value || !editingPackage.value.items) return;
  editingPackage.value.items.splice(index, 1);
};

const savePackage = async () => {
  if (!editingPackage.value) return;
  await shoppingStore.saveTemplate(editingPackage.value);
  editingPackage.value = null;
  alert('✅ Paket Belanja Hemat berhasil disimpan!');
};

const confirmDelete = async (tpl: any) => {
  if (confirm(`Apakah Anda yakin ingin menghapus paket "${tpl.name}"?`)) {
    await shoppingStore.deleteTemplate(tpl.id);
  }
};
</script>
