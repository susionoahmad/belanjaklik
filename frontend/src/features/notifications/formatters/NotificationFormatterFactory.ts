import type { NotificationFormatter } from './NotificationFormatter';
import { WhatsappFormatter } from './WhatsappFormatter';

class NotificationFormatterFactoryService {
  private formatters: Map<string, NotificationFormatter> = new Map();
  private defaultFormatter: NotificationFormatter;

  constructor() {
    const wa = new WhatsappFormatter();
    this.defaultFormatter = wa;
    this.registerFormatter(wa);
  }

  registerFormatter(formatter: NotificationFormatter): void {
    this.formatters.set(formatter.type.toLowerCase(), formatter);
  }

  getFormatter(type: string = 'whatsapp'): NotificationFormatter {
    return this.formatters.get(type.toLowerCase()) || this.defaultFormatter;
  }
}

export const NotificationFormatterFactory = new NotificationFormatterFactoryService();
