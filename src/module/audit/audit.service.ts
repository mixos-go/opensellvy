export interface AuditModule {
  log(action: string, actorId: string, target: unknown, metadata?: unknown): Promise<void>;
  getLogs(filters: unknown): Promise<unknown[]>;
}