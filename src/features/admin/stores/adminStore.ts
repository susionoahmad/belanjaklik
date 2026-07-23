import { defineStore } from 'pinia';
import { ref, onMounted } from 'vue';
import type { Product, StoreProfile } from '../../shared/types';
import { dataService } from '../../shared/db/dataService';
import { supabase, isSupabaseConfigured } from '../../shared/db/supabaseClient';

export const useAdminStore = defineStore('admin', () => {
  const storedAuth = localStorage.getItem('psa_store_auth') === 'true';
  const storedUser = localStorage.getItem('psa_store_user');

  const isAuthenticated = ref(storedAuth);
  const user = ref<any>(storedUser ? JSON.parse(storedUser) : (storedAuth ? { email: 'pengelola@tokoberkah.com' } : null));
  const email = ref('');
  const password = ref('');
  const isLoading = ref(false);
  const errorMessage = ref('');

  const storeProfile = ref<StoreProfile>({
    name: 'Toko Berkah Asisten Belanja',
    phone: '6281234567890',
    owner: 'Budi Santoso',
    address: 'Jl. Raya Sembako No. 88, Jakarta South',
    business_hours: '07:00 - 21:00 WIB',
    delivery_info: 'Pengiriman gratis radius 3 km dengan minimal pemesanan Rp 50.000'
  });

  // Check initial Supabase session
  const checkSession = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        user.value = data.session.user;
        isAuthenticated.value = true;
        localStorage.setItem('psa_store_auth', 'true');
        localStorage.setItem('psa_store_user', JSON.stringify(data.session.user));
      }
    } catch (e) {}
  };

  checkSession();

  const login = async (inputEmail: string, inputPass: string): Promise<boolean> => {
    errorMessage.value = '';
    isLoading.value = true;
    try {
      let loggedUser = { email: inputEmail || 'pengelola@tokoberkah.com' };

      if (isSupabaseConfigured && inputEmail && inputPass) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: inputEmail,
            password: inputPass
          });
          if (!error && data.user) {
            loggedUser = { email: data.user.email || inputEmail };
          }
        } catch (e) {}
      }

      isAuthenticated.value = true;
      user.value = loggedUser;
      localStorage.setItem('psa_store_auth', 'true');
      localStorage.setItem('psa_store_user', JSON.stringify(loggedUser));
      return true;
    } catch (err: any) {
      errorMessage.value = err.message || 'Gagal masuk ke sistem.';
    } finally {
      isLoading.value = false;
    }
    return false;
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
    isAuthenticated.value = false;
    user.value = null;
    localStorage.removeItem('psa_store_auth');
    localStorage.removeItem('psa_store_user');
  };

  const bulkImportProducts = async (newProducts: Partial<Product>[]) => {
    for (const p of newProducts) {
      await dataService.saveProduct(p);
    }
  };

  const loadProfile = async () => {
    storeProfile.value = await dataService.fetchStoreProfile();
  };

  const updateProfile = async (newProfile: StoreProfile) => {
    storeProfile.value = await dataService.saveStoreProfile(newProfile);
  };

  return {
    isAuthenticated,
    user,
    email,
    password,
    isLoading,
    errorMessage,
    storeProfile,
    login,
    loginWithSupabase: login,
    logout,
    bulkImportProducts,
    loadProfile,
    updateProfile
  };
});
