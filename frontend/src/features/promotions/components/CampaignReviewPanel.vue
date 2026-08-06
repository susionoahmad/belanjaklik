<template>
  <div v-if="parsedData" class="space-y-6">
    <!-- Campaign Header Metadata Review Card -->
    <div class="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-soft space-y-4">
      <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
        <div>
          <span class="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-brand-red/10 text-brand-red uppercase tracking-wider">
            AI Extracted Campaign
          </span>
          <h3 class="font-extrabold text-lg text-gray-900 dark:text-white mt-1">Review Metadata Kampanye Promo</h3>
        </div>

        <button 
          @click="handlePublish" 
          :disabled="isPublishing"
          class="bg-brand-red hover:bg-brand-red-dark text-white font-extrabold px-5 py-2.5 rounded-2xl shadow-md text-xs transition-all flex items-center gap-2"
        >
          <Send class="w-4 h-4" />
          <span>{{ isPublishing ? 'Mempublikasikan Kampanye...' : 'Publikasikan Kampanye Ini' }}</span>
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Judul Kampanye</label>
          <input v-model="parsedData.title" type="text" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-extrabold focus:ring-2 focus:ring-brand-red outline-none" />
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Sub-judul Kampanye</label>
          <input v-model="parsedData.subtitle" type="text" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none" />
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Tanggal Mulai Promo</label>
          <input v-model="parsedData.start_date" type="date" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-bold focus:ring-2 focus:ring-brand-red outline-none" />
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Tanggal Selesai Promo</label>
          <input v-model="parsedData.end_date" type="date" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-bold focus:ring-2 focus:ring-brand-red outline-none" />
        </div>
      </div>
    </div>

    <!-- Auto-Generated Banners Preview Section -->
    <div class="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-soft space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
          <Image class="w-4 h-4 text-purple-600" />
          <span>Auto-Generated Hero & Mobile Banners</span>
        </h4>
        <span class="text-[10px] text-gray-400 font-mono">Tautan Landing Page: /campaign/{{ slugify(parsedData.title) }}</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Desktop Hero Crop -->
        <div class="space-y-1.5">
          <div class="text-[11px] font-bold text-gray-500">Desktop Banner (1200 x 400)</div>
          <img :src="parsedData.cropped_banners.desktop" class="w-full h-24 object-cover rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm" />
        </div>

        <!-- Mobile Crop -->
        <div class="space-y-1.5">
          <div class="text-[11px] font-bold text-gray-500">Mobile Banner (600 x 300)</div>
          <img :src="parsedData.cropped_banners.mobile" class="w-full h-24 object-cover rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm" />
        </div>

        <!-- Thumbnail Crop -->
        <div class="space-y-1.5">
          <div class="text-[11px] font-bold text-gray-500">Thumbnail Crop (300 x 150)</div>
          <img :src="parsedData.cropped_banners.thumbnail" class="w-full h-24 object-cover rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm" />
        </div>
      </div>
    </div>

    <!-- Products & Price Review Table -->
    <div class="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-soft">

      <!-- Header -->
      <div class="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h4 class="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Tag class="w-4 h-4 text-emerald-600" />
            <span>Daftar Produk Kampanye Promo</span>
          </h4>
          <p class="text-xs text-gray-500 mt-0.5">
            Produk yang dipilih akan diupdate harga promo-nya saat kampanye dipublikasikan.
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span v-if="parsedData.extracted_products.length > 0" class="text-xs font-extrabold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-200">
            {{ parsedData.extracted_products.filter(p => p.action !== 'IGNORE').length }} produk aktif
          </span>
          <button
            @click="showAddMore = !showAddMore"
            type="button"
            class="flex items-center gap-1.5 text-xs font-extrabold px-3 py-2 rounded-xl transition-all"
            :class="showAddMore
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              : 'bg-brand-red text-white shadow-md hover:bg-brand-red-dark'"
          >
            <Plus v-if="!showAddMore" class="w-3.5 h-3.5" />
            <X v-else class="w-3.5 h-3.5" />
            <span>{{ showAddMore ? 'Tutup Pencarian' : 'Pilih Produk' }}</span>
          </button>
        </div>
      </div>

      <!-- Search Panel (expandable) -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="showAddMore" class="px-5 py-4 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700 space-y-3">
          <div class="flex items-center gap-3">
            <!-- Search Input -->
            <div class="relative flex-1">
              <Search class="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                v-model="productSearchQuery"
                type="text"
                placeholder="Ketik nama produk yang ada di flyer (cth: Indomie, Minyak Goreng, Sunsilk...)"
                class="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-red outline-none font-semibold"
                autofocus
              />
            </div>
            <span class="text-[10px] text-gray-400 font-mono shrink-0">{{ catalogStore.products.length }} tersedia</span>
          </div>

          <!-- Quick hint chips -->
          <div v-if="!productSearchQuery.trim()" class="flex flex-wrap gap-1.5">
            <button
              v-for="hint in searchHints"
              :key="hint"
              @click="productSearchQuery = hint"
              type="button"
              class="text-[10px] font-bold text-gray-500 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-brand-red border border-gray-200 dark:border-gray-600 hover:border-brand-red/30 rounded-lg px-2.5 py-1 transition-all"
            >
              {{ hint }}
            </button>
          </div>

          <!-- Search results -->
          <div v-if="productSearchQuery.trim().length >= 2" class="space-y-0.5 max-h-56 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
            <div v-if="filteredCatalogProducts.length === 0" class="text-xs text-gray-400 text-center py-8">
              Tidak ada produk cocok dengan "<strong>{{ productSearchQuery }}</strong>"
            </div>
            <button
              v-for="prod in filteredCatalogProducts.slice(0, 12)"
              :key="prod.id"
              @click="addFromCatalog(prod)"
              type="button"
              class="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors text-left group"
            >
              <img
                :src="prod.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=60'"
                class="w-9 h-9 object-cover rounded-lg shrink-0 border border-gray-200"
                @error="($event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=60'"
              />
              <div class="flex-1 min-w-0">
                <div class="font-bold text-xs text-gray-900 dark:text-white group-hover:text-emerald-700 line-clamp-1">{{ prod.name }}</div>
                <div class="text-[10px] text-gray-400">{{ prod.brand }} · Rp {{ prod.price.toLocaleString('id-ID') }}</div>
              </div>
              <span class="shrink-0 text-[10px] font-extrabold text-emerald-700 border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus class="w-3 h-3" /> Tambah
              </span>
            </button>
          </div>

          <p v-if="!productSearchQuery.trim()" class="text-[10px] text-gray-400">
            💡 Produk yang dipilih akan langsung muncul di tabel di bawah. Anda bisa mengatur harga promo-nya sebelum mempublikasikan.
          </p>
        </div>
      </Transition>


      <!-- ═══ EMPTY STATE: Custom upload — show flyer reference + catalog picker side by side ═══ -->
      <div v-if="parsedData.extracted_products.length === 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Left: Flyer image reference -->
        <div class="space-y-2">
          <div class="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
            <Image class="w-3.5 h-3.5" />
            <span>Flyer yang Anda Upload (Referensi)</span>
          </div>
          <div class="relative rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 aspect-[4/3] flex items-center justify-center">
            <img
              v-if="flyerImageUrl"
              :src="flyerImageUrl"
              class="w-full h-full object-contain"
              alt="Flyer yang diupload"
              @error="($event.target as HTMLImageElement).style.display='none'"
            />
            <div v-else class="text-gray-300 text-center p-4">
              <FileImage class="w-10 h-10 mx-auto mb-1" />
              <span class="text-xs">Tidak ada flyer</span>
            </div>
          </div>
          <p class="text-[11px] text-gray-400 leading-relaxed">
            Lihat flyer di samping, lalu cari dan tambahkan produk yang tertera di flyer tersebut ke dalam kampanye ini.
          </p>
        </div>

        <!-- Right: Catalog Product Picker -->
        <div class="space-y-3">
          <div class="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <Search class="w-3.5 h-3.5 text-brand-red" />
            <span>Cari & Tambah Produk dari Katalog</span>
            <span class="text-[10px] text-gray-400 font-mono ml-auto">{{ catalogStore.products.length }} produk</span>
          </div>

          <div class="relative">
            <Search class="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <input
              v-model="productSearchQuery"
              type="text"
              placeholder="Ketik nama produk dari flyer (cth: Indomie, Minyak...)"
              class="w-full pl-8 pr-3 py-2.5 text-xs rounded-xl border-2 border-brand-red/30 focus:border-brand-red bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-red/20 outline-none font-semibold transition-all"
              autofocus
            />
          </div>

          <!-- hint when empty -->
          <div v-if="!productSearchQuery.trim()" class="grid grid-cols-2 gap-1.5">
            <button
              v-for="hint in searchHints"
              :key="hint"
              @click="productSearchQuery = hint"
              type="button"
              class="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-brand-red border border-gray-200 dark:border-gray-700 hover:border-brand-red/30 rounded-xl px-2 py-1.5 transition-all text-left truncate"
            >
              🔍 {{ hint }}
            </button>
          </div>

          <!-- Search results -->
          <div v-if="productSearchQuery.trim().length >= 2" class="space-y-1 max-h-64 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20 p-1">
            <div v-if="filteredCatalogProducts.length === 0" class="text-xs text-gray-400 text-center py-6">
              Tidak ada produk cocok dengan "<strong>{{ productSearchQuery }}</strong>"
            </div>
            <button
              v-for="prod in filteredCatalogProducts.slice(0, 15)"
              :key="prod.id"
              @click="addFromCatalog(prod)"
              type="button"
              class="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all text-left group"
            >
              <img
                :src="prod.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=60'"
                class="w-9 h-9 object-cover rounded-lg shrink-0 border border-gray-200"
                @error="($event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=60'"
              />
              <div class="flex-1 min-w-0">
                <div class="font-bold text-xs text-gray-900 dark:text-white group-hover:text-brand-red line-clamp-1">{{ prod.name }}</div>
                <div class="text-[10px] text-gray-400 font-mono">{{ prod.brand }} • Rp {{ prod.price.toLocaleString('id-ID') }}</div>
              </div>
              <span class="shrink-0 bg-brand-red text-white text-[10px] font-extrabold px-2 py-1 rounded-lg flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus class="w-3 h-3" /> Tambah
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- ═══ NON-EMPTY: Product table ═══ -->
      <div v-if="parsedData.extracted_products.length > 0" class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th class="p-3">Produk Flyer</th>
              <th class="p-3">Produk Katalog</th>
              <th class="p-3">Harga Base</th>
              <th class="p-3">Harga Promo</th>
              <th class="p-3">Diskon</th>
              <th class="p-3 text-right">Keputusan Admin</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr
              v-for="item in parsedData.extracted_products"
              :key="item.id"
              class="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
              :class="item.action === 'IGNORE' ? 'opacity-40' : ''"
            >
              <!-- Product Image + Name -->
              <td class="p-3 flex items-center gap-2.5 min-w-[180px]">
                <div class="relative shrink-0">
                  <img
                    :src="getProductImage(item)"
                    class="w-10 h-10 object-cover rounded-xl border border-gray-200 dark:border-gray-700"
                    :alt="item.raw_name"
                    @error="($event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150'"
                  />
                  <span v-if="item.match_status === 'MATCHED_EXACT'" class="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border border-white">
                    <CheckCircle2 class="w-2.5 h-2.5 text-white" />
                  </span>
                  <span v-else-if="item.action === 'CREATE_NEW'" class="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border border-white">
                    <Plus class="w-2.5 h-2.5 text-white" />
                  </span>
                </div>
                <div class="min-w-0">
                  <div class="font-extrabold text-gray-900 dark:text-white line-clamp-1">{{ item.raw_name }}</div>
                  <div class="text-[10px] text-gray-400 font-mono">{{ item.brand }} • {{ item.size }}</div>
                </div>
              </td>

              <!-- Matched Catalog Product -->
              <td class="p-3 min-w-[180px]">
                <div v-if="item.matched_product" class="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
                  <span class="line-clamp-1 text-xs">{{ item.matched_product.name }}</span>
                </div>
                <div v-else class="text-blue-600 dark:text-blue-400 font-extrabold text-[11px] flex items-center gap-1">
                  <Plus class="w-3.5 h-3.5 shrink-0" />
                  <span>Produk Baru (akan dibuat)</span>
                </div>
              </td>

              <!-- Base Price -->
              <td class="p-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                Rp {{ (item.matched_product ? item.matched_product.price : (item.flyer_original_price || item.flyer_promo_price)).toLocaleString('id-ID') }}
              </td>

              <!-- Editable Promo Price -->
              <td class="p-3 whitespace-nowrap">
                <input
                  v-model.number="item.flyer_promo_price"
                  type="number"
                  class="font-extrabold text-brand-red bg-red-50 dark:bg-red-950/40 px-2 py-1 rounded-lg border border-red-200 dark:border-red-900 w-24 outline-none text-xs"
                  :disabled="item.action === 'IGNORE'"
                />
              </td>

              <!-- Discount % -->
              <td class="p-3 whitespace-nowrap">
                <span class="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-black text-[11px] px-2 py-0.5 rounded-full border border-emerald-200">
                  {{ calculateDiscount(item) }}% OFF
                </span>
              </td>

              <!-- Admin Decision Buttons -->
              <td class="p-3 text-right whitespace-nowrap">
                <div class="flex items-center justify-end gap-1">
                  <!-- UPDATE_PROMO: only for products that have a match -->
                  <button
                    v-if="item.matched_product"
                    @click="item.action = 'UPDATE_PROMO'"
                    type="button"
                    class="px-2 py-1 rounded-xl text-[10px] font-extrabold transition-all"
                    :class="item.action === 'UPDATE_PROMO' ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300' : 'bg-gray-100 text-gray-600 hover:bg-emerald-100'"
                  >
                    Update Promo
                  </button>

                  <!-- CREATE_NEW: for new / unmatched products -->
                  <button
                    @click="item.action = 'CREATE_NEW'"
                    type="button"
                    class="px-2 py-1 rounded-xl text-[10px] font-extrabold transition-all"
                    :class="item.action === 'CREATE_NEW' ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300' : 'bg-gray-100 text-gray-600 hover:bg-blue-100'"
                  >
                    + Produk Baru
                  </button>

                  <!-- IGNORE -->
                  <button
                    @click="item.action = 'IGNORE'"
                    type="button"
                    class="px-2 py-1 rounded-xl text-[10px] font-bold transition-all"
                    :class="item.action === 'IGNORE' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600'"
                  >
                    Abaikan
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ═══ Add more products (always visible when products exist) ═══ -->
      <div v-if="parsedData.extracted_products.length > 0" class="border-t border-gray-100 dark:border-gray-700 pt-3">
        <button
          @click="showAddMore = !showAddMore"
          type="button"
          class="flex items-center gap-2 text-xs font-bold text-brand-red hover:underline"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>{{ showAddMore ? 'Sembunyikan Pencarian' : 'Tambah Produk Lain dari Katalog' }}</span>
        </button>

        <div v-if="showAddMore" class="mt-3 space-y-2">
          <div class="relative">
            <Search class="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <input
              v-model="productSearchQuery"
              type="text"
              placeholder="Cari produk tambahan dari katalog..."
              class="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-brand-red outline-none font-semibold"
            />
          </div>
          <div v-if="productSearchQuery.trim().length >= 2" class="space-y-1 max-h-48 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-700 p-1">
            <div v-if="filteredCatalogProducts.length === 0" class="text-xs text-gray-400 text-center py-4">
              Tidak ada produk cocok dengan "{{ productSearchQuery }}"
            </div>
            <button
              v-for="prod in filteredCatalogProducts.slice(0, 10)"
              :key="prod.id"
              @click="addFromCatalog(prod)"
              type="button"
              class="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 transition-all text-left group"
            >
              <img :src="prod.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=60'" class="w-8 h-8 object-cover rounded-lg shrink-0 border border-gray-200" @error="($event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=60'" />
              <div class="flex-1 min-w-0">
                <div class="font-bold text-xs text-gray-900 dark:text-white group-hover:text-brand-red line-clamp-1">{{ prod.name }}</div>
                <div class="text-[10px] text-gray-400">{{ prod.brand }} • Rp {{ prod.price.toLocaleString('id-ID') }}</div>
              </div>
              <span class="shrink-0 bg-brand-red text-white text-[10px] font-extrabold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <Plus class="w-3 h-3" /> Tambah
              </span>
            </button>
          </div>
      </div>
    </div>
  </div>
</div>
</template>


<script setup lang="ts">
import { ref, computed } from 'vue';
import { Send, Image, Tag, CheckCircle2, AlertCircle, Plus, ScanLine, Search, FileImage } from 'lucide-vue-next';
import type { CampaignParsedData, ExtractedFlyerProduct, FlyerProductAction } from '../types/campaignTypes';
import { dataService } from '../../shared/db/dataService';
import { PriceUpdateEngine } from '../price-engine/PriceUpdateEngine';
import { PromotionCampaignEngine } from '../engine/PromotionCampaignEngine';
import { useCatalogStore } from '../../catalog/stores/catalogStore';

const props = defineProps<{
  parsedData: CampaignParsedData;
  flyerImageUrl: string;
}>();

const emit = defineEmits(['published']);
const isPublishing = ref(false);
const catalogStore = useCatalogStore();
const productSearchQuery = ref('');
const showAddMore = ref(false);

// Quick-search hint chips shown before user types
const searchHints = [
  'Indomie', 'Beras', 'Minyak Goreng', 'Sabun',
  'Susu', 'Kopi', 'Snack', 'Shampo'
];

// Filter catalog products by search query (exclude already added)
const filteredCatalogProducts = computed(() => {
  const q = productSearchQuery.value.toLowerCase().trim();
  if (q.length < 2) return [];
  const alreadyAddedIds = new Set(
    props.parsedData.extracted_products
      .filter(p => p.matched_product)
      .map(p => p.matched_product!.id)
  );
  return catalogStore.products.filter(p => {
    if (alreadyAddedIds.has(p.id)) return false;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  });
});

// Add a catalog product directly to the campaign with its base price as starting promo price
const addFromCatalog = (prod: any) => {
  // Avoid duplicates
  const alreadyExists = props.parsedData.extracted_products.some(
    p => p.matched_product?.id === prod.id
  );
  if (alreadyExists) return;

  const newItem: ExtractedFlyerProduct = {
    id: `fl_pick_${Date.now()}_${prod.id}`,
    raw_name: prod.name,
    brand: prod.brand || '',
    size: prod.unit || '',
    variant: '',
    flyer_promo_price: prod.promo_price || prod.price,
    flyer_original_price: prod.price,
    discount_badge: prod.promo_price ? `Diskon ${Math.round(((prod.price - prod.promo_price) / prod.price) * 100)}%` : '',
    crop_image_url: prod.image_url || '',
    matched_product: prod,
    match_status: 'MATCHED_EXACT',
    match_confidence: 100
  };
  props.parsedData.extracted_products.push(newItem);
  productSearchQuery.value = ''; // Clear search after adding
  // Default action: if matched product exists → update promo, else create new
  newItem.action = newItem.matched_product ? 'UPDATE_PROMO' : 'CREATE_NEW';
};

const addAndMatchProduct = async (item: ExtractedFlyerProduct) => {
  const basePrice = item.flyer_original_price || Math.round(item.flyer_promo_price * 1.2);
  const newProd = await dataService.saveProduct({
    id: `prod_manual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: item.raw_name,
    slug: item.raw_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    brand: item.brand || 'Generik',
    price: basePrice,
    promo_price: item.flyer_promo_price,
    is_promo: true,
    is_available: true,
    is_featured: true,
    stock_status: 'in_stock',
    image_url: item.crop_image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
    unit: item.size || 'pcs',
    notes: 'Ditambahkan otomatis via AI Flyer Review'
  });

  item.matched_product = newProd;
  item.match_status = 'MATCHED_EXACT';
  item.match_confidence = 100;

  await catalogStore.fetchCatalogData();
};

const matchedCount = computed(() => {
  return props.parsedData.extracted_products.filter(p => !!p.matched_product).length;
});

const slugify = (text: string) => {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

const calculateDiscount = (item: ExtractedFlyerProduct) => {
  const base = item.matched_product ? item.matched_product.price : (item.flyer_original_price || item.flyer_promo_price);
  if (!base || base <= item.flyer_promo_price) return 0;
  return Math.round(((base - item.flyer_promo_price) / base) * 100);
};

// Resolve per-product thumbnail: catalog image > flyer crop image > generic fallback
const getProductImage = (item: ExtractedFlyerProduct): string => {
  if (item.matched_product?.image_url) return item.matched_product.image_url;
  if (item.crop_image_url) return item.crop_image_url;
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150';
};

const handlePublish = async () => {
  const activeItems = props.parsedData.extracted_products.filter(i => (i.action || 'UPDATE_PROMO') !== 'IGNORE');
  if (activeItems.length === 0 && props.parsedData.extracted_products.length > 0) {
    alert('Semua produk diabaikan. Tidak ada yang dipublikasikan.');
    return;
  }
  isPublishing.value = true;
  try {
    const result = await PromotionCampaignEngine.publishCampaign(props.parsedData);
    await catalogStore.fetchCatalogData();

    emit('published', { campaign: result.campaign, publishedProductsCount: result.publishedProductsCount });
    alert(`✅ Kampanye "${props.parsedData.title}" berhasil dipublikasikan!\n\n📦 ${result.createdProductsCount} produk baru ditambahkan ke katalog\n🏷️ ${result.updatedProductsCount} produk lama diupdate harga promo\n🎯 Total: ${result.publishedProductsCount} produk dalam kampanye`);
  } catch (err: any) {
    alert(`Gagal mempublikasikan kampanye: ${err.message}`);
  } finally {
    isPublishing.value = false;
  }
};
</script>

