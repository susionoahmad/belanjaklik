import { defineStore } from 'pinia';
import { ref, onMounted } from 'vue';
import type { Product, StoreProfile } from '../../shared/types';
import { dataService } from '../../shared/db/dataService';
import { supabase, isSupabaseConfigured } from '../../shared/db/supabaseClient';

export const useAdminStore = defineStore('admin', () => {
  const isAuthenticated = ref(false);
  const user = ref<any>(null);
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
      }
    } catch (e) {}

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        user.value = session.user;
        isAuthenticated.value = true;
      } else {
        user.value = null;
        isAuthenticated.value = false;
      }
    });
  };

  checkSession();

  const loginWithSupabase = async (inputEmail: string, inputPass: string): Promise<boolean> => {
    errorMessage.value = '';
    isLoading.value = true;
    try {
      if (!isSupabaseConfigured) {
        // Fallback demo mode passcode
        if (inputPass === 'admin123' || inputPass === '123456') {
          isAuthenticated.value = true;
          user.value = { email: inputEmail || 'admin@demo.local' };
          return true;
        }
        errorMessage.value = 'Kata sandi demo salah. Gunakan: admin123';
        return false;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: inputEmail,
        password: inputPass
      });

      if (error) {
        errorMessage.value = error.message === 'Invalid login credentials' 
          ? 'Email atau password Supabase salah.' 
          : error.message;
        return false;
      }

      if (data.user) {
        user.value = data.user;
        isAuthenticated.value = true;
        return true;
      }
    } catch (err: any) {
      errorMessage.value = err.message || 'Gagal terhubung ke Supabase Auth.';
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
    loginWithSupabase,
    logout,
    bulkImportProducts,
    loadProfile,
    updateProfile
  };
});
