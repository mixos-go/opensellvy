import { describe, expect, it } from 'vitest';
import { createEventBus } from '../src/event';

function flush(): Promise<void> {
  return new Promise((r) => setTimeout(r, 5));
}

describe('InProcessEventBus', () => {
  it('delivers typed events to handler', async () => {
    const bus = createEventBus();
    const received: Array<{ payload: unknown; name: string; storeId?: string; id?: string }> = [];
    const off = bus.on('order.created', (event) => {
      received.push({ payload: event.payload, name: event.name, storeId: event.storeId, id: event.id });
    });
    bus.emit('order.created', { id: 'o-1' }, { storeId: 's-1' });
    await flush();
    off();
    expect(received).toHaveLength(1);
    expect(received[0].payload).toEqual({ id: 'o-1' });
    expect(received[0].name).toBe('order.created');
    expect(received[0].storeId).toBe('s-1');
    expect(received[0].id).toBeTruthy();
  });

  it('off() stops future delivery', async () => {
    const bus = createEventBus();
    const seen: number[] = [];
    const off = bus.on('inventory.changed', () => {
      seen.push(1);
    });
    bus.emit('inventory.changed', {});
    await flush();
    off();
    bus.emit('inventory.changed', {});
    await flush();
    expect(seen).toHaveLength(1);
  });

  it('does not call handlers for other event names', async () => {
    const bus = createEventBus();
    let count = 0;
    bus.on('order.created', () => {
      count += 1;
    });
    bus.emit('product.updated', {});
    await flush();
    expect(count).toBe(0);
  });
});
