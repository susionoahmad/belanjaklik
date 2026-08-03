import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { PromoFile } from '../../shared/types';
import { dataService } from '../../shared/db/dataService';
import { CampaignLifecycleService } from '../services/CampaignLifecycleService';

export const usePromotionStore = defineStore('promotions', () => {
  const todayIso = new Date().toISOString().slice(0, 10);
  const futureIso = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const banners = ref<any[]>([
    {
      id: 'b1',
      title: 'Body Care Fair Special',
      slug: 'body-care-fair',
      image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200',
      subtitle: 'Hemat hingga 35% untuk produk perawatan tubuh & mandi',
      target_url: '/campaign/body-care-fair'
    },
    {
      id: 'b2',
      title: 'Diskon Sembako Akhir Pekan',
      slug: 'sembako-super-saver',
      image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200',
      subtitle: 'Hemat hingga 30% untuk beras, minyak & gula',
      target_url: '/promos'
    }
  ]);

  const promoFiles = ref<PromoFile[]>([
    {
      id: 'pf1',
      title: 'Katalog Brosur Promo Spesial Alfamart.pdf',
      file_url: '/katalog-brosur-promo-sembako-alfamart.pdf',
      file_type: 'pdf',
      start_date: todayIso,
      end_date: futureIso,
      status: 'active',
      ocr_status: 'completed'
    }
  ]);

  const activePromoFiles = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return promoFiles.value.filter(file => file.status === 'active' && (!file.end_date || file.end_date >= today));
  });

  const loadCampaignBanners = async () => {
    // Sync active campaign lifecycles
    await CampaignLifecycleService.checkAndSyncCampaignLifecycles();

    const campaigns = await dataService.fetchPromotionCampaigns();
    if (campaigns && campaigns.length > 0) {
      const activeCamps = campaigns.filter((c: any) => c.status === 'ACTIVE');
      if (activeCamps.length > 0) {
        banners.value = activeCamps.map((c: any) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          image_url: c.desktop_banner || c.banner_image,
          subtitle: c.subtitle || c.description,
          target_url: `/campaign/${c.slug}`
        }));
      }
    }
  };

  return {
    banners,
    promoFiles,
    activePromoFiles,
    loadCampaignBanners
  };
});
