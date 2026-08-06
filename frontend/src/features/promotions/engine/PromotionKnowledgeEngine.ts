import type { PromotionCampaign } from '../types/campaignTypes';
import { dataService } from '../../shared/db/dataService';

export interface CampaignKnowledgeChunk {
  campaign_id: string;
  title: string;
  summary: string;
  promo_keywords: string[];
  active_period: string;
  ai_prompt_context: string;
}

export class PromotionKnowledgeEngine {
  static async getActiveCampaignKnowledge(): Promise<CampaignKnowledgeChunk[]> {
    const campaigns = await dataService.fetchPromotionCampaigns();
    const nowIso = new Date().toISOString().slice(0, 10);
    const activeCampaigns = campaigns.filter((c: any) => c.status === 'ACTIVE' && c.end_date >= nowIso);

    const result: CampaignKnowledgeChunk[] = [];

    for (const c of activeCampaigns) {
      const promoProducts = await dataService.fetchPromotionProducts(c.id);
      const productNames = promoProducts.map((p: any) => p.product_name || `Product #${p.product_id}`).join(', ');

      result.push({
        campaign_id: c.id,
        title: c.title,
        summary: `${c.title} (${c.subtitle || c.description}). Periode: ${c.start_date} s/d ${c.end_date}.`,
        promo_keywords: [c.title.toLowerCase(), c.campaign_type.toLowerCase(), 'harga coret', 'diskon promo'],
        active_period: `${c.start_date} s/d ${c.end_date}`,
        ai_prompt_context: `KAMPANYE AKTIF Toko Saya: "${c.title}" - ${c.subtitle}. Berlaku ${c.start_date} s/d ${c.end_date}. Produk promo unggulan meliputi: ${productNames}. Berikan informasi diskon ini jika pengguna bertanya tentang promo.`
      });
    }

    return result;
  }
}
