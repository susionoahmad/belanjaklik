import type { Product, FulfillmentChannel } from '../../shared/types';
import { PurchaseStrategyFactory } from '../../checkout/strategies/PurchaseStrategyFactory';
import type { ButtonConfig, BadgeConfig } from '../../checkout/strategies/PurchaseStrategy';
import { EventBus, SystemEvents } from '../../shared/events/EventBus';

export class PurchaseOrchestratorService {
  async execute(product: Product, channel?: FulfillmentChannel) {
    EventBus.emit(SystemEvents.PURCHASE_STARTED, { product, channel });

    const strategy = PurchaseStrategyFactory.getStrategyForProduct(product, channel);
    const command = strategy.createCommand(product, channel);
    const result = await command.execute();

    EventBus.emit(SystemEvents.PURCHASE_COMPLETED, { product, channel, result });
    return result;
  }

  getButtonConfig(product: Product, channel?: FulfillmentChannel): ButtonConfig {
    const strategy = PurchaseStrategyFactory.getStrategyForProduct(product, channel);
    return strategy.getButtonConfig(product, channel);
  }

  getBadgeConfig(product: Product, channel?: FulfillmentChannel): BadgeConfig {
    const strategy = PurchaseStrategyFactory.getStrategyForProduct(product, channel);
    return strategy.getBadgeConfig(product, channel);
  }
}

export const PurchaseService = new PurchaseOrchestratorService();

