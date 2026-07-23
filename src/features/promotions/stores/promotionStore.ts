import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { PromoFile } from '../../shared/types';
import { dataService } from '../../shared/db/dataService';
import { CampaignLifecycleService } from '../services/CampaignLifecycleService';

export const usePromotionStore = defineStore('promotions', () => {
  const banners = ref<any[]>([
    {
      id: 'b1',
      title: 'Body Care Fair Special 2026',
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
      title: 'Katalog Brosur Promo Mingguan Juli 2026.pdf',
      file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      file_type: 'pdf',
      start_date: '2026-07-20',
      end_date: '2026-07-27',
      status: 'active',
      ocr_status: 'completed'
    }
  ]);

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
    loadCampaignBanners
  };
});
