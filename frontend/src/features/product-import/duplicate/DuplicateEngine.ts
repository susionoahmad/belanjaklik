import type { DetectedCard } from '../types';

export class DuplicateEngine {
  static deduplicate(cards: DetectedCard[]): { uniqueCards: DetectedCard[]; duplicates: DetectedCard[] } {
    const uniqueCards: DetectedCard[] = [];
    const duplicates: DetectedCard[] = [];
    const seenKeys = new Set<string>();

    for (const card of cards) {
      const name = (card.aiCorrectedData?.corrected_name || card.normalizedData?.normalized_name || '').toLowerCase().trim();
      const brand = (card.aiCorrectedData?.corrected_brand || card.normalizedData?.normalized_brand || '').toLowerCase().trim();
      const price = card.normalizedData?.normalized_price || 0;

      const key = `${brand}_${name}_${price}`;

      if (seenKeys.has(key)) {
        duplicates.push(card);
      } else {
        seenKeys.add(key);
        uniqueCards.push(card);
      }
    }

    return { uniqueCards, duplicates };
  }
}
