import type { ID, ISO8601 } from '../base';

export interface AuditLog {
  id: ID;
  storeId?: ID;
  actorId: ID;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: ISO8601;
}

export interface AuditFilter {
  storeId?: ID;
  actorId?: ID;
  action?: string;
  from?: ISO8601;
  to?: ISO8601;
  cursor?: string;
  limit?: number;
}