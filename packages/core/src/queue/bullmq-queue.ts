import { Queue as BullQueue, Worker } from 'bullmq';
import type { Queue } from './queue.service';

export interface BullMqQueueOptions {
  connection?: { host?: string; port?: number; url?: string };
  prefix?: string;
}

/**
 * Adapter BullMQ untuk contract `Queue` core.
 * Producer (add) & consumer (process) — job JSON di Redis; retry/delay native BullMQ.
 */
export class BullMqQueue implements Queue {
  private readonly queue: BullQueue;
  private readonly queueName: string;
  private readonly connection: NonNullable<NonNullable<BullMqQueueOptions['connection']>>;
  private readonly handlers = new Map<string, (data: never) => Promise<void>>();
  private worker: Worker | undefined;

  constructor(opts?: BullMqQueueOptions) {
    this.queueName = opts?.prefix ? `${opts.prefix}:opensellvy` : 'opensellvy';
    this.connection = opts?.connection ?? {};
    this.queue = new BullQueue(this.queueName, { connection: this.bullConnection() });
  }

  async add<T>(jobName: string, data: T, opts?: { delay?: number; attempts?: number; backoffMs?: number }): Promise<string> {
    const job = await this.queue.add(jobName, data, {
      ...(opts?.delay !== undefined ? { delay: opts.delay } : {}),
      attempts: opts?.attempts ?? 1,
      ...(opts?.backoffMs !== undefined
        ? { backoff: { type: 'fixed' as const, delay: opts.backoffMs } }
        : {}),
    });
    return job.id ?? '';
  }

  process<T>(jobName: string, handler: (data: T) => Promise<void>): void {
    this.handlers.set(jobName, handler as (data: never) => Promise<void>);
    if (!this.worker) {
      this.worker = new Worker(this.queueName, async (job) => {
        const handler = this.handlers.get(job.name);
        if (!handler) return;
        await handler(job.data as never);
      }, { connection: this.bullConnection() as never });
      this.worker.on('failed', (job, err) => {
        void job;
        void err;
      });
    }
  }

  async remove(jobId: string): Promise<void> {
    const job = await this.queue.getJob(jobId);
    if (job) await job.remove();
  }

  async close(): Promise<void> {
    if (this.worker) await this.worker.close();
    this.handlers.clear();
    await this.queue.close();
  }

  private bullConnection(): { host: string; port: number } {
    if (typeof this.connection.url === 'string' && this.connection.url) {
      const u = new URL(this.connection.url);
      return { host: u.hostname, port: Number(u.port || 6379) };
    }
    return { host: this.connection.host ?? '127.0.0.1', port: this.connection.port ?? 6379 };
  }
}

export function createBullMqQueue(opts?: BullMqQueueOptions): Queue & Pick<BullMqQueue, 'close'> {
  return new BullMqQueue(opts);
}