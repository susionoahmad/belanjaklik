import type { Product } from '../../shared/types';
import type { ProductSynonymEntity } from '../types';

export class SynonymEngine {
  private static synonymRules: Array<{ pattern: RegExp; aliases: string[] }> = [
    {
      pattern: /minyak\s*goreng/i,
      aliases: ['Cooking Oil', 'Oil', 'Mynk Grg', 'Cooking Palm Oil', 'Minyak Sayur', 'Minyak Sawit']
    },
    {
      pattern: /indomie|mie/i,
      aliases: ['Noodle', 'Instant Noodle', 'Mie Instan', 'Pop Mie', 'Bungkus Mie']
    },
    {
      pattern: /beras/i,
      aliases: ['Rice', 'White Rice', 'Beras Pulen', 'Sembako Beras']
    },
    {
      pattern: /gula/i,
      aliases: ['Sugar', 'Gula Pasir', 'Gula Tebu', 'Pemanis']
    },
    {
      pattern: /kopi/i,
      aliases: ['Coffee', 'Kopi Hitam', 'Kopi Bubuk', 'Kopi Seduh']
    },
    {
      pattern: /susu/i,
      aliases: ['Milk', 'UHT Milk', 'Susu Olahan', 'Susu Kotak']
    },
    {
      pattern: /sabun|lotion/i,
      aliases: ['Soap', 'Body Wash', 'Body Lotion', 'Sabun Mandi']
    }
  ];

  static generateSynonyms(product: Product): ProductSynonymEntity[] {
    const text = `${product.name} ${product.brand || ''}`.toLowerCase();
    const result: ProductSynonymEntity[] = [];
    const addedAliases = new Set<string>();

    for (const rule of this.synonymRules) {
      if (rule.pattern.test(text)) {
        for (const alias of rule.aliases) {
          if (!addedAliases.has(alias.toLowerCase())) {
            addedAliases.add(alias.toLowerCase());
            result.push({
              id: `syn_${product.id}_${Math.random().toString(36).slice(2, 6)}`,
              product_id: product.id,
              term: product.name,
              alias,
              created_at: new Date().toISOString()
            });
          }
        }
      }
    }

    if (result.length === 0) {
      result.push({
        id: `syn_${product.id}_def`,
        product_id: product.id,
        term: product.name,
        alias: `${product.brand || ''} Item`.trim(),
        created_at: new Date().toISOString()
      });
    }

    return result;
  }
}
