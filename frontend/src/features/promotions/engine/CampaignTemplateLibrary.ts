import type { CampaignTemplate } from '../types/enterpriseTypes';

export class CampaignTemplateLibrary {
  static templates: CampaignTemplate[] = [
    {
      template_id: 'WEEKLY_PROMO',
      name: 'Katalog Mingguan Sembako',
      description: 'Template brosur promo mingguan produk dapur & kebutuhan rumah tangga',
      campaign_type: 'FAIR',
      default_color_theme: { primary: '#e11d48', secondary: '#f43f5e' },
      default_banner_layout: 'GRID_3_COL',
      preloaded_rules: { min_purchase_amount: 0, member_only: false }
    },
    {
      template_id: 'FLASH_SALE',
      name: 'Kejut Flash Sale 2 Jam',
      description: 'Template promo kilat diskon besar terbatas durasi singkat',
      campaign_type: 'FLASH_SALE',
      default_color_theme: { primary: '#dc2626', secondary: '#b91c1c' },
      default_banner_layout: 'HERO_FULL',
      preloaded_rules: { min_purchase_amount: 35000, max_redemptions: 50, per_customer_limit: 2 }
    },
    {
      template_id: 'WEEKEND_SALE',
      name: 'Promo Akhir Pekan (Jumat-Minggu)',
      description: 'Template promo belanja hemat Jumat, Sabtu & Minggu',
      campaign_type: 'WEEKEND_PROMO',
      default_color_theme: { primary: '#2563eb', secondary: '#3b82f6' },
      default_banner_layout: 'SLIDER_BANNER',
      preloaded_rules: { min_purchase_amount: 50000, member_only: false }
    },
    {
      template_id: 'MONTHLY_PROMO',
      name: 'Gajian Hemat Bulanan',
      description: 'Template diskon besar-besaran awal bulan / gajian',
      campaign_type: 'DISCOUNT',
      default_color_theme: { primary: '#059669', secondary: '#10b981' },
      default_banner_layout: 'GRID_4_COL',
      preloaded_rules: { min_purchase_amount: 100000 }
    },
    {
      template_id: 'MEMBER_DAY',
      name: 'Hari Spesial Member Toko Saya',
      description: 'Eksklusif diskon khusus pelanggan member terdaftar',
      campaign_type: 'SEASONAL',
      default_color_theme: { primary: '#7c3aed', secondary: '#8b5cf6' },
      default_banner_layout: 'EXCLUSIVE_CAROUSEL',
      preloaded_rules: { member_only: true }
    },
    {
      template_id: 'HOLIDAY_CAMPAIGN',
      name: 'Promo Hari Besar & Libur Nasional',
      description: 'Template festival belanja hari raya & libur nasional',
      campaign_type: 'SEASONAL',
      default_color_theme: { primary: '#d97706', secondary: '#f59e0b' },
      default_banner_layout: 'FESTIVAL_HERO',
      preloaded_rules: { min_purchase_amount: 75000 }
    },
    {
      template_id: 'CLEARANCE_SALE',
      name: 'Cuci Gudang Hemat',
      description: 'Diskon maksimal untuk obral stok produk',
      campaign_type: 'CLEARANCE',
      default_color_theme: { primary: '#4b5563', secondary: '#6b7280' },
      default_banner_layout: 'LIST_LAYOUT',
      preloaded_rules: { min_purchase_amount: 0 }
    }
  ];

  static getTemplate(templateId: string): CampaignTemplate | undefined {
    return this.templates.find(t => t.template_id === templateId);
  }
}
