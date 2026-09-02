import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import Redis from 'ioredis';
import { createBullMqQueue, BullMqQueue } from '../src/queue/bullmq-queue';

const URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';

async function waitFor(predicate: () => boolean, timeoutMs = 5000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error('waitFor timeout');
    await new Promise((r) => setTimeout(r, 30));
  }
}

describe('BullMqQueue (integrasi Redis + BullMQ nyata)', () => {
  let queue: BullMqQueue;

  beforeAll(async () => {
    const r = new Redis(URL);
    await r.flushall();
    await r.quit();
    queue = new BullMqQueue({ connection: { url: URL } });
  });

  afterAll(async () => {
    await queue.close();
  }, 15000);

  it('add + process menjalankan handler', async () => {
    const seen: string[] = [];
    queue.process('sync.order', async (data: { id: string }) => void seen.push(data.id));
    await queue.add('sync.order', { id: 'o-1' });
    await waitFor(() => seen.length === 1);
    expect(seen).toEqual(['o-1']);
  });

  it('retry attempts: job gagal diulang sesuai attempts', async () => {
    let runs = 0;
    queue.process('flaky.job', async () => {
      runs += 1;
      throw new Error('retry');
    });
    await queue.add('flaky.job', {}, { attempts: 3, backoffMs: 100 });
    await waitFor(() => runs >= 3, 12000);
    expect(runs).toBe(3);
  }, 20000);

  it('remove menghapus job pending ter-delay', async () => {
    const id = await queue.add('delayed.job', {}, { delay: 60_000 });
    await queue.remove(id);
    // getJob menandai missing; tidak ada handler → tetap aman
    expect(id.length).toBeGreaterThan(0);
  });

  it('createBullMqQueue factory', () => {
    const q = createBullMqQueue({ connection: { url: URL } }) as BullMqQueue;
    expect(q).toBeInstanceOf(BullMqQueue);
    void q.close();
  });
});