import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Product, StoreProfile } from '../../shared/types';
import { dataService } from '../../shared/db/dataService';
import { getApiBaseUrl } from '../../shared/db/localApi';

export const useAdminStore = defineStore('admin', () => {
  const isClient = typeof window !== 'undefined';
  const storedToken = isClient ? localStorage.getItem('psa_admin_token') : null;
  const storedUser = isClient ? localStorage.getItem('psa_store_user') : null;

  const isAuthenticated = ref(false);
  const user = ref<any>(storedToken && storedUser ? JSON.parse(storedUser) : null);
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

  // Validate the server-side session on every app start.
  const checkSession = async () => {
    if (!isClient || !storedToken) return;
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/admin/me`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      });
      if (!response.ok) throw new Error('Session expired');
      const json = await response.json();
      user.value = json.user;
      isAuthenticated.value = true;
      localStorage.setItem('psa_store_user', JSON.stringify(json.user));
      localStorage.setItem('psa_store_auth', 'true');
    } catch (e) {
      localStorage.removeItem('psa_admin_token');
      localStorage.removeItem('psa_store_auth');
      localStorage.removeItem('psa_store_user');
      user.value = null;
      isAuthenticated.value = false;
    }
  };

  if (isClient) void checkSession();

  const login = async (inputEmail: string, inputPass: string): Promise<boolean> => {
    errorMessage.value = '';
    isLoading.value = true;
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inputEmail, password: inputPass })
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json.token || !json.user) {
        throw new Error(json.error || 'Email atau password salah.');
      }
      isAuthenticated.value = true;
      user.value = json.user;
      if (isClient) {
        localStorage.setItem('psa_admin_token', json.token);
        localStorage.setItem('psa_store_auth', 'true');
        localStorage.setItem('psa_store_user', JSON.stringify(json.user));
      }
      return true;
    } catch (err: any) {
      errorMessage.value = err.message || 'Gagal terhubung ke server autentikasi.';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    const token = isClient ? localStorage.getItem('psa_admin_token') : null;
    if (token) {
      try {
        await fetch(`${getApiBaseUrl()}/api/v1/admin/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) {}
    }
    isAuthenticated.value = false;
    user.value = null;
    if (isClient) {
      localStorage.removeItem('psa_admin_token');
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
