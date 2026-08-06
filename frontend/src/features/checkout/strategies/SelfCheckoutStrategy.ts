import type { PurchaseStrategy, ButtonConfig, BadgeConfig } from './PurchaseStrategy';
import type { Product, FulfillmentChannel, PurchaseMethod } from '../../shared/types';
import type { PurchaseCommand } from '../commands/PurchaseCommand';
import { OpenExternalCommand } from '../commands/OpenExternalCommand';

export class SelfCheckoutStrategy implements PurchaseStrategy {
  method: PurchaseMethod = 'self_checkout';

  createCommand(product: Product, channel?: FulfillmentChannel): PurchaseCommand {
    return new OpenExternalCommand(product, channel);
  }

  getButtonConfig(product: Product, _channel?: FulfillmentChannel): ButtonConfig {
    const isTokoSaya = (product.product_url && product.product_url.includes('tokovirtualku')) || (product.purchase_method as string) === 'alfamind_tokosaya';
    return {
      label: isTokoSaya ? 'Beli di Toko Saya' : 'Beli via Link',
      iconName: 'ExternalLink',
      buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-sm'
    };
  }

  getBadgeConfig(product: Product, _channel?: FulfillmentChannel): BadgeConfig {
    const isTokoSaya = (product.product_url && product.product_url.includes('tokovirtualku')) || (product.purchase_method as string) === 'alfamind_tokosaya';
    if (isTokoSaya) {
      return {
        label: 'Alfamind (Toko Saya)',
        badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        iconName: 'ExternalLink'
      };
    }
    return {
      label: 'Link Toko',
      badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      iconName: 'ExternalLink'
    };
  }
}
