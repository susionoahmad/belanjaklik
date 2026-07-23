import type { PurchaseCommand, PurchaseCommandResult } from './PurchaseCommand';
import type { Product, FulfillmentChannel } from '../../shared/types';
import { ChannelDriverFactory } from '../../fulfillment/drivers/ChannelDriverFactory';
import { EventBus, SystemEvents } from '../../shared/events/EventBus';

export class OpenExternalCommand implements PurchaseCommand {
  constructor(private product: Product, private channel?: FulfillmentChannel) {}

  async execute(): Promise<PurchaseCommandResult> {
    const driver = ChannelDriverFactory.getDriver(this.channel?.slug);
    driver.openExternal(this.product, this.channel);

    EventBus.emit(SystemEvents.PRODUCT_REDIRECTED, {
      product: this.product,
      channel: this.channel,
      targetUrl: driver.generateUrl(this.product, this.channel)
    });

    return {
      success: true,
      actionType: 'external_opened',
      message: `Membuka halaman produk resmi ${this.channel?.name || 'External Toko'}...`
    };
  }
}
