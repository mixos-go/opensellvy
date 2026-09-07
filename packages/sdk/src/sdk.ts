import { connectors } from '@opensellvy/connector';
import type { ConnectorRegistry } from '@opensellvy/connector';
import { createServices } from '@opensellvy/module';
import { createMemoryRepositories } from '@opensellvy/module';
import type { Services, ModuleDeps, Repositories } from '@opensellvy/module';
import type { AuthService, RefreshSessionStore } from '@opensellvy/core';
import type { OpenSellvyConfig } from './config';
import type { PlatformCode } from '@opensellvy/types';
import { OpenSellvyError } from './errors';
import { buildAuthService, createMemorySessionStore } from './auth';

type RepositoryProvider = Repositories | (() => Promise<Repositories>);

export interface OpenSellvyOptions {
  /**
   * Storage ports. Bisa berupa objek Repositories, atau factory async
   * (dipakai untuk membangun Postgres repos secara lazy dari databaseUrl).
   * Default: config.databaseUrl ? Postgres : in-memory.
   */
  repositories?: RepositoryProvider;
  /** Session store untuk core/auth (default: memory, atau Postgres bila databaseUrl). */
  authSessions?: RefreshSessionStore;
  tokens?: ModuleDeps['tokens'];
  events?: ModuleDeps['events'];
  credentials?: ModuleDeps['credentials'];
  logger?: ModuleDeps['logger'];
}

export class OpenSellvy {
  private services: Services | undefined;
  private repositories: Repositories | undefined;
  private authService: AuthService | undefined;

  constructor(
    private readonly config: OpenSellvyConfig,
    private readonly options: OpenSellvyOptions = {},
  ) {}

  /** Build (jika belum) dan kembalikan service layer. Async karena repo Postgres dibangun lazy. */
  async open(): Promise<Services> {
    if (this.services) return this.services;
    this.services = await this.buildServices();
    return this.services;
  }

  /** Service layer (sync). Hanya valid setelah `await open()`. */
  get modules(): Services {
    if (!this.services) throw new OpenSellvyError('SDK_NOT_OPENED', 'Panggil await sdk.open() sebelum akses .modules');
    return this.services;
  }

  get connectors(): ConnectorRegistry {
    return connectors;
  }

  /**
   * core/auth AuthService — dipakai oleh `createServer({ authService })` utk
   * login/refresh/logout + verifikasi bearer JWT. Butuh `config.auth.jwtSecret`.
   * findUserByEmail/getMemberRole dari repos (users/members); session store default
   * memory, atau Postgres (`createPgRefreshSessionStore`) bila config.databaseUrl.
   */
  get auth(): Promise<AuthService> {
    if (this.authService) return Promise.resolve(this.authService);
    if (!this.config.auth?.jwtSecret) {
      return Promise.reject(
        new OpenSellvyError('AUTH_NOT_CONFIGURED', 'Setel config.auth.jwtSecret sebelum akses sdk.auth'),
      );
    }
    return this.initAuth();
  }

  private async initAuth(): Promise<AuthService> {
    await this.open();
    const config = this.config.auth!;
    const repos = this.repositories!;
    const sessions =
      this.options.authSessions ??
      (this.config.databaseUrl ? await this.pgSessionStore() : createMemorySessionStore());
    this.authService = buildAuthService(config, repos, sessions);
    return this.authService;
  }

  private async buildServices(): Promise<Services> {
    const credentials = this.options.credentials ?? this.defaultCredentials();
    const provider = this.options.repositories ?? this.defaultRepositoryProvider();
    const repositories = provider
      ? typeof provider === 'function'
        ? await provider()
        : provider
      : createMemoryRepositories();
    this.repositories = repositories;
    return createServices({
      deps: {
        registry: this.connectors,
        ...(this.options.tokens !== undefined ? { tokens: this.options.tokens } : {}),
        ...(credentials !== undefined ? { credentials } : {}),
        ...(this.options.events !== undefined ? { events: this.options.events } : {}),
        ...(this.options.logger !== undefined ? { logger: this.options.logger } : {}),
      },
      repositories,
    });
  }

  private async pgSessionStore(): Promise<RefreshSessionStore> {
    const url = this.config.databaseUrl;
    try {
      // @ts-expect-error runtime-only optional dep — resolved at runtime from consumer's node_modules
      const { Pool } = await import('pg');
      // @ts-expect-error runtime-only optional dep
      const { drizzle } = await import('drizzle-orm/node-postgres');
      const { createPgRefreshSessionStore } = await import('@opensellvy/db-pg');
      const { schema } = await import('@opensellvy/db');
      const pool = new Pool({ connectionString: url });
      return createPgRefreshSessionStore(drizzle(pool, { schema }) as never);
    } catch (err) {
      throw new OpenSellvyError(
        'AUTH_SESSION_STORE_UNAVAILABLE',
        'Gagal build Postgres session store — pastikan @opensellvy/db-pg, pg, dan drizzle-orm terpasang.',
        { error: (err as Error).message },
      );
    }
  }

  private defaultRepositoryProvider(): RepositoryProvider | undefined {
    if (!this.config.databaseUrl) return undefined;
    const url = this.config.databaseUrl;
    return async () => {
      try {
        // @ts-expect-error runtime-only optional dep — resolved at runtime from consumer's node_modules
        const { Pool } = await import('pg');
        // @ts-expect-error runtime-only optional dep
        const { drizzle } = await import('drizzle-orm/node-postgres');
        const { createPostgresRepositories } = await import('@opensellvy/db-pg');
        const { schema } = await import('@opensellvy/db');
        const pool = new Pool({ connectionString: url });
        return createPostgresRepositories(drizzle(pool, { schema }) as never);
      } catch (err) {
        throw new OpenSellvyError(
          'REPO_FACTORY_UNAVAILABLE',
          'Gagal build Postgres repositories — pastikan @opensellvy/db-pg, pg, dan drizzle-orm terpasang.',
          { error: (err as Error).message },
        );
      }
    };
  }

  private defaultCredentials(): ModuleDeps['credentials'] {
    return async (_storeId, platform) => {
      const pc = this.config.platforms?.[platform as PlatformCode];
      if (!pc) throw new Error(`Platform config "${platform}" tidak ada di config.platforms`);
      return {
        appId: pc.appId,
        secret: pc.secret,
        redirectUri: pc.redirectUri,
        ...(pc.sandbox !== undefined ? { sandbox: pc.sandbox } : {}),
        ...(pc.baseUrl !== undefined ? { baseUrl: pc.baseUrl } : {}),
        ...(pc.shopId !== undefined ? { shopId: pc.shopId } : {}),
      };
    };
  }
}