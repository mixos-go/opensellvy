import { describe, expect, it } from 'vitest';
import { createMemoryQueue } from '../src/queue/memory-queue';

async function waitFor(predicate: () => boolean, timeoutMs = 2000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error('waitFor timeout');
    await new Promise((r) => setTimeout(r, 5));
  }
}

describe('MemoryQueue', () => {
  it('process + add langsung menjalankan handler', async () => {
    const queue = createMemoryQueue({ pollIntervalMs: 5 });
    const seen: string[] = [];
    await queue.process('order.sync', async (data: { id: string }) => {
      seen.push(data.id);
    });
    await queue.add('order.sync', { id: 'o-1' });
    await waitFor(() => seen.length === 1);
    expect(seen).toEqual(['o-1']);
    queue.dispose();
  });

  it('job tanpa handler tidak dieksekusi', async () => {
    const queue = createMemoryQueue({ pollIntervalMs: 5 });
    await queue.add('unhandled', {});
    expect(queue.pending).toBe(1);
    queue.dispose();
  });

  it('delay menjadwalkan eksekusi, retry sesuai attempts', async () => {
    const queue = createMemoryQueue({ pollIntervalMs: 5 });
    let ran = 0;
    await queue.process('flaky', async () => {
      ran += 1;
      throw new Error('retry me');
    });
    await queue.add('flaky', {}, { attempts: 3 });
    await waitFor(() => ran >= 3);
    expect(ran).toBe(3);
    queue.dispose();
  });

  it('remove membatalkan job tertunda', async () => {
    const queue = createMemoryQueue({ pollIntervalMs: 5 });
    let ran = 0;
    await queue.process('sync', async () => {
      ran += 1;
    });
    const id = await queue.add('sync', {}, { delay: 5000 });
    await queue.remove(id);
    expect(queue.pending).toBe(0);
    queue.dispose();
  });

  it('remove job yang sedang dalam antrean aktif', async () => {
    const queue = createMemoryQueue({ pollIntervalMs: 5 });
    const gate = new Promise<void>((resolve) => resolve());
    let completed = false;
    await queue.process('slow', async () => {
      await gate;
      completed = true;
    });
    const id = await queue.add('slow', {});
    await queue.add('slow', {});
    await queue.remove(id);
    expect(queue.pending).toBe(1);
    queue.dispose();
  });
});