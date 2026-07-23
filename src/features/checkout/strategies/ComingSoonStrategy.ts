import type { PurchaseStrategy, ButtonConfig, BadgeConfig } from './PurchaseStrategy';
import type { Product, FulfillmentChannel, PurchaseMethod } from '../../shared/types';
import type { PurchaseCommand } from '../commands/PurchaseCommand';
import { ComingSoonCommand } from '../commands/ComingSoonCommand';

export class ComingSoonStrategy implements PurchaseStrategy {
  method: PurchaseMethod = 'coming_soon';

  createCommand(product: Product, _channel?: FulfillmentChannel): PurchaseCommand {
    return new ComingSoonCommand(product);
  }

  getButtonConfig(_product: Product, _channel?: FulfillmentChannel): ButtonConfig {
    return {
      label: 'Segera Hadir',
      iconName: 'Clock',
      buttonClass: 'bg-gray-400 text-white font-extrabold cursor-not-allowed'
    };
  }

  getBadgeConfig(_product: Product, _channel?: FulfillmentChannel): BadgeConfig {
    return {
      label: 'Segera Hadir',
      badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
      iconName: 'Clock'
    };
  }
}
