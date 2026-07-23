import type { Product, FulfillmentChannel } from '../../shared/types';
import { ChannelDriverFactory } from '../../fulfillment/drivers/ChannelDriverFactory';

export class UrlGeneratorDomainService {
  generateUrl(product: Product, channel?: FulfillmentChannel): string {
    const driver = ChannelDriverFactory.getDriver(channel?.slug);
    return driver.generateUrl(product, channel);
  }
}

export const UrlGeneratorService = new UrlGeneratorDomainService();
