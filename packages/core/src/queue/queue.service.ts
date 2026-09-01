export interface Queue {
  add<T>(jobName: string, data: T, opts?: { delay?: number; attempts?: number }): Promise<string>;
  process<T>(jobName: string, handler: (data: T) => Promise<void>): void;
  remove(jobId: string): Promise<void>;
}
