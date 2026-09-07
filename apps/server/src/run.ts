import { buildServerApp } from './index';

const cfg = {
  port: Number(process.env.SERVER_PORT ?? 4200),
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://localhost/opensellvy',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-insecure-secret',
  ...(process.env.CORS_ORIGIN ? { corsOrigin: process.env.CORS_ORIGIN.split(',') } : {}),
  ...(process.env.AUTH_MODE ? { authMode: process.env.AUTH_MODE as 'closed' | 'open' } : {}),
};

buildServerApp(cfg)
  .then((app) => app.start())
  .then(({ port }) => console.log(`[apps/server] OMS listening on :${port}`))
  .catch((err) => {
    console.error('[apps/server] gagal start:', err);
    process.exit(1);
  });
