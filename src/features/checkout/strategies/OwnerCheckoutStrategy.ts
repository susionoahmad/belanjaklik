import type { PurchaseStrategy, ButtonConfig, BadgeConfig } from './PurchaseStrategy';
import type { Product, FulfillmentChannel, PurchaseMethod } from '../../shared/types';
import type { PurchaseCommand } from '../commands/PurchaseCommand';
import { AddToCartCommand } from '../commands/AddToCartCommand';

export class OwnerCheckoutStrategy implements PurchaseStrategy {
  method: PurchaseMethod = 'owner_checkout';

  createCommand(product: Product, _channel?: FulfillmentChannel): PurchaseCommand {
    return new AddToCartCommand(product);
  }

  getButtonConfig(_product: Product, _channel?: FulfillmentChannel): ButtonConfig {
    return {
      label: '+ Beli',
      iconName: 'Plus',
      buttonClass: 'bg-brand-red hover:bg-brand-red-dark text-white font-extrabold shadow-sm'
    };
  }

  getBadgeConfig(_product: Product, _channel?: FulfillmentChannel): BadgeConfig {
    return {
      label: 'Alfamart (WA)',
      badgeClass: 'bg-red-50 text-brand-red dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800',
      iconName: 'MessageSquare'
    };
  }
}
