import { ImportEventBus } from '../../product-import/events/ImportEventBus';
import { dataService } from '../../shared/db/dataService';
import type { Product } from '../../shared/types';
import { AttributeExtractionService } from '../services/AttributeExtractionService';
import { SynonymEngine } from '../services/SynonymEngine';
import { SemanticEmbeddingService } from '../services/SemanticEmbeddingService';
import { SearchIndexService } from '../services/SearchIndexService';
import { RecommendationEngine } from '../services/RecommendationEngine';
import { productKnowledgeService } from '../services/ProductKnowledgeService';
import type { ProductAttributeEntity, ProductRelationshipEntity, ProductSynonymEntity } from '../types';

export class KnowledgePipeline {
  private isProcessing = false;

  constructor() {
    this.subscribeToCatalogEvents();
  }

  private subscribeToCatalogEvents(): void {
    ImportEventBus.on('CatalogUpdated', async (data: any) => {
      console.log('[KnowledgePipeline] Received CatalogUpdated event. Starting asynchronous knowledge enrichment.', data);
      await this.runPipeline();
    });
  }

  async runPipeline(): Promise<void> {
    if (this.isProcessing) {
      console.log('[KnowledgePipeline] Pipeline already running, skipping overlapping run.');
      return;
    }

    this.isProcessing = true;
    ImportEventBus.emit('KnowledgeStarted', { timestamp: new Date().toISOString() });

    try {
      const catalog = await dataService.fetchProducts();

      const allAttributes: ProductAttributeEntity[] = [];
      const allSynonyms: ProductSynonymEntity[] = [];
      const allRelationships: ProductRelationshipEntity[] = [];

      for (const product of catalog) {
        // 1. Attribute Extraction
        const attrs = AttributeExtractionService.extractAttributes(product);
        allAttributes.push(...attrs);

        // 2. Synonym Engine
        const syns = SynonymEngine.generateSynonyms(product);
        allSynonyms.push(...syns);

        // 3. Recommendation Engine
        const rels = RecommendationEngine.generateRelationships(product, catalog);
        allRelationships.push(...rels);
      }

      // Persist knowledge entities
      await productKnowledgeService.saveAttributes(allAttributes);
      await productKnowledgeService.saveSynonyms(allSynonyms);
      await productKnowledgeService.saveRelationships(allRelationships);

      // 4. Update Search Index
      const searchItems = SearchIndexService.updateIndexForProducts(catalog);

      ImportEventBus.emit('SearchIndexUpdated', { totalIndexed: searchItems.length });
      ImportEventBus.emit('RecommendationUpdated', { totalRelationships: allRelationships.length });

      ImportEventBus.emit('KnowledgeCompleted', {
        timestamp: new Date().toISOString(),
        totalProductsEnriched: catalog.length,
        attributesCount: allAttributes.length,
        synonymsCount: allSynonyms.length,
        relationshipsCount: allRelationships.length
      });

      console.log(`[KnowledgePipeline] Successfully enriched ${catalog.length} catalog products!`);
    } catch (err) {
      console.error('[KnowledgePipeline] Error executing knowledge pipeline:', err);
    } finally {
      this.isProcessing = false;
    }
  }
}

export const knowledgePipeline = new KnowledgePipeline();
