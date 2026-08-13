<template>
  <Modal :isOpen="isSecretModalOpen" title="🔐 Mode Rahasia Pengelola Admin" maxWidthClass="max-w-md" @close="closeSecretModal">
    <div class="space-y-4 text-xs">
      
      <!-- Top Header Card -->
      <div class="flex items-center gap-3 bg-slate-900 text-white p-3.5 rounded-2xl shadow-md border border-slate-800">
        <div class="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
          <ShieldCheck class="w-6 h-6" />
        </div>
        <div class="min-w-0">
          <div class="font-extrabold text-sm text-white">Akses Admin Terbuka</div>
          <div class="text-[10px] text-slate-400">Pintu rahasia manajemen produk & toko BelanjaKlik</div>
        </div>
      </div>

      <!-- State 1: Already Authenticated -->
      <div v-if="adminStore.isAuthenticated" class="space-y-3 bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">Status Sesi: Aktif</span>
          <span class="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-extrabold">ONLINE</span>
        </div>
        <div class="font-mono text-xs text-gray-700 dark:text-gray-300 truncate">
          👤 {{ adminStore.user?.email || 'admin@belanjaklik.my.id' }}
        </div>

        <button
          @click="navigateToAdmin"
          class="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <span>🚀 Buka Dashboard Admin Full</span>
          <ArrowRight class="w-4 h-4" />
        </button>

        <button
          @click="adminStore.logout()"
          class="w-full py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
        >
          <LogOut class="w-3.5 h-3.5" />
          <span>Keluar Sesi Admin</span>
        </button>
      </div>

      <!-- State 2: Not Authenticated (Form Login / Quick Button) -->
      <div v-else class="space-y-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
        <div class="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
          Silakan login dengan kredensial pengelola atau klik tombol di bawah untuk membuka halaman login admin.
        </div>

        <!-- Quick Login Form -->
        <form @submit.prevent="handleQuickLogin" class="space-y-2.5 pt-1">
          <div v-if="adminStore.errorMessage" class="p-2 rounded-xl bg-red-50 text-red-600 text-[11px] font-bold border border-red-200">
            {{ adminStore.errorMessage }}
          </div>

          <div>
            <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Email / Username</label>
            <input
              v-model="inputEmail"
              type="email"
              placeholder="pengelola@tokoberkah.com"
              required
              class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none"
            />
          </div>

          <div>
            <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Kata Sandi</label>
            <input
              v-model="inputPassword"
              type="password"
              placeholder="Masukkan Kata Sandi"
              required
              class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold focus:ring-2 focus:ring-brand-red outline-none"
            />
          </div>

          <button
            type="submit"
            :disabled="adminStore.isLoading"
            class="w-full py-2.5 rounded-xl bg-brand-red hover:bg-brand-red-dark text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
          >
            <KeyRound class="w-3.5 h-3.5" />
            <span>{{ adminStore.isLoading ? 'Memproses...' : 'Masuk & Buka Admin' }}</span>
          </button>
        </form>

        <div class="relative flex py-1 items-center">
          <div class="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          <span class="flex-shrink mx-2 text-[10px] text-gray-400 font-bold uppercase">atau</span>
          <div class="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
        </div>

        <!-- Direct Navigate Button to /admin -->
        <button
          @click="navigateToAdmin"
          class="w-full py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
        >
          <ExternalLink class="w-3.5 h-3.5 text-blue-500" />
          <span>Buka Halaman Admin (/admin)</span>
        </button>
      </div>

      <p class="text-[10px] text-gray-400 leading-relaxed text-center">
        💡 Menu admin ini tersembunyi untuk pengguna umum dan hanya terbuka lewat ketukan rahasia logo 5x.
      </p>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ShieldCheck, ArrowRight, LogOut, KeyRound, ExternalLink } from 'lucide-vue-next';
import Modal from '@/features/shared/components/Modal.vue';
import { useAdminStore } from '../stores/adminStore';
import { useSecretAdminAccess } from '../composables/useSecretAdminAccess';

const router = useRouter();
const adminStore = useAdminStore();
const { isSecretModalOpen, closeSecretModal } = useSecretAdminAccess();

const inputEmail = ref('');
const inputPassword = ref('');

const navigateToAdmin = () => {
  closeSecretModal();
  router.push('/admin');
};

const handleQuickLogin = async () => {
  if (!inputEmail.value || !inputPassword.value) return;
  const ok = await adminStore.login(inputEmail.value, inputPassword.value);
  if (ok) {
    inputEmail.value = '';
    inputPassword.value = '';
    navigateToAdmin();
  }
};
</script>
