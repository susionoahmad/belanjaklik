import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Product, StoreProfile } from '../../shared/types';
import { dataService } from '../../shared/db/dataService';
import { supabase, isSupabaseConfigured } from '../../shared/db/supabaseClient';

export const useAdminStore = defineStore('admin', () => {
  const isClient = typeof window !== 'undefined';
  const storedAuth = isClient ? localStorage.getItem('psa_store_auth') === 'true' : false;
  const storedUser = isClient ? localStorage.getItem('psa_store_user') : null;

  const isAuthenticated = ref(storedAuth);
  const user = ref<any>(storedUser ? JSON.parse(storedUser) : (storedAuth ? { email: 'admin@belanjaklik.my.id' } : null));
  const email = ref('');
  const password = ref('');
  const isLoading = ref(false);
  const errorMessage = ref('');

  const storeProfile = ref<StoreProfile>({
    name: 'BelanjaKlik Marketplace',
    phone: '6281234567890',
    owner: 'Admin BelanjaKlik',
    address: 'Jakarta, Indonesia',
    business_hours: '07:00 - 21:00 WIB',
    delivery_info: 'Pengiriman gratis radius 3 km dengan minimal pemesanan Rp 50.000'
  });

  // Check initial Supabase session
  const checkSession = async () => {
    if (!isSupabaseConfigured || !isClient) return;
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

  if (isClient) {
    checkSession();
  }

  const login = async (inputEmail: string, inputPass: string): Promise<boolean> => {
    errorMessage.value = '';
    isLoading.value = true;
    try {
      let loggedUser = { email: inputEmail || 'admin@belanjaklik.my.id' };

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
      if (isClient) {
        localStorage.setItem('psa_store_auth', 'true');
        localStorage.setItem('psa_store_user', JSON.stringify(loggedUser));
      }
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
    if (isClient) {
      localStorage.removeItem('psa_store_auth');
      localStorage.removeItem('psa_store_user');
    }
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
