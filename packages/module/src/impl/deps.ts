import type { ID, ISO8601 } from '@opensellvy/types';
import type {
  ConnectorRegistry,
  TokenStore,
  PlatformCredentials,
  ConnectorContext,
  PlatformPlugin,
  OAuthToken,
} from '@opensellvy/connector';
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

/** Bangun ConnectorContext per (storeId, platform) dari token tersimpan + credential store.
 *  Menjalankan lazy refresh bila token hampir/sudah kedaluwarsa. */
export async function channelContext(
  deps: ModuleDeps,
  storeId: ID,
  platform: string,
): Promise<ConnectorContext> {
  if (!deps.tokens || !deps.credentials) throw new Error('channel OAuth (tokens/credentials) belum dikonfigurasi');
  const plugin = deps.registry.get(platform as never);
  if (!plugin) throw new Error(`Platform "${platform}" not registered`);

  let token = await deps.tokens.get(storeId, platform);
  if (!token) throw new Error(`Token not found for ${platform}@${storeId}`);

  if (isTokenExpired(token)) {
    token = await refreshAndPersist(deps, plugin, storeId, platform);
  }

  return {
    storeId,
    platformAccountId: `${storeId}:${platform}`,
    credentials: await deps.credentials(storeId, platform),
    token,
  };
}

/** Token fresh jika tidak ada expiresAt, atau masih lebih dari REFRESH_MARGIN_MS. */
const REFRESH_MARGIN_MS = 60_000;

function isTokenExpired(token: { expiresAt?: number }): boolean {
  if (!token.expiresAt) return false;
  return Date.now() >= token.expiresAt - REFRESH_MARGIN_MS;
}

async function refreshAndPersist(
  deps: ModuleDeps,
  plugin: PlatformPlugin,
  storeId: ID,
  platform: string,
): Promise<OAuthToken> {
  if (!deps.tokens) throw new Error('channel OAuth (tokens) belum dikonfigurasi');
  const credentials = requireCredentials(deps);
  const current = await deps.tokens.get(storeId, platform);
  if (!current) throw new Error(`Token not found for ${platform}@${storeId}`);
  const fresh = await plugin.auth.refreshToken({
    storeId,
    platformAccountId: `${storeId}:${platform}`,
    credentials: await credentials(storeId, platform),
    token: current,
  });
  await deps.tokens.save(storeId, platform, fresh);
  return fresh;
}