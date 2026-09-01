import type { AuditLog, AuditFilter } from '@opensellvy/types';
import type { ModuleDeps } from './deps';
import { buildIds } from './deps';

export interface AuditModuleImpl {
  log(input: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog>;
  list(filter: AuditFilter): Promise<AuditLog[]>;
}

export function auditModule(deps: ModuleDeps): AuditModuleImpl {
  const { repos } = deps;
  const { id, now } = buildIds(deps);

  return {
    async log(input) {
      const log: AuditLog = { ...input, id: id(), createdAt: now() };
      await repos.audits.save(log);
      return log;
    },

    async list(filter) {
      return repos.audits.list(filter);
    },
  };
}