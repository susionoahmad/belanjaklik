import type { PurchaseCommand, PurchaseCommandResult } from './PurchaseCommand';
import type { Product } from '../../shared/types';
import { useCartStore } from '../../cart/stores/cartStore';
import { EventBus, SystemEvents } from '../../shared/events/EventBus';

export class AddToCartCommand implements PurchaseCommand {
  constructor(private product: Product) {}

  async execute(): Promise<PurchaseCommandResult> {
    const cartStore = useCartStore();
    cartStore.addItem(this.product);
    EventBus.emit(SystemEvents.CART_ITEM_ADDED, { product: this.product });
    return {
      success: true,
      actionType: 'cart_added',
      message: `[${this.product.name}] berhasil ditambahkan ke keranjang belanja!`
    };
  }
}
