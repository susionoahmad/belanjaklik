import type { SEOMarketingMeta } from '../types/enterpriseTypes';
import type { PromotionCampaign } from '../types/campaignTypes';

export class SEOMarketingGenerator {
  static generateMeta(campaign: Partial<PromotionCampaign>, currentOrigin: string = 'https://alfamind-sembako.app'): SEOMarketingMeta {
    const title = campaign.title || 'Kampanye Promo Sembako';
    const subtitle = campaign.subtitle || campaign.description || 'Dapatkan diskon hemat kebutuhan sembako & dapur keluarga.';
    const slug = campaign.slug || 'promo-spesial';
    const bannerUrl = campaign.desktop_banner || campaign.banner_image || `${currentOrigin}/banner-default.jpg`;
    const canonicalUrl = `${currentOrigin}/campaign/${slug}`;

    const jsonLdSchema = {
      '@context': 'https://schema.org',
      '@type': 'SpecialAnnouncement',
      'name': title,
      'text': subtitle,
      'category': 'https://schema.org/SaleEvent',
      'url': canonicalUrl,
      'datePosted': new Date().toISOString(),
      'announcementLocation': {
        '@type': 'LocalBusiness',
        'name': 'Toko Saya Personal Shopping Assistant'
      },
      'offers': {
        '@type': 'Offer',
        'validFrom': campaign.start_date ? `${campaign.start_date}T00:00:00+07:00` : new Date().toISOString(),
        'validThrough': campaign.end_date ? `${campaign.end_date}T23:59:59+07:00` : new Date().toISOString(),
        'priceCurrency': 'IDR',
        'availability': 'https://schema.org/InStock'
      }
    };

    return {
      seo_title: `${title} - Diskon Promo Hemat Sembako`,
      meta_description: `${subtitle} Periode promo: ${campaign.start_date} s/d ${campaign.end_date}. Belanja mudah dengan Toko Saya.`,
      meta_keywords: [title.toLowerCase(), 'promo sembako', 'harga coret', 'diskon sembako', 'belanja minyak murah', 'promo toko saya'],
      og_title: title,
      og_description: subtitle,
      og_image: bannerUrl,
      twitter_card: 'summary_large_image',
      canonical_url: canonicalUrl,
      json_ld_schema: jsonLdSchema
    };
  }
}
