import type { Product } from '../../shared/types';
import type { ExtractedFlyerProduct } from '../types/campaignTypes';
import type { RawFlyerCard } from './FlyerProductParser';

export class CatalogMatcherOnly {
  static matchAgainstCatalog(cards: RawFlyerCard[], catalogProducts: Product[]): ExtractedFlyerProduct[] {
    return cards.map((card, idx) => {
      let matched: Product | undefined = undefined;
      let confidence = 0;

      const qClean = card.raw_name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
      const qBrand = (card.brand || '').toLowerCase();

      let bestScore = 0;
      let bestCandidate: Product | undefined = undefined;

      for (const prod of catalogProducts) {
        const pClean = prod.name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
        const pBrand = (prod.brand || '').toLowerCase();

        // 1. Exact match
        if (pClean === qClean) {
          bestCandidate = prod;
          bestScore = 100;
          break;
        }

        // 2. Strong substring match
        if (pClean.includes(qClean) || qClean.includes(pClean)) {
          if (95 > bestScore) {
            bestCandidate = prod;
            bestScore = 95;
          }
          continue;
        }

        // 3. Token-based overlap scoring
        const qTokens = qClean.split(/\s+/).filter(t => t.length > 1);
        const pTokens = pClean.split(/\s+/).filter(t => t.length > 1);

        if (qTokens.length === 0 || pTokens.length === 0) continue;

        const commonTokens = qTokens.filter(t => pTokens.includes(t));
        let score = Math.round((commonTokens.length / Math.max(qTokens.length, pTokens.length)) * 100);

        // Boost score if brand matches
        if (qBrand && pBrand && (qBrand.includes(pBrand) || pBrand.includes(qBrand))) {
          score += 15;
        }

        if (score > bestScore && score >= 50) {
          bestScore = score;
          bestCandidate = prod;
        }
      }

      if (bestCandidate && bestScore >= 50) {
        matched = bestCandidate;
        confidence = Math.min(100, bestScore);
      }

      const matchStatus = matched 
        ? (confidence >= 90 ? 'MATCHED_EXACT' : 'MATCHED_SIMILAR')
        : 'UNMATCHED_REQUIRES_CATALOG_PRODUCT';

      // Prioritize matched catalog product's image, fallback to card's own image
      const resolvedImageUrl = matched?.image_url || card.crop_image_url;

      return {
        id: `fl_card_${Date.now()}_${idx}`,
        raw_name: card.raw_name,
        brand: card.brand,
        size: card.size,
        variant: card.variant,
        flyer_promo_price: card.flyer_promo_price,
        flyer_original_price: card.flyer_original_price,
        discount_badge: card.discount_badge,
        crop_image_url: resolvedImageUrl,
        matched_product: matched,
        match_status: matchStatus,
        match_confidence: confidence
      };
    });
  }
}

