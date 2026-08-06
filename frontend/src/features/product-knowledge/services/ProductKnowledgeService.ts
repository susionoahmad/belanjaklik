import { offlineDb } from '../../shared/db/offlineDb';
import type { ProductAttributeEntity, ProductEmbeddingEntity, ProductRelationshipEntity, ProductSynonymEntity } from '../types';

class ProductKnowledgeDataService {
  async saveAttributes(attributes: ProductAttributeEntity[]): Promise<void> {
    const existing = (await offlineDb.getItem<ProductAttributeEntity[]>('psa_product_attributes')) || [];
    const combined = [...attributes, ...existing.filter(e => !attributes.some(a => a.id === e.id))];
    await offlineDb.setItem('psa_product_attributes', combined);
  }

  async getAttributes(productId?: string): Promise<ProductAttributeEntity[]> {
    const existing = (await offlineDb.getItem<ProductAttributeEntity[]>('psa_product_attributes')) || [];
    return productId ? existing.filter(a => a.product_id === productId) : existing;
  }

  async saveSynonyms(synonyms: ProductSynonymEntity[]): Promise<void> {
    const existing = (await offlineDb.getItem<ProductSynonymEntity[]>('psa_product_synonyms')) || [];
    const combined = [...synonyms, ...existing.filter(e => !synonyms.some(s => s.id === e.id))];
    await offlineDb.setItem('psa_product_synonyms', combined);
  }

  async getSynonyms(): Promise<ProductSynonymEntity[]> {
    return (await offlineDb.getItem<ProductSynonymEntity[]>('psa_product_synonyms')) || [];
  }

  async saveRelationships(relationships: ProductRelationshipEntity[]): Promise<void> {
    const existing = (await offlineDb.getItem<ProductRelationshipEntity[]>('psa_product_relationships')) || [];
    const combined = [...relationships, ...existing.filter(e => !relationships.some(r => r.id === e.id))];
    await offlineDb.setItem('psa_product_relationships', combined);
  }

  async getRelationships(): Promise<ProductRelationshipEntity[]> {
    return (await offlineDb.getItem<ProductRelationshipEntity[]>('psa_product_relationships')) || [];
  }
}

export const productKnowledgeService = new ProductKnowledgeDataService();
