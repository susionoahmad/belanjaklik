import type { Product } from '../../shared/types';
import type { ProductEmbeddingEntity } from '../types';

export class SemanticEmbeddingService {
  static generateVector(product: Product): number[] {
    const combined = `${product.name} ${product.brand || ''} ${product.category || ''} ${product.description || ''}`.toLowerCase();
    const vectorLength = 16;
    const vector = new Array(vectorLength).fill(0);

    for (let i = 0; i < combined.length; i++) {
      const code = combined.charCodeAt(i);
      vector[i % vectorLength] += Math.sin(code + i);
    }

    // Normalize vector
    const mag = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vector.map(val => val / mag);
  }

  static createEmbeddingEntity(product: Product): ProductEmbeddingEntity {
    return {
      id: `emb_${product.id}`,
      product_id: product.id,
      embedding_vector: this.generateVector(product),
      created_at: new Date().toISOString()
    };
  }
}
