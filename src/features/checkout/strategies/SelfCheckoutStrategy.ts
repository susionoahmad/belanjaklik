import type { PurchaseStrategy, ButtonConfig, BadgeConfig } from './PurchaseStrategy';
import type { Product, FulfillmentChannel, PurchaseMethod } from '../../shared/types';
import type { PurchaseCommand } from '../commands/PurchaseCommand';
import { OpenExternalCommand } from '../commands/OpenExternalCommand';

export class SelfCheckoutStrategy implements PurchaseStrategy {
  method: PurchaseMethod = 'self_checkout';

  createCommand(product: Product, channel?: FulfillmentChannel): PurchaseCommand {
    return new OpenExternalCommand(product, channel);
  }

  getButtonConfig(_product: Product, channel?: FulfillmentChannel): ButtonConfig {
    const name = channel?.name ? ` ${channel.name}` : '';
    return {
      label: `Beli via Link${name}`,
      iconName: 'ExternalLink',
      buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-sm'
    };
  }

  getBadgeConfig(_product: Product, _channel?: FulfillmentChannel): BadgeConfig {
    return {
      label: 'Link Toko',
      badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      iconName: 'ExternalLink'
    };
  }
}
