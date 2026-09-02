import { randomUUID } from 'node:crypto';
import type { Queue } from './queue.service';

interface Job<T = unknown> {
  id: string;
  name: string;
  data: T;
  runAt: number;
  maxAttempts: number;
  attempts: number;
}

export interface MemoryQueueOptions {
  /** delay polling pending delayed jobs (ms). default 50. */
  pollIntervalMs?: number;
}

/**
 * In-memory queue ringan: job dimasukkan ke antrean aktif atau jadwal (delay),
 * dijalankan async; retry sesuai attempts. Cocok untuk pengembangan/battle-test,
 * pengganti nyata nanti Redis/BullMQ.
 */
export class MemoryQueue implements Queue {
  private readonly active: Job[] = [];
  private readonly delayed: Job[] = [];
  private readonly handlers = new Map<string, (data: unknown) => Promise<void>>();
  private readonly pollIntervalMs: number;
  private readonly timer: ReturnType<typeof setInterval> | undefined;
  private running = false;

  constructor(opts?: MemoryQueueOptions) {
    this.pollIntervalMs = opts?.pollIntervalMs ?? 50;
    this.timer = setInterval(() => void this.drain(), this.pollIntervalMs);
    this.timer.unref?.();
  }

  async add<T>(jobName: string, data: T, opts?: { delay?: number; attempts?: number }): Promise<string> {
    const id = randomUUID();
    const job: Job = {
      id,
      name: jobName,
      data,
      runAt: Date.now() + (opts?.delay ?? 0),
      maxAttempts: opts?.attempts ?? 1,
      attempts: 0,
    };
    (job.runAt > Date.now() ? this.delayed : this.active).push(job);
    return id;
  }

  async process<T>(jobName: string, handler: (data: T) => Promise<void>): Promise<void> {
    this.handlers.set(jobName, handler as (data: unknown) => Promise<void>);
  }

  async remove(jobId: string): Promise<void> {
    const idx = this.active.findIndex((j) => j.id === jobId);
    if (idx >= 0) {
      this.active.splice(idx, 1);
      return;
    }
    const dIdx = this.delayed.findIndex((j) => j.id === jobId);
    if (dIdx >= 0) this.delayed.splice(dIdx, 1);
  }

  get pending(): number {
    return this.active.length + this.delayed.length;
  }

  dispose(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const now = Date.now();
      for (let i = this.delayed.length - 1; i >= 0; i -= 1) {
        if (this.delayed[i].runAt <= now) this.active.push(this.delayed.splice(i, 1)[0]);
      }
      while (this.active.length > 0) {
        const job = this.active.shift()!;
        const handler = this.handlers.get(job.name);
        if (!handler) return;
        try {
          await handler(job.data);
        } catch {
          job.attempts += 1;
          if (job.attempts < job.maxAttempts) {
            job.runAt = Date.now() + this.pollIntervalMs;
            this.delayed.push(job);
          }
        }
      }
    } finally {
      this.running = false;
    }
  }
}

export function createMemoryQueue(opts?: MemoryQueueOptions): Queue & Pick<MemoryQueue, 'pending' | 'dispose'> {
  return new MemoryQueue(opts);
}