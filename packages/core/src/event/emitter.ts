import { randomUUID } from 'node:crypto';
import type { DomainEvent, EventBus, EventName } from './event.types';

type Handler<T> = (event: DomainEvent<T>) => void;

export class InProcessEventBus implements EventBus {
  private readonly handlers = new Map<string, Set<Handler<unknown>>>();

  emit<T>(name: EventName, payload: T, opts?: { storeId?: string }): void {
    const event: DomainEvent<T> = {
      name,
      payload,
      id: randomUUID(),
      occurredAt: new Date(),
      storeId: opts?.storeId,
    };
    const handlers = this.handlers.get(name);
    if (!handlers) return;
    for (const handler of handlers) {
      queueMicrotask(() => handler(event));
    }
  }

  on<T>(name: EventName, handler: (event: DomainEvent<T>) => void): () => void {
    let set = this.handlers.get(name);
    if (!set) {
      set = new Set();
      this.handlers.set(name, set);
    }
    set.add(handler as Handler<unknown>);
    return () => {
      set?.delete(handler as Handler<unknown>);
    };
  }
}

export function createEventBus(): EventBus {
  return new InProcessEventBus();
}