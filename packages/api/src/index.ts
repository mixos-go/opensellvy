import { serve, type ServerType } from '@hono/node-server';
import type { Services } from '@opensellvy/module';
import type { ConnectorRegistry } from '@opensellvy/connector';
import { buildApp } from './rest/router';
import type { ApiContext } from './context';
import { ApiError } from './errors';

export type { ApiContext } from './context';
export * from './errors';
export * from './middleware/auth.middleware';
export { buildApp } from './rest/router';
export { cors } from './middleware/cors';
export { rateLimit } from './middleware/rate-limit';
export { bearerAuth } from './middleware/auth.middleware';

export interface ApiConfig {
  port?: number;
  host?: string;
  corsOrigin?: string | string[];
  jwtSecret?: string;
  webhookSecrets?: Record<string, string>;
}

export interface ApiDeps {
  services: Services;
  registry: ConnectorRegistry;
  tokens?: ApiContext['tokens'];
  credentials?: ApiContext['credentials'];
}

export interface OpenSellvyServer {
  app: ReturnType<typeof buildApp>;
  context: ApiContext;
  start(): Promise<{ port: number }>;
  stop(): Promise<void>;
}

/**
 * createServer — komposisi root server HTTP Hono.
 * Layering: Router (buildApp) → Controller → Service (ApiDeps.services) → Repository.
 */
export function createServer(config: ApiConfig = {}, deps: ApiDeps): OpenSellvyServer {
  const context: ApiContext = {
    services: deps.services,
    registry: deps.registry,
    tokens: deps.tokens,
    credentials: deps.credentials,
    secrets: {
      jwtSecret: config.jwtSecret,
      webhook: config.webhookSecrets,
    },
  };
  const app = buildApp(context);
  let server: ServerType | undefined;

  return {
    app,
    context,
    async start() {
      if (server) return { port: config.port ?? 3000 };
      return new Promise((resolve, reject) => {
        try {
          server = serve(
            {
              fetch: app.fetch,
              port: config.port ?? 3000,
              hostname: config.host ?? '0.0.0.0',
            },
            (info) => resolve({ port: info.port }),
          );
        } catch (err) {
          reject(err);
        }
      });
    },
    async stop() {
      if (!server) return;
      await new Promise<void>((resolve) => server?.close(() => resolve()));
      server = undefined;
    },
  };
}
