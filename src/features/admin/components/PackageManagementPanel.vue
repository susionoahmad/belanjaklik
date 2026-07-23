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
          <span>+ Buat Paket Baru</span>
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
    <div v-if="editingPackage" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="editingPackage = null">
      <div class="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
        <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
          <h3 class="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <PackageCheck class="w-5 h-5 text-brand-red" />
            <span>{{ editingPackage.id ? 'Edit Paket Belanja Hemat' : 'Buat Paket Belanja Hemat Baru' }}</span>
          </h3>
          <button @click="editingPackage = null" class="text-gray-400 hover:text-gray-600 font-extrabold text-lg">&times;</button>
        </div>

        <form @submit.prevent="savePackage" class="space-y-4">
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

          <!-- Package Items Manager -->
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
                <span>+ Tambah Barang</span>
              </button>
            </div>

            <!-- Quick Add From Catalog Picker -->
            <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-600 space-y-2">
              <span class="text-[11px] font-bold text-gray-500 block">Pilih Cepat Produk dari Katalog:</span>
              <div class="flex items-center gap-2">
                <select v-model="selectedCatalogProductId" class="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold outline-none">
                  <option value="">-- Pilih Produk Katalog --</option>
                  <option v-for="p in catalogStore.products" :key="p.id" :value="p.id">
                    {{ p.name }} ({{ formatRupiah(p.promo_price || p.price) }})
                  </option>
                </select>
                <button 
                  type="button" 
                  @click="addSelectedCatalogProduct"
                  :disabled="!selectedCatalogProductId"
                  class="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all disabled:opacity-50"
                >
                  + Tambahkan
                </button>
              </div>
            </div>

            <!-- Items Table Rows -->
            <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
              <div 
                v-for="(item, idx) in editingPackage.items" 
                :key="idx"
                class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs"
              >
                <input 
                  v-model="item.product_name" 
                  type="text" 
                  placeholder="Nama Produk" 
                  required 
                  class="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold outline-none"
                />
                
                <input 
                  v-model.number="item.quantity" 
                  type="number" 
                  min="1" 
                  placeholder="Qty" 
                  required 
                  class="w-16 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold font-mono text-center outline-none"
                />

                <input 
                  v-model="item.unit" 
                  type="text" 
                  placeholder="Unit (pcs)" 
                  class="w-20 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold outline-none"
                />

                <input 
                  v-model.number="item.default_price" 
                  type="number" 
                  placeholder="Harga" 
                  required 
                  class="w-24 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold font-mono text-right outline-none"
                />

                <button 
                  type="button" 
                  @click="removeItemRow(idx)" 
                  class="text-red-500 hover:text-red-700 p-1 font-bold"
                  title="Hapus Baris"
                >
                  &times;
                </button>
              </div>
            </div>

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
              class="px-5 py-2.5 rounded-xl bg-brand-red hover:bg-brand-red-dark text-white text-xs font-extrabold shadow-md transition-all"
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
import { ref, onMounted } from 'vue';
import { PackageCheck, Plus, Sparkles, ShoppingCart, Edit3, Copy, Trash2, CheckCircle2, ExternalLink } from 'lucide-vue-next';
import { useShoppingStore } from '../../shopping/stores/shoppingStore';
import { useCatalogStore } from '../../catalog/stores/catalogStore';
import { formatRupiah } from '../../shared/utils/formatters';

const shoppingStore = useShoppingStore();
const catalogStore = useCatalogStore();

const editingPackage = ref<any>(null);
const selectedCatalogProductId = ref('');

onMounted(async () => {
  await shoppingStore.fetchShoppingData();
  await catalogStore.fetchCatalogData();
});

const calculateTotal = (pkg: any) => {
  if (!pkg || !pkg.items) return 0;
  return pkg.items.reduce((sum: number, item: any) => sum + ((item.default_price || 0) * (item.quantity || 1)), 0);
};

const openCreateModal = () => {
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
  editingPackage.value = JSON.parse(JSON.stringify(tpl));
};

const duplicatePackage = (tpl: any) => {
  const dup = JSON.parse(JSON.stringify(tpl));
  delete dup.id;
  dup.name = `${dup.name} (Salinan)`;
  editingPackage.value = dup;
};

const addItemRow = () => {
  if (!editingPackage.value) return;
  editingPackage.value.items.push({
    product_name: '',
    quantity: 1,
    default_price: 10000,
    unit: 'pcs'
  });
};

const addSelectedCatalogProduct = () => {
  if (!selectedCatalogProductId.value || !editingPackage.value) return;
  const prod = catalogStore.products.find(p => p.id === selectedCatalogProductId.value);
  if (prod) {
    editingPackage.value.items.push({
      product_name: prod.name,
      quantity: 1,
      default_price: prod.promo_price || prod.price,
      unit: prod.unit || 'pcs'
    });
  }
  selectedCatalogProductId.value = '';
};

const removeItemRow = (index: number) => {
  if (!editingPackage.value) return;
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
