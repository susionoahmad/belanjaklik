import type { ChannelDriver } from './ChannelDriver';
import type { Product, FulfillmentChannel } from '../../shared/types';

export class AlfamindDriver implements ChannelDriver {
  channelSlug = 'alfamind-official';

  generateUrl(product: Product, channel?: FulfillmentChannel): string {
    let rawUrl = '';
    if (product.notes && (product.notes.startsWith('http://') || product.notes.startsWith('https://'))) {
      rawUrl = product.notes;
    } else {
      const baseUrl = channel?.base_url || 'https://tokovirtualku.id/nessamart/detail/';
      const code = product.external_product_code || product.slug || product.id;
      rawUrl = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}${code}`;
    }

    return rawUrl;
  }

  openExternal(product: Product, channel?: FulfillmentChannel): void {
    const targetUrl = this.generateUrl(product, channel);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  }
}
