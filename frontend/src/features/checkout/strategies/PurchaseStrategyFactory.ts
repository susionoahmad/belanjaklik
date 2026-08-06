import type { PurchaseStrategy } from './PurchaseStrategy';
import type { Product, PurchaseMethod, FulfillmentChannel } from '../../shared/types';
import { SelfCheckoutStrategy } from './SelfCheckoutStrategy';
import { OwnerCheckoutStrategy } from './OwnerCheckoutStrategy';
import { QuoteRequestStrategy } from './QuoteRequestStrategy';
import { ComingSoonStrategy } from './ComingSoonStrategy';

class PurchaseStrategyFactoryService {
  private strategies: Map<PurchaseMethod, PurchaseStrategy> = new Map();
  private selfCheckoutStrategy: SelfCheckoutStrategy;
  private ownerCheckoutStrategy: OwnerCheckoutStrategy;
  private defaultStrategy: PurchaseStrategy;

  constructor() {
    this.selfCheckoutStrategy = new SelfCheckoutStrategy();
    this.ownerCheckoutStrategy = new OwnerCheckoutStrategy();
    const quote = new QuoteRequestStrategy();
    const coming = new ComingSoonStrategy();

    this.defaultStrategy = this.ownerCheckoutStrategy;

    this.registerStrategy(this.selfCheckoutStrategy);
    this.registerStrategy(this.ownerCheckoutStrategy);
    this.registerStrategy(quote);
    this.registerStrategy(coming);
  }

  registerStrategy(strategy: PurchaseStrategy): void {
    this.strategies.set(strategy.method, strategy);
  }

  getStrategy(method?: PurchaseMethod): PurchaseStrategy {
    if (!method) return this.defaultStrategy;
    return this.strategies.get(method) || this.defaultStrategy;
  }

  getStrategyForProduct(product: Product, channel?: FulfillmentChannel): PurchaseStrategy {
    // 1. Explicit purchase_method takes precedence
    if (product.purchase_method === 'self_checkout') {
      return this.selfCheckoutStrategy;
    }
    if (product.purchase_method === 'owner_checkout') {
      return this.ownerCheckoutStrategy;
    }
    if (product.purchase_method === 'quote_request') {
      return this.strategies.get('quote_request') || this.ownerCheckoutStrategy;
    }
    if (product.purchase_method === 'coming_soon') {
      return this.strategies.get('coming_soon') || this.ownerCheckoutStrategy;
    }

    // 2. Check if product has explicit external code or URL link in notes
    const hasExternalLink = 
      (product.notes && (product.notes.includes('http://') || product.notes.includes('https://'))) ||
      (product.external_product_code && product.external_product_code.trim().length > 0) ||
      (channel?.slug === 'alfamind-official' || channel?.slug === 'marketplace-partner');

    if (hasExternalLink) {
      return this.selfCheckoutStrategy;
    }

    // 3. Default to Alfamart WA Owner Checkout (+ Beli)
    return this.ownerCheckoutStrategy;
  }

}

export const PurchaseStrategyFactory = new PurchaseStrategyFactoryService();


