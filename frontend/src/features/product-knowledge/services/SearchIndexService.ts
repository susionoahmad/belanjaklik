import type { Product } from '../../shared/types';
import type { ProductSynonymEntity, SearchIndexItem } from '../types';
import { SemanticEmbeddingService } from './SemanticEmbeddingService';
import { SynonymEngine } from './SynonymEngine';

export class SearchIndexService {
  private static indexItems: SearchIndexItem[] = [];

  static updateIndexForProducts(products: Product[]): SearchIndexItem[] {
    this.indexItems = products.map(p => {
      const synonymsEntities = SynonymEngine.generateSynonyms(p);
      const synonyms = synonymsEntities.map(s => s.alias);
      const keywords = p.name.toLowerCase().split(/\s+/).concat(p.brand?.toLowerCase() || []);

      return {
        id: `idx_${p.id}`,
        product_id: p.id,
        title: p.name,
        brand: p.brand || 'Umum',
        category: p.category || 'Alfamart (Sembako)',
        price: p.promo_price || p.price,
        promo_price: p.promo_price,
        keywords,
        synonyms,
        vector: SemanticEmbeddingService.generateVector(p)
      };
    });

    console.log(`[SearchIndexService] Search index updated with ${this.indexItems.length} products.`);
    return this.indexItems;
  }

  static search(query: string): SearchIndexItem[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.indexItems;

    return this.indexItems.filter(item => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchBrand = item.brand.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchSynonym = item.synonyms.some(s => s.toLowerCase().includes(q));
      const matchKeyword = item.keywords.some(k => k.includes(q));

      return matchTitle || matchBrand || matchCategory || matchSynonym || matchKeyword;
    });
  }
}
