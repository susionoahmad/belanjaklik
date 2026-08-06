import type { ChannelDriver } from './ChannelDriver';
import type { Product, FulfillmentChannel } from '../../shared/types';
import { openUrl } from '../../shared/utils/openUrl';

export class AlfamindDriver implements ChannelDriver {
  channelSlug = 'alfamind-official';

  generateUrl(product: Product, channel?: FulfillmentChannel): string {
    if (product.product_url && product.product_url.startsWith('http')) {
      return product.product_url;
    }
    if (product.notes && (product.notes.startsWith('http://') || product.notes.startsWith('https://'))) {
      return product.notes;
    }
    const baseUrl = channel?.base_url || 'https://tokovirtualku.id/nessamart/detail/';
    const code = product.external_product_code || (product.id ? product.id.replace(/^own-/, '') : product.slug);
    return `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}${code}`;
  }

  openExternal(product: Product, channel?: FulfillmentChannel): void {
    const targetUrl = this.generateUrl(product, channel);
    openUrl(targetUrl);
  }
}
