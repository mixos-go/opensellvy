import { createServer } from '@opensellvy/api';
import type { OpenSellvyServer } from '@opensellvy/api';
import { createAuthService } from '@opensellvy/core';
import { createPgAuthDeps } from '@opensellvy/db-pg';
import { registerLocal } from '@opensellvy/platform-local';
import { createDatabase } from './db';
import type { Db } from './db';

registerLocal();

export interface ServerAppConfig {
  port?: number;
  host?: string;
  databaseUrl: string;
  jwtSecret: string;
  corsOrigin?: string | string[];
  authMode?: 'closed' | 'open';
  webhookSecrets?: Record<string, string>;
}

export interface ServerApp {
  server: OpenSellvyServer;
  start(): Promise<{ port: number }>;
  stop(): Promise<void>;
}

/**
 * apps/server — backend server OMS.
 * SSO satu pintu: JWT yang diterbitkan apps/auth (dgn shared jwtSecret + DB yang
 * sama) diverifikasi di sini lewat createAuthService(createPgAuthDeps(...)).
 */
export async function buildServerApp(config: ServerAppConfig): Promise<ServerApp> {
  const db = createDatabase(config.databaseUrl);
  const authService = createAuthService(createPgAuthDeps(db, config.jwtSecret));

  const { OpenSellvy } = await import('@opensellvy/sdk');
  const sdk = new OpenSellvy({ databaseUrl: config.databaseUrl });
  await sdk.open();

  const server = createServer(
    {
      port: config.port ?? 4200,
      ...(config.host !== undefined ? { host: config.host } : {}),
      jwtSecret: config.jwtSecret,
      ...(config.corsOrigin !== undefined ? { corsOrigin: config.corsOrigin } : {}),
      authMode: config.authMode ?? 'closed',
      ...(config.webhookSecrets !== undefined ? { webhookSecrets: config.webhookSecrets } : {}),
    },
    { services: sdk.modules, registry: sdk.connectors, authService },
  );

  return {
    server,
    async start() {
      return server.start();
    },
    async stop() {
      await server.stop();
    },
  };
}

export { createDatabase };
export type { Db };
