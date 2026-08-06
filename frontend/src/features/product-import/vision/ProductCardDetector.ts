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

    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < columns; c++) {
        const x = contentRegion.x + paddingX + c * (cardWidth + gapX);
        
        // Row 0 (baris 1): naik ke y=203px (top ~14.5%)
        // Row 1 (baris 2): turun ke y=749px (top ~53.5%), height=518px (ends at ~90.5%)
        const y = r === 0 
          ? contentRegion.y - 21 
          : contentRegion.y + Math.floor(contentRegion.height * 0.52);

        const cardHeight = r === 0
          ? Math.floor(contentRegion.height * 0.36) // 504px
          : Math.floor(contentRegion.height * 0.37); // 518px

        const cardBox: BoundingBox = { x, y, width: cardWidth, height: cardHeight };
        // Product photo area: shifted down past headers/buttons to cleanly frame product image
        const imageOffsetY = r === 0 ? 58 : 80;
        const imageArea: BoundingBox = { 
          x: x + 12, 
          y: y + imageOffsetY, 
          width: cardWidth - 24, 
          height: Math.floor(cardHeight * 0.42) 
        };
        const titleArea: BoundingBox = { x: x + 6, y: y + Math.floor(cardHeight * 0.52), width: cardWidth - 12, height: Math.floor(cardHeight * 0.20) };
        const priceArea: BoundingBox = { x: x + 6, y: y + Math.floor(cardHeight * 0.72), width: cardWidth - 12, height: Math.floor(cardHeight * 0.26) };
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
