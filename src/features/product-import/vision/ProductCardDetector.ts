import type { BoundingBox } from '../types';

export interface ProductCardSubBounds {
  cardBox: BoundingBox;
  imageArea: BoundingBox;
  titleArea: BoundingBox;
  priceArea: BoundingBox;
  originalPriceArea?: BoundingBox;
  promoBadgeArea?: BoundingBox;
  discountBadgeArea?: BoundingBox;
}

export class ProductCardDetector {
  static detectCards(contentRegion: BoundingBox): ProductCardSubBounds[] {
    const cards: ProductCardSubBounds[] = [];
    const columns = 2; // Mobile Alfamind product grid 2-column layout
    const numRows = 2; // Standard view contains 2 full rows (4 product cards)

    const paddingX = 16;
    const gapX = 12;
    const cardWidth = Math.floor((contentRegion.width - (paddingX * 2) - gapX) / columns);
    const cardHeight = Math.floor(contentRegion.height * 0.28);

    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < columns; c++) {
        const x = contentRegion.x + paddingX + c * (cardWidth + gapX);
        const y = r === 0 
          ? contentRegion.y + 70 
          : contentRegion.y + Math.floor(contentRegion.height * 0.65);

        const cardBox: BoundingBox = { x, y, width: cardWidth, height: cardHeight };
        const imageArea: BoundingBox = { x: x + 10, y: y + 25, width: cardWidth - 20, height: Math.floor(cardHeight * 0.60) };
        const titleArea: BoundingBox = { x: x + 6, y: y + Math.floor(cardHeight * 0.65), width: cardWidth - 12, height: Math.floor(cardHeight * 0.20) };
        const priceArea: BoundingBox = { x: x + 6, y: y + Math.floor(cardHeight * 0.85), width: cardWidth - 12, height: Math.floor(cardHeight * 0.15) };
        const promoBadgeArea: BoundingBox = { x: x + 6, y: y + 6, width: 55, height: 20 };
        const discountBadgeArea: BoundingBox = { x: x + cardWidth - 45, y: y + 6, width: 40, height: 20 };

        cards.push({
          cardBox,
          imageArea,
          titleArea,
          priceArea,
          promoBadgeArea,
          discountBadgeArea
        });
      }
    }

    return cards;
  }
}
