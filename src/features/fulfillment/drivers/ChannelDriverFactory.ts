import type { ChannelDriver } from './ChannelDriver';
import { AlfamindDriver } from './AlfamindDriver';
import { MarketplaceDriver } from './MarketplaceDriver';

class ChannelDriverFactoryService {
  private drivers: Map<string, ChannelDriver> = new Map();
  private defaultDriver: ChannelDriver;

  constructor() {
    const alfamind = new AlfamindDriver();
    const marketplace = new MarketplaceDriver();

    this.defaultDriver = alfamind;

    this.registerDriver(alfamind);
    this.registerDriver(marketplace);
  }

  registerDriver(driver: ChannelDriver): void {
    this.drivers.set(driver.channelSlug.toLowerCase(), driver);
  }

  getDriver(channelSlug?: string): ChannelDriver {
    if (!channelSlug) return this.defaultDriver;
    const found = this.drivers.get(channelSlug.toLowerCase());
    return found || this.defaultDriver;
  }
}

export const ChannelDriverFactory = new ChannelDriverFactoryService();
