import { connectors } from '@opensellvy/connector';
import type { ConnectorRegistry } from '@opensellvy/connector';
import { createServices } from '@opensellvy/module';
import type { Services, ModuleDeps } from '@opensellvy/module';
import type { OpenSellvyConfig } from './config';
import type { PlatformCode } from '@opensellvy/types';
import { OpenSellvyError } from './errors';

type Repositories = ModuleDeps['repos'];
type RepositoryProvider = Repositories | (() => Promise<Repositories>);

export interface OpenSellvyOptions {
  /**
   * Storage ports. Bisa berupa objek Repositories, atau factory async
   * (dipakai untuk membangun Postgres repos secara lazy dari databaseUrl).
   * Default: config.databaseUrl ? Postgres : in-memory.
   */
  repositories?: RepositoryProvider;
  tokens?: ModuleDeps['tokens'];
  events?: ModuleDeps['events'];
  credentials?: ModuleDeps['credentials'];
  logger?: ModuleDeps['logger'];
}

export class OpenSellvy {
  private services: Services | undefined;

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

  private async buildServices(): Promise<Services> {
    const credentials = this.options.credentials ?? this.defaultCredentials();
    let repositories: Repositories | undefined;
    const provider = this.options.repositories ?? this.defaultRepositoryProvider();
    if (provider) {
      repositories = typeof provider === 'function' ? await provider() : provider;
    }
    return createServices({
      deps: {
        registry: this.connectors,
        ...(this.options.tokens !== undefined ? { tokens: this.options.tokens } : {}),
        ...(credentials !== undefined ? { credentials } : {}),
        ...(this.options.events !== undefined ? { events: this.options.events } : {}),
        ...(this.options.logger !== undefined ? { logger: this.options.logger } : {}),
      },
      ...(repositories !== undefined ? { repositories } : {}),
    });
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