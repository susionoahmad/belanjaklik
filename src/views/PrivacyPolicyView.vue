<template>
  <div class="max-w-4xl mx-auto space-y-6 pb-24 font-sans text-gray-800 dark:text-gray-200">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft space-y-2">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-extrabold uppercase tracking-wider">
        <ShieldCheck class="w-4 h-4" />
        <span>Dokumen Hukum Resmi</span>
      </div>
      <h1 class="font-black text-2xl sm:text-3xl text-gray-900 dark:text-white leading-tight">Kebijakan Privasi (Privacy Policy)</h1>
      <p class="text-xs text-gray-500 font-semibold">Terakhir diperbarui: 25 Juli 2026 • Berlaku untuk seluruh pengguna aplikasi BelanjAKlik</p>
    </div>

    <!-- Content Sections -->
    <div class="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft space-y-6 text-xs sm:text-sm leading-relaxed">
      
      <section class="space-y-2">
        <h2 class="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
          <span>1. Pendahuluan & Komitmen Privasi</span>
        </h2>
        <p>
          Selamat datang di <strong>BelanjAKlik</strong> (selanjutnya disebut "Kami", "Aplikasi", atau "Platform"). Kami menghormati privasi Anda dan berkomitmen penuh untuk melindungi data pribadi pengguna kami. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi Anda saat menggunakan aplikasi web, PWA, dan layanan agregator promo kami.
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="font-extrabold text-base text-gray-900 dark:text-white">2. Informasi Yang Kami Kumpulkan</h2>
        <p>Kami dapat mengumpulkan jenis informasi berikut untuk meningkatkan pengalaman belanja Anda:</p>
        <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300">
          <li><strong>Data Penggunaan Anonim:</strong> Halaman yang dikunjungi, waktu akses, pencarian produk, serta jenis perangkat/browser.</li>
          <li><strong>Data Preferensi Lokal:</strong> Daftar favorit, keranjang belanja, dan preferensi aplikasi yang disimpan secara lokal di perangkat Anda (IndexedDB / LocalStorage).</li>
          <li><strong>Data Afiliasi & Pengalihan Tautan:</strong> Informasi klik tautan belanja saat Anda beralih ke toko mitra e-commerce resmi.</li>
        </ul>
      </section>

      <section class="space-y-2">
        <h2 class="font-extrabold text-base text-gray-900 dark:text-white">3. Penggunaan Cookie & Jaringan Afiliasi (Accesstrade Indonesia)</h2>
        <p>
          Aplikasi kami berpartisipasi dalam program pemasaran afiliasi resmi, termasuk jaringan <strong>Accesstrade Indonesia</strong> dan merchant e-commerce terpercaya. Ketika Anda mengeklik tautan belanja "Beli Langsung" pada produk:
        </p>
        <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300">
          <li>Cookie penelusuran standar dapat dipasang di browser Anda oleh mitra jaringan afiliasi untuk mencatat bahwa rujukan pembelian berasal dari BelanjAKlik.</li>
          <li>Cookie ini tidak mengumpulkan atau menyimpan data pribadi pribadi seperti nama lengkap, kata sandi, atau data kartu kredit.</li>
        </ul>
      </section>

      <section class="space-y-2">
        <h2 class="font-extrabold text-base text-gray-900 dark:text-white">4. Keamanan Data</h2>
        <p>
          Kami mengimplementasikan enkripsi standar HTTPS/TLS serta penyimpanan lokal terenkripsi di browser pengguna. Kami tidak pernah menjual, menyewakan, atau mendistribusikan informasi pribadi pengguna kepada pihak ketiga yang tidak berwenang.
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="font-extrabold text-base text-gray-900 dark:text-white">5. Kontak & Pertanyaan Kebijakan</h2>
        <p>
          Jika Anda memiliki pertanyaan mengenai Kebijakan Privasi ini atau ingin mengajukan masukan terkait privasi data Anda, silakan hubungi tim kami melalui:
        </p>
        <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-600 space-y-1 font-mono text-xs">
          <div><strong>Email Resmi:</strong> support@belanjaklik.id</div>
          <div><strong>Layanan WA:</strong> +62 812-3456-7890</div>
          <div><strong>Platform:</strong> BelanjAKlik Personal Shopping Assistant</div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { ShieldCheck } from 'lucide-vue-next';
import { updatePageSeo } from '../features/shared/utils/seo';

onMounted(() => {
  updatePageSeo('Kebijakan Privasi', 'Kebijakan Privasi dan Perlindungan Data Pengguna BelanjAKlik');
});
</script>
