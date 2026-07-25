<template>
  <div class="max-w-4xl mx-auto space-y-6 pb-24 font-sans text-gray-800 dark:text-gray-200">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft space-y-2">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-xs font-extrabold uppercase tracking-wider">
        <AlertCircle class="w-4 h-4" />
        <span>Keterbukaan Afiliasi Resmi</span>
      </div>
      <h1 class="font-black text-2xl sm:text-3xl text-gray-900 dark:text-white leading-tight">Pernyataan Keterbukaan Afiliasi (Affiliate Disclosure)</h1>
      <p class="text-xs text-gray-500 font-semibold">Komitmen Transparansi Layanan BelanjAKlik & Kemitraan Afiliasi</p>
    </div>

    <!-- Content Sections -->
    <div class="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft space-y-6 text-xs sm:text-sm leading-relaxed">
      
      <!-- Highlight Alert Banner -->
      <div class="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-2 text-amber-900 dark:text-amber-200">
        <div class="font-bold text-sm flex items-center gap-2">
          <ShieldCheck class="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Prinsip Utama: Bebas Biaya Tambahan Bagi Pengguna</span>
        </div>
        <p class="text-xs leading-relaxed">
          Menggunakan aplikasi BelanjAKlik 100% GRATIS. Mengeklik tautan rekomendasi produk pada aplikasi ini <strong>TIDAK PERNAH MENAMBAH BIAYA BELANJA ANDA</strong>. Harga produk yang Anda bayar di merchant resmi adalah persis sama dengan harga standar.
        </p>
      </div>

      <section class="space-y-2">
        <h2 class="font-extrabold text-base text-gray-900 dark:text-white">1. Hubungan Afiliasi dengan Platform E-Commerce & Jaringan Mitra</h2>
        <p>
          BelanjAKlik berpartisipasi aktif dalam jaringan pemasaran afiliasi terpercaya, termasuk namun tidak terbatas pada:
        </p>
        <ul class="list-disc pl-5 space-y-1.5 text-gray-600 dark:text-gray-300">
          <li><strong>Accesstrade Indonesia:</strong> Jaringan penyedia program afiliasi terkemuka di Indonesia untuk campaign e-commerce, ritel, dan produk digital.</li>
          <li><strong>Toko Saya Alfamind:</strong> Platform toko virtual ritel resmi jaringan Alfamart Group.</li>
          <li><strong>Shopee & Tokopedia Affiliate Program:</strong> Program afiliasi marketplace e-commerce resmi.</li>
        </ul>
      </section>

      <section class="space-y-2">
        <h2 class="font-extrabold text-base text-gray-900 dark:text-white">2. Bagaimana Komisi Afiliasi Bekerja?</h2>
        <p>
          Ketika Anda mengeklik tombol <em>"Beli Langsung"</em> atau <em>"Lihat Promo Merchant"</em> pada produk di BelanjAKlik, tautan tersebut berisi kode rujukan khusus (*tracking link*). Jika Anda menyelesaikan pembelian di situs merchant, pihak merchant atau jaringan afiliasi seperti <strong>Accesstrade Indonesia</strong> dapat memberikan komisi rujukan kecil kepada kami.
        </p>
        <p>
          Komisi ini membantu kami mendanai operasional server, pengembangan fitur AI OCR scanner, pemeliharaan basis data katalog promo JSM, serta menjaga aplikasi ini tetap gratis bagi seluruh masyarakat Indonesia.
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="font-extrabold text-base text-gray-900 dark:text-white">3. Independensi & Keakuratan Rekomendasi Produk</h2>
        <p>
          Meskipun kami menerima komisi dari kemitraan afiliasi, ulasan harga, pemeringkatan produk terlaris, dan pembandingan diskon promo JSM dilakukan secara objektif berdasarkan data harga resmi. Kami selalu memprioritaskan kenyamanan dan penghematan belanja pengguna di atas segalanya.
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="font-extrabold text-base text-gray-900 dark:text-white">4. Kontak Pertanyaan Afiliasi</h2>
        <p>
          Jika Anda adalah pemilik merek, pengelola program afiliasi, atau perwakilan jaringan media seperti Accesstrade Indonesia yang ingin mendiskusikan peluang kemitraan, silakan hubungi tim kami di:
        </p>
        <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-600 space-y-1 font-mono text-xs">
          <div><strong>Email Kemitraan:</strong> susiono.ahmad@gmail.com</div>
          <div><strong>Kontak WA / HP:</strong> 081392156513</div>
          <div><strong>Website Media:</strong> BelanjAKlik Personal Shopping Assistant</div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { AlertCircle, ShieldCheck } from 'lucide-vue-next';
import { updatePageSeo } from '../features/shared/utils/seo';

onMounted(() => {
  updatePageSeo('Keterbukaan Afiliasi', 'Pernyataan Keterbukaan Afiliasi & Kemitraan Accesstrade Indonesia - BelanjAKlik');
});
</script>
