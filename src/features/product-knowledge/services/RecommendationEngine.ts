import type { Product } from '../../shared/types';
import type { ProductRelationshipEntity } from '../types';

export class RecommendationEngine {
  static generateRelationships(targetProduct: Product, catalog: Product[]): ProductRelationshipEntity[] {
    const relationships: ProductRelationshipEntity[] = [];

    const otherProducts = catalog.filter(p => p.id !== targetProduct.id);

    for (const p of otherProducts) {
      let type: ProductRelationshipEntity['relationship_type'] | null = null;
      let score = 0.8;

      // 1. Same category / brand -> Alternative or Similar
      if (p.brand && targetProduct.brand && p.brand.toLowerCase() === targetProduct.brand.toLowerCase()) {
        type = 'SIMILAR';
        score = 0.95;
      } else if (p.category && targetProduct.category && p.category.toLowerCase() === targetProduct.category.toLowerCase()) {
        if (p.price > targetProduct.price) {
          type = 'PREMIUM_ALTERNATIVE';
          score = 0.88;
        } else {
          type = 'BUDGET_ALTERNATIVE';
          score = 0.90;
        }
      }

      // 2. Complementary pairings (Minyak + Indomie + Beras + Gula + Sabun)
      const tName = targetProduct.name.toLowerCase();
      const pName = p.name.toLowerCase();

      if ((tName.includes('indomie') && pName.includes('minyak')) || (tName.includes('minyak') && pName.includes('beras'))) {
        type = 'FREQUENTLY_BOUGHT_TOGETHER';
        score = 0.98;
      }

      if (type) {
        relationships.push({
          id: `rel_${targetProduct.id}_${p.id}`,
          source_product_id: targetProduct.id,
          target_product_id: p.id,
          relationship_type: type,
          score,
          created_at: new Date().toISOString(),
          targetProduct: p
        });
      }
    }

    return relationships;
  }
}
