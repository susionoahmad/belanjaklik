<template>
  <footer class="bg-gray-900 text-gray-300 pt-12 pb-24 sm:pb-12 border-t border-gray-800 mt-16 font-sans">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      
      <!-- Top Section: Brand Info & Navigation Columns -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        <!-- Column 1: Brand & Tagline -->
        <div class="space-y-3 md:col-span-1">
          <div @click="triggerSecretTap" class="flex items-center gap-2 cursor-pointer select-none" title="Ketuk 5x untuk Akses Mode Admin">
            <div class="w-9 h-9 rounded-2xl bg-brand-red flex items-center justify-center text-white font-black text-lg shadow-md">
              B
            </div>
            <div>
              <span class="font-black text-lg tracking-tight text-white">Belanj<span class="text-brand-red">AKlik</span></span>
              <span class="block text-[10px] text-gray-400 font-extrabold tracking-wider uppercase">Shopping Assistant</span>
            </div>
          </div>
          <p class="text-xs text-gray-400 leading-relaxed">
            Platform Personal Shopping Assistant & Agregator Promo Ritel terdepan di Indonesia. Temukan harga terbaik, promo JSM, dan paket hemat dalam sekali klik.
          </p>
          <div class="flex items-center gap-2 pt-1 text-xs text-emerald-400 font-bold">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Status Layanan: 100% Aktif & Resmi</span>
          </div>
        </div>

        <!-- Column 2: Jelajah Layanan -->
        <div class="space-y-3">
          <h4 class="font-extrabold text-sm text-white uppercase tracking-wider">Jelajah Katalog</h4>
          <ul class="space-y-2 text-xs font-semibold">
            <li>
              <router-link to="/catalog" class="hover:text-brand-red transition-colors flex items-center gap-1.5">
                <ChevronRight class="w-3.5 h-3.5 text-gray-500" />
                <span>Katalog Produk Sembako</span>
              </router-link>
            </li>
            <li>
              <router-link to="/promos" class="hover:text-brand-red transition-colors flex items-center gap-1.5">
                <ChevronRight class="w-3.5 h-3.5 text-brand-yellow" />
                <span>Promo JSM & Flash Sale</span>
              </router-link>
            </li>
            <li>
              <router-link to="/packages" class="hover:text-brand-red transition-colors flex items-center gap-1.5">
                <ChevronRight class="w-3.5 h-3.5 text-gray-500" />
                <span>Paket Belanja Hemat Kos</span>
              </router-link>
            </li>
            <li>
              <router-link to="/favorites" class="hover:text-brand-red transition-colors flex items-center gap-1.5">
                <ChevronRight class="w-3.5 h-3.5 text-gray-500" />
                <span>Daftar Favorit Saya</span>
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Column 3: Mitra & Afiliasi -->
        <div class="space-y-3">
          <h4 class="font-extrabold text-sm text-white uppercase tracking-wider">Mitra & Afiliasi</h4>
          <ul class="space-y-2 text-xs font-semibold">
            <li>
              <router-link to="/affiliate-disclosure" class="hover:text-brand-red transition-colors flex items-center gap-1.5">
                <ShieldCheck class="w-3.5 h-3.5 text-emerald-400" />
                <span>Keterbukaan Afiliasi</span>
              </router-link>
            </li>
            <li>
              <a href="https://accesstrade.co.id" target="_blank" rel="noopener noreferrer" class="hover:text-brand-red transition-colors flex items-center gap-1.5">
                <ExternalLink class="w-3.5 h-3.5 text-blue-400" />
                <span>Mitra Accesstrade Indonesia</span>
              </a>
            </li>
            <li>
              <button @click="triggerSecretTap" class="hover:text-brand-red transition-colors flex items-center gap-1.5 text-left cursor-pointer">
                <Settings class="w-3.5 h-3.5 text-purple-400" />
                <span>Portal Sync Admin Toko Saya</span>
              </button>
            </li>
          </ul>
        </div>

        <!-- Column 4: Legalitas & Kontak -->
        <div class="space-y-3">
          <h4 class="font-extrabold text-sm text-white uppercase tracking-wider">Informasi & Legalitas</h4>
          <ul class="space-y-2 text-xs font-semibold">
            <li>
              <router-link to="/privacy" class="hover:text-brand-red transition-colors flex items-center gap-1.5">
                <FileText class="w-3.5 h-3.5 text-gray-500" />
                <span>Kebijakan Privasi (Privacy Policy)</span>
              </router-link>
            </li>
            <li>
              <router-link to="/terms" class="hover:text-brand-red transition-colors flex items-center gap-1.5">
                <FileText class="w-3.5 h-3.5 text-gray-500" />
                <span>Syarat & Ketentuan Layanan</span>
              </router-link>
            </li>
            <li>
              <router-link to="/about" class="hover:text-brand-red transition-colors flex items-center gap-1.5">
                <HelpCircle class="w-3.5 h-3.5 text-gray-500" />
                <span>Tentang Kami & Bantuan Kontak</span>
              </router-link>
            </li>
          </ul>
        </div>

      </div>

      <!-- Affiliate Transparency Disclaimer Banner (Mandatory for Accesstrade Approval) -->
      <div class="p-4 bg-gray-800/80 rounded-2xl border border-gray-700/80 space-y-1.5 text-xs text-gray-300">
        <div class="flex items-center gap-2 font-extrabold text-amber-400 uppercase text-[11px] tracking-wider">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>Sanggahan Afiliasi Resmi & Transparansi Pengguna (Affiliate Disclosure)</span>
        </div>
        <p class="text-[11px] leading-relaxed text-gray-400 font-medium">
          BelanjAKlik beroperasi sebagai agregator informasi produk ritel & asisten belanja independen. Aplikasi ini berpartisipasi dalam program afiliasi resmi (termasuk jaringan <strong>Accesstrade Indonesia</strong> dan mitra e-commerce terpercaya). Ketika Anda mengeklik tautan rekomendasi produk dan melakukan transaksi di toko mitra, kami dapat memperoleh komisi kecil tanpa mengenakan biaya tambahan sama sekali kepada Anda.
        </p>
      </div>

      <!-- Bottom Copyright Bar -->
      <div @click="triggerSecretTap" class="pt-6 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 cursor-pointer select-none">
        <div>
          &copy; 2026 <strong>BelanjAKlik</strong>. Hak Cipta Dilindungi Undang-Undang.
        </div>
        <div class="flex items-center gap-4 text-gray-400 font-semibold">
          <router-link to="/privacy" class="hover:underline">Privasi</router-link>
          <span>•</span>
          <router-link to="/terms" class="hover:underline">Ketentuan</router-link>
          <span>•</span>
          <router-link to="/affiliate-disclosure" class="hover:underline">Afiliasi</router-link>
          <span>•</span>
          <router-link to="/about" class="hover:underline">Kontak</router-link>
        </div>
      </div>

    </div>
  </footer>
</template>

<script setup lang="ts">
import { ChevronRight, ShieldCheck, ExternalLink, Settings, FileText, HelpCircle, AlertCircle } from 'lucide-vue-next';
import { useSecretAdminAccess } from '@/features/admin/composables/useSecretAdminAccess';

const { triggerSecretTap } = useSecretAdminAccess();
</script>
