import type { Product, FulfillmentChannel } from '../../shared/types';

export interface ChannelDriver {
  channelSlug: string;
  generateUrl(product: Product, channel?: FulfillmentChannel): string;
  openExternal(product: Product, channel?: FulfillmentChannel): void;
}
