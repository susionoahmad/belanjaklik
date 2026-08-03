import type { PurchaseCommand, PurchaseCommandResult } from './PurchaseCommand';
import type { Product } from '../../shared/types';
import { NotificationFormatterFactory } from '../../notifications/formatters/NotificationFormatterFactory';
import { dataService } from '../../shared/db/dataService';
import { EventBus, SystemEvents } from '../../shared/events/EventBus';
import { openUrlAsync } from '../../shared/utils/openUrl';

export class QuoteRequestCommand implements PurchaseCommand {
  constructor(private product: Product) {}

  async execute(): Promise<PurchaseCommandResult> {
    await openUrlAsync(async () => {
      const storeProfile = await dataService.fetchStoreProfile();
      const formatter = NotificationFormatterFactory.getFormatter('whatsapp');
      return formatter.formatQuotation(this.product, storeProfile.phone || '6281234567890');
    });

    EventBus.emit(SystemEvents.WHATSAPP_SENT, {
      product: this.product,
      type: 'quote_request'
    });

    return {
      success: true,
      actionType: 'quote_dispatched',
      message: 'Membuka WhatsApp untuk mengirim permintaan penawaran grosir!'
    };
  }
}
