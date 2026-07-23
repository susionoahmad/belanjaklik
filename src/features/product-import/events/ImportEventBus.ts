type EventCallback = (data?: any) => void;

class ImportEventBusService {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  emit(event: string, data?: any): void {
    console.log(`[ImportEventBus] Event emitted: ${event}`, data);
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[ImportEventBus] Error handling event ${event}:`, err);
        }
      });
    }
  }
}

export const ImportEventBus = new ImportEventBusService();
