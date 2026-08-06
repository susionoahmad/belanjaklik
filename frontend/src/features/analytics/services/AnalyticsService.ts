import { EventBus, SystemEvents } from '../../shared/events/EventBus';
import { supabase, isSupabaseConfigured } from '../../shared/db/supabaseClient';

export interface AnalyticsEventPayload {
  eventName: string;
  productId?: string;
  channelId?: string;
  purchaseMethod?: string;
  payload?: Record<string, any>;
  timestamp: string;
}

class AnalyticsDomainService {
  private eventsLog: AnalyticsEventPayload[] = [];

  constructor() {
    this.registerSubscribers();
  }

  private registerSubscribers(): void {
    EventBus.subscribe(SystemEvents.PURCHASE_STARTED, payload => this.track('PURCHASE_STARTED', payload));
    EventBus.subscribe(SystemEvents.PURCHASE_COMPLETED, payload => this.track('PURCHASE_COMPLETED', payload));
    EventBus.subscribe(SystemEvents.PRODUCT_REDIRECTED, payload => this.track('PRODUCT_REDIRECTED', payload));
    EventBus.subscribe(SystemEvents.WHATSAPP_SENT, payload => this.track('WHATSAPP_SENT', payload));
    EventBus.subscribe(SystemEvents.CART_ITEM_ADDED, payload => this.track('CART_ITEM_ADDED', payload));
    EventBus.subscribe(SystemEvents.PRODUCT_VIEWED, payload => this.track('PRODUCT_VIEWED', payload));
  }

  async track(eventName: string, data?: any): Promise<void> {
    const eventRecord: AnalyticsEventPayload = {
      eventName,
      productId: data?.product?.id || data?.productId,
      channelId: data?.channel?.id || data?.channelId,
      purchaseMethod: data?.product?.purchase_method || data?.purchaseMethod,
      payload: data || {},
      timestamp: new Date().toISOString()
    };

    this.eventsLog.unshift(eventRecord);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('analytics_events').insert([{
          event_name: eventRecord.eventName,
          product_id: eventRecord.productId || null,
          channel_id: eventRecord.channelId || null,
          purchase_method: eventRecord.purchaseMethod || null,
          payload: eventRecord.payload
        }]);
      } catch (err) {
        console.warn('Analytics DB log failed', err);
      }
    }
  }

  getRecentEvents(): AnalyticsEventPayload[] {
    return this.eventsLog;
  }
}

export const AnalyticsService = new AnalyticsDomainService();
