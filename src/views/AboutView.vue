<template>
  <div class="max-w-4xl mx-auto space-y-6 pb-24 font-sans text-gray-800 dark:text-gray-200">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft space-y-2">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
        <HelpCircle class="w-4 h-4" />
        <span>Profil & Bantuan</span>
      </div>
      <h1 class="font-black text-2xl sm:text-3xl text-gray-900 dark:text-white leading-tight">Tentang BelanjAKlik & Layanan Kontak</h1>
      <p class="text-xs text-gray-500 font-semibold">Personal Shopping Assistant & Agregator Katalog Promo Ritel Terdepan</p>
    </div>

    <!-- About Content -->
    <div class="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft space-y-6 text-xs sm:text-sm leading-relaxed">
      
      <section class="space-y-3">
        <h2 class="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles class="w-5 h-5 text-brand-red" />
          <span>Visi & Misi BelanjAKlik</span>
        </h2>
        <p>
          <strong>BelanjAKlik</strong> hadir untuk membantu masyarakat Indonesia berbelanja kebutuhan harian (*Fast-Moving Consumer Goods / FMCG*) dan sembako secara lebih cerdas, hemat, dan praktis. Kami mengombinasikan kecerdasan buatan (*AI Vision OCR Scanner*), pembanding harga promo JSM, serta integrasi toko virtual resmi untuk menghadirkan pengalaman belanja yang cepat tanpa ribet.
        </p>
      </section>

      <!-- Key Features Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-1.5">
          <div class="w-8 h-8 rounded-xl bg-red-100 text-brand-red flex items-center justify-center font-bold">🔥</div>
          <div class="font-bold text-xs text-gray-900 dark:text-white">Katalog Promo JSM</div>
          <p class="text-[11px] text-gray-500 dark:text-gray-400">Update harga promo Jumat Sabtu Minggu Alfamart & ritel terupdate.</p>
        </div>

        <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-1.5">
          <div class="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">⚡</div>
          <div class="font-bold text-xs text-gray-900 dark:text-white">AI Vision Scanner</div>
          <p class="text-[11px] text-gray-500 dark:text-gray-400">Ekstraksi harga promo dan produk otomatis dari gambar flyer & screenshot.</p>
        </div>

        <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-1.5">
          <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">🛒</div>
          <div class="font-bold text-xs text-gray-900 dark:text-white">Asisten Belanja WA</div>
          <p class="text-[11px] text-gray-500 dark:text-gray-400">Pemesanan cepat langsung terhubung ke layanan Store Owner WhatsApp.</p>
        </div>
      </div>

      <!-- Contact Us Form Mock & Contact Channel -->
      <section class="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <h2 class="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
          <Mail class="w-5 h-5 text-brand-blue" />
          <span>Hubungi Tim Dukungan Kami</span>
        </h2>
        <p class="text-xs text-gray-500">Ada pertanyaan, kendala penggunaan, atau penawaran kerjasama afiliasi? Kirim pesan kepada kami di bawah ini:</p>

        <form @submit.prevent="handleContactSubmit" class="space-y-3 bg-gray-50 dark:bg-gray-700/40 p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold mb-1">Nama Lengkap</label>
              <input v-model="contactForm.name" type="text" required placeholder="Contoh: Ahmad Susiono" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs focus:ring-2 focus:ring-brand-red outline-none" />
            </div>

            <div>
              <label class="block text-xs font-bold mb-1">Email Anda</label>
              <input v-model="contactForm.email" type="email" required placeholder="name@example.com" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs focus:ring-2 focus:ring-brand-red outline-none" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold mb-1">Subjek Pesan</label>
            <select v-model="contactForm.subject" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs focus:ring-2 focus:ring-brand-red outline-none">
              <option value="Afiliasi & Kerjasama">🤝 Kerjasama Afiliasi (Accesstrade / Publisher)</option>
              <option value="Bantuan Aplikasi">❓ Bantuan Penggunaan Aplikasi</option>
              <option value="Laporan Bug / Kendala">🐛 Laporan Kendala / Bug</option>
              <option value="Lainnya">💬 Pertanyaan Umum</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold mb-1">Pesan / Masukan</label>
            <textarea v-model="contactForm.message" rows="3" required placeholder="Tuliskan pesan atau pertanyaan Anda di sini..." class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs focus:ring-2 focus:ring-brand-red outline-none"></textarea>
          </div>

          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="bg-brand-red hover:bg-brand-red-dark text-white font-extrabold text-xs px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Send class="w-4 h-4" />
            <span>{{ isSubmitting ? 'Mengirim...' : 'Kirim Pesan Dukungan' }}</span>
          </button>

          <p v-if="submittedSuccess" class="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
            ✓ Terima kasih! Pesan Anda telah berhasil dikirim ke tim dukungan BelanjAKlik. Kami akan merespons melalui email dalam 1x24 jam.
          </p>
        </form>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { HelpCircle, Sparkles, Mail, Send } from 'lucide-vue-next';
import { updatePageSeo } from '../features/shared/utils/seo';

const isSubmitting = ref(false);
const submittedSuccess = ref(false);

const contactForm = ref({
  name: '',
  email: '',
  subject: 'Afiliasi & Kerjasama',
  message: ''
});

onMounted(() => {
  updatePageSeo('Tentang Kami', 'Tentang BelanjAKlik & Layanan Dukungan Kontak');
});

function handleContactSubmit() {
  isSubmitting.value = true;
  setTimeout(() => {
    isSubmitting.value = false;
    submittedSuccess.value = true;
    contactForm.value = {
      name: '',
      email: '',
      subject: 'Afiliasi & Kerjasama',
      message: ''
    };
  }, 1000);
}
</script>
