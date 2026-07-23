type EventCallback = (payload?: any) => void;

class EventBusService {
  private subscribers: Map<string, Set<EventCallback>> = new Map();

  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(callback);

    // Return unsubscribe handle
    return () => {
      this.subscribers.get(event)?.delete(callback);
    };
  }

  emit(event: string, payload?: any): void {
    const handlers = this.subscribers.get(event);
    if (handlers) {
      handlers.forEach(fn => {
        try {
          fn(payload);
        } catch (err) {
          console.error(`Error executing subscriber for event [${event}]:`, err);
        }
      });
    }
  }
}

export const EventBus = new EventBusService();

export const SystemEvents = {
  PURCHASE_STARTED: 'PURCHASE_STARTED',
  PURCHASE_COMPLETED: 'PURCHASE_COMPLETED',
  PRODUCT_REDIRECTED: 'PRODUCT_REDIRECTED',
  WHATSAPP_SENT: 'WHATSAPP_SENT',
  CART_ITEM_ADDED: 'CART_ITEM_ADDED',
  PRODUCT_VIEWED: 'PRODUCT_VIEWED'
} as const;
