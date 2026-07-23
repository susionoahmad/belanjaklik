import type { Product, FulfillmentChannel, PurchaseMethod } from '../../shared/types';
import type { PurchaseCommand } from '../commands/PurchaseCommand';

export interface ButtonConfig {
  label: string;
  iconName: string;
  buttonClass: string;
}

export interface BadgeConfig {
  label: string;
  badgeClass: string;
  iconName: string;
}

export interface PurchaseStrategy {
  method: PurchaseMethod;
  createCommand(product: Product, channel?: FulfillmentChannel): PurchaseCommand;
  getButtonConfig(product: Product, channel?: FulfillmentChannel): ButtonConfig;
  getBadgeConfig(product: Product, channel?: FulfillmentChannel): BadgeConfig;
}
