import type { Product } from '../../shared/types';

export interface ProductAttributeEntity {
  id: string;
  product_id: string;
  attribute_key: string;
  attribute_value: string;
  created_at: string;
}

export interface ProductSynonymEntity {
  id: string;
  product_id: string;
  term: string;
  alias: string;
  created_at: string;
}

export interface ProductEmbeddingEntity {
  id: string;
  product_id: string;
  embedding_vector: number[];
  created_at: string;
}

export interface ProductRelationshipEntity {
  id: string;
  source_product_id: string;
  target_product_id: string;
  relationship_type: 'FREQUENTLY_BOUGHT_TOGETHER' | 'ALTERNATIVE' | 'PREMIUM_ALTERNATIVE' | 'BUDGET_ALTERNATIVE' | 'SIMILAR' | 'COMPLEMENTARY';
  score: number;
  created_at: string;
  targetProduct?: Product;
}

export interface BrandKnowledgeEntity {
  id: string;
  brand_name: string;
  manufacturer: string;
  aliases: string[];
  category_focus: string;
}

export interface CategoryKnowledgeEntity {
  id: string;
  category_name: string;
  shelf_group: string;
  subcategories: string[];
}

export interface SearchIndexItem {
  id: string;
  product_id: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  promo_price?: number;
  keywords: string[];
  synonyms: string[];
  vector: number[];
}

export interface ShoppingAssistantQueryResult {
  query: string;
  matchedProducts: Product[];
  explanation: string;
  suggestedAction: string;
}
