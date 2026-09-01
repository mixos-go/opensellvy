export type EventName =
  | 'order.created'
  | 'order.updated'
  | 'order.status_changed'
  | 'product.updated'
  | 'inventory.changed'
  | 'shipment.created'
  | 'shipment.delivered'
  | 'platform.webhook_received'
  | 'platform.token_refreshed'
  | 'return.requested'
  | 'finance.settled';

export interface DomainEvent<T = unknown> {
  name: EventName;
  payload: T;
  id: string;
  occurredAt: Date;
  storeId?: string;
}

export interface EventBus {
  emit<T>(name: EventName, payload: T, opts?: { storeId?: string }): void;
  on<T>(name: EventName, handler: (event: DomainEvent<T>) => void): () => void;
}
