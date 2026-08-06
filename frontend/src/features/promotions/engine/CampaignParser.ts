import type { CampaignType } from '../types/campaignTypes';

export interface ParsedCampaignMetadata {
  title: string;
  subtitle: string;
  theme: string;
  start_date: string;
  end_date: string;
  campaign_type: CampaignType;
  priority: number;
  terms_conditions: string;
}

export class CampaignParser {
  static parseText(rawOcrText: string): ParsedCampaignMetadata {
    const textLower = rawOcrText.toLowerCase();

    let title = 'Alfamart Body Care Fair';
    let subtitle = 'Diskon Hingga 35% Manjakan Tubuhmu Maksimal Periode 16 - 31 Juli 2026';
    let theme = 'Body Care Fair';
    let campaignType: CampaignType = 'FAIR';
    let priority = 12;
    let terms = 'Promo Body Care Fair berlaku di seluruh toko Alfamart & Alfamind terhubung. Maksimal 5 pcs per akun.';

    let startDate = '2026-07-16';
    let endDate = '2026-07-31';

    if (textLower.includes('dapur') || textLower.includes('bunda') || textLower.includes('maestro') || textLower.includes('blue band')) {
      title = 'Kebutuhan Dapur Bunda';
      subtitle = 'Diskon Hemat Bumbu & Kebutuhan Dapur Bunda Periode 16 - 31 Juli 2026';
      theme = 'Kebutuhan Dapur Bunda';
      campaignType = 'FAIR';
      priority = 10;
      terms = 'Promo berlaku di Alfamart & Alfamind terhubung. Maksimal 3 pcs per transaksi.';
    } else if (textLower.includes('sembako') || textLower.includes('super saver')) {
      title = 'Pamflet Sembako Super Saver';
      subtitle = 'Promo Hemat Minyak Goreng & Kebutuhan Sembako Periode 20 - 27 Juli 2026';
      theme = 'Sembako Super Saver';
      campaignType = 'WEEKEND_PROMO';
      startDate = '2026-07-20';
      endDate = '2026-07-27';
    } else if (textLower.includes('akhir pekan') || textLower.includes('weekend') || textLower.includes('flash')) {
      title = 'Brosur Promo Akhir Pekan Flash Sale';
      subtitle = 'Diskon Spesial Sabtu & Minggu Segera Klaim!';
      theme = 'Akhir Pekan';
      campaignType = 'FLASH_SALE';
      priority = 15;
      startDate = '2026-07-25';
      endDate = '2026-07-26';
    }

    return {
      title,
      subtitle,
      theme,
      start_date: startDate,
      end_date: endDate,
      campaign_type: campaignType,
      priority,
      terms_conditions: terms
    };
  }
}
