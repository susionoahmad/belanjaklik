import type { CartItem, CustomerDetails, FulfillmentChannel } from '../../shared/types';

export interface NotificationFormatter {
  type: string;
  formatOrder(items: CartItem[], customer: CustomerDetails, channel?: FulfillmentChannel): string;
  formatQuotation(product: any, storePhone: string): string;
}
