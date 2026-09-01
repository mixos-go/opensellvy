import type { ID, ISO8601 } from '@opensellvy/types';
import type { ConnectorRegistry, TokenStore, PlatformCredentials, ConnectorContext } from '@opensellvy/connector';
import type { Repositories } from '../ports';

export interface EventEmitterLike {
  emit(event: string, payload?: unknown): Promise<void>;
}

export interface ModuleDeps {
  /** storage ports (in-memory / Postgres / ...) — bebas akses storage */
  repos: Repositories;
  /** satu gate ke semua platform adapter */
  registry: ConnectorRegistry;
  /** token storage OAuth per (storeId, platform) */
  tokens?: TokenStore;
  /** supply app credential per store+platform */
  credentials?: (storeId: ID, platform: string) => Promise<PlatformCredentials>;
  logger?: { info(msg: string, ctx?: unknown): void; warn(msg: string, ctx?: unknown): void; error(msg: string, ctx?: unknown): void };
  events?: EventEmitterLike;
  newId?: () => ID;
  now?: () => ISO8601;
}

export function buildIds(deps: ModuleDeps): { id: () => ID; now: () => ISO8601 } {
  return { id: deps.newId ?? defaultNewId, now: deps.now ?? (() => new Date().toISOString()) };
}

let seq = 0;
function defaultNewId(): ID {
  seq += 1;
  return `id-${Date.now().toString(36)}-${seq.toString(36)}`;
}

export function requireToken(deps: ModuleDeps): NonNullable<ModuleDeps['tokens']> {
  if (!deps.tokens) throw new Error('ModuleDeps.tokens required for channel/auth flows');
  return deps.tokens;
}

export function requireCredentials(deps: ModuleDeps): NonNullable<ModuleDeps['credentials']> {
  if (!deps.credentials) throw new Error('ModuleDeps.credentials required for channel flows');
  return deps.credentials;
}

/** Bangun ConnectorContext per (storeId, platform) dari token tersimpan + credential store. */
export async function channelContext(
  deps: ModuleDeps,
  storeId: ID,
  platform: string,
): Promise<ConnectorContext> {
  if (!deps.tokens || !deps.credentials) throw new Error('channel OAuth (tokens/credentials) belum dikonfigurasi');
  const token = await deps.tokens.get(storeId, platform);
  if (!token) throw new Error(`Token not found for ${platform}@${storeId}`);
  return {
    storeId,
    platformAccountId: `${storeId}:${platform}`,
    credentials: await deps.credentials(storeId, platform),
    token,
  };
}