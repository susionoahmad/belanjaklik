import type { PurchaseStrategy, ButtonConfig, BadgeConfig } from './PurchaseStrategy';
import type { Product, FulfillmentChannel, PurchaseMethod } from '../../shared/types';
import type { PurchaseCommand } from '../commands/PurchaseCommand';
import { QuoteRequestCommand } from '../commands/QuoteRequestCommand';

export class QuoteRequestStrategy implements PurchaseStrategy {
  method: PurchaseMethod = 'quote_request';

  createCommand(product: Product, _channel?: FulfillmentChannel): PurchaseCommand {
    return new QuoteRequestCommand(product);
  }

  getButtonConfig(_product: Product, _channel?: FulfillmentChannel): ButtonConfig {
    return {
      label: 'Minta Penawaran Grosir',
      iconName: 'MessageSquare',
      buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white font-extrabold'
    };
  }

  getBadgeConfig(_product: Product, _channel?: FulfillmentChannel): BadgeConfig {
    return {
      label: 'Penawaran Khusus',
      badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      iconName: 'HelpCircle'
    };
  }
}
