<template>
  <div class="max-w-4xl mx-auto space-y-6 pb-24 font-sans text-gray-800 dark:text-gray-200">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft space-y-2">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 text-xs font-extrabold uppercase tracking-wider">
        <FileText class="w-4 h-4" />
        <span>Syarat & Ketentuan Service</span>
      </div>
      <h1 class="font-black text-2xl sm:text-3xl text-gray-900 dark:text-white leading-tight">Syarat & Ketentuan Layanan (Terms of Service)</h1>
      <p class="text-xs text-gray-500 font-semibold">Terakhir diperbarui: 25 Juli 2026 • Berlaku untuk seluruh pengguna aplikasi BelanjAKlik</p>
    </div>

    <!-- Content Sections -->
    <div class="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft space-y-6 text-xs sm:text-sm leading-relaxed">
      
      <section class="space-y-2">
        <h2 class="font-extrabold text-base text-gray-900 dark:text-white">1. Penerimaan Ketentuan</h2>
        <p>
          Dengan mengakses, mengunduh, atau menggunakan platform <strong>BelanjAKlik</strong>, Anda menyatakan telah membaca, memahami, dan menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak menyetujui bagian mana pun dari ketentuan ini, Anda diimbau untuk tidak menggunakan layanan kami.
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="font-extrabold text-base text-gray-900 dark:text-white">2. Layanan Agregator Promo & Asisten Belanja</h2>
        <p>
          BelanjAKlik beroperasi sebagai agregator informasi produk ritel, pembanding harga promo JSM, serta asisten belanja pribadi. Kami menyajikan informasi harga, diskon, dan ketersediaan stok yang diperoleh dari mitra ritel resmi dan pengolahan data otomatis.
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="font-extrabold text-base text-gray-900 dark:text-white">3. Pengalihan Pembelian & Transaksi</h2>
        <p>
          Seluruh transaksi finansial, pembayaran, dan pengiriman barang dilakukan secara langsung di platform merchant resmi mitra (seperti Toko Saya Alfamind, Shopee, Tokopedia, dll.). BelanjAKlik tidak mengumpulkan dana pembayaran produk secara langsung dan tidak bertanggung jawab atas keterlambatan pengiriman oleh pihak ekspedisi merchant.
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="font-extrabold text-base text-gray-900 dark:text-white">4. Hak Kekayaan Intelektual</h2>
        <p>
          Seluruh logo merek, gambar produk, dan hak cipta nama ritel (seperti Alfamart, Indomaret, Superindo, dll.) adalah milik dari pemegang hak cipta masing-masing. Penggunaan logo dan nama produk pada platform ini bertujuan untuk tujuan informasi rekomendasi produk.
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="font-extrabold text-base text-gray-900 dark:text-white">5. Perubahan Ketentuan</h2>
        <p>
          Kami berhak untuk memperbarui Syarat dan Ketentuan ini sewaktu-waktu tanpa pemberitahuan sebelumnya. Perubahan akan berlaku serta merta setelah diunggah di halaman ini.
        </p>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { FileText } from 'lucide-vue-next';
import { updatePageSeo } from '../features/shared/utils/seo';

onMounted(() => {
  updatePageSeo('Syarat & Ketentuan', 'Syarat & Ketentuan Layanan BelanjAKlik');
});
</script>
