export interface PurchaseCommandResult {
  success: boolean;
  actionType: 'cart_added' | 'external_opened' | 'quote_dispatched' | 'coming_soon_shown';
  message: string;
}

export interface PurchaseCommand {
  execute(): Promise<PurchaseCommandResult>;
}
