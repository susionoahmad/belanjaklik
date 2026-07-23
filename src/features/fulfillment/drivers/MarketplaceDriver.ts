import type { ChannelDriver } from './ChannelDriver';
import type { Product, FulfillmentChannel } from '../../shared/types';

export class MarketplaceDriver implements ChannelDriver {
  channelSlug = 'marketplace';

  generateUrl(product: Product, channel?: FulfillmentChannel): string {
    const baseUrl = channel?.base_url || 'https://shopee.co.id/product/';
    const code = product.external_product_code || product.slug || product.id;
    return `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}${code}`;
  }

  openExternal(product: Product, channel?: FulfillmentChannel): void {
    const targetUrl = this.generateUrl(product, channel);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  }
}
