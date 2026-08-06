import type { PurchaseCommand, PurchaseCommandResult } from './PurchaseCommand';
import type { Product } from '../../shared/types';

export class ComingSoonCommand implements PurchaseCommand {
  constructor(private product: Product) {}

  async execute(): Promise<PurchaseCommandResult> {
    alert(`Produk [${this.product.name}] akan segera hadir! Nantikan promo khususnya.`);
    return {
      success: true,
      actionType: 'coming_soon_shown',
      message: 'Produk akan segera hadir.'
    };
  }
}
