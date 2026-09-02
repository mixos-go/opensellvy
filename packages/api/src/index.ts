import { serve, type ServerType } from '@hono/node-server';
import type { Services } from '@opensellvy/module';
import type { ConnectorRegistry } from '@opensellvy/connector';
import type { AuthService } from '@opensellvy/core';
import { buildApp } from './rest/router';
import type { ApiContext } from './context';


export type { ApiContext } from './context';
export * from './errors';
export * from './middleware/auth.middleware';
export { buildApp } from './rest/router';
export { cors } from './middleware/cors';
export { rateLimit } from './middleware/rate-limit';
export { bearerAuth } from './middleware/auth.middleware';
export type { AuthUser } from './env';

function buildSecrets(config: ApiConfig): Pick<ApiContext, 'secrets'> {
  const secret: ApiContext['secrets'] = {};
  if (config.jwtSecret !== undefined) secret.jwtSecret = config.jwtSecret;
  if (config.webhookSecrets !== undefined) secret.webhook = config.webhookSecrets;
  return Object.keys(secret).length ? { secrets: secret } : {};
}

export interface ApiConfig {
  port?: number;
  host?: string;
  corsOrigin?: string | string[];
  jwtSecret?: string;
  webhookSecrets?: Record<string, string>;
  /** 'closed' (default): semua /api wajib bearer token; 'open': mode dev tanpa auth. */
  authMode?: 'closed' | 'open';
}

export interface ApiDeps {
  services: Services;
  registry: ConnectorRegistry;
  tokens?: ApiContext['tokens'];
  credentials?: ApiContext['credentials'];
  /** dispatch webhook terverifikasi ke lapisan aplikasi (sync/event/worker). */
  onWebhook?: ApiContext['onWebhook'];
  /** core/auth: login/refresh/logout via route + bearer JWT verification. */
  authService?: AuthService;
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
    authMode: config.authMode ?? 'closed',
    ...(deps.tokens !== undefined ? { tokens: deps.tokens } : {}),
    ...(deps.credentials !== undefined ? { credentials: deps.credentials } : {}),
    ...(deps.onWebhook !== undefined ? { onWebhook: deps.onWebhook } : {}),
    ...(deps.authService !== undefined ? { authService: deps.authService } : {}),
    ...(buildSecrets(config)),
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
