import { createAuthApp, createDatabase } from './index';

const cfg = {
  port: Number(process.env.AUTH_PORT ?? 4100),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET ?? 'dev-insecure-secret',
  ...(process.env.AUTH_ISSUER ? { issuer: process.env.AUTH_ISSUER } : {}),
  ...(process.env.AUTH_AUDIENCE ? { audience: process.env.AUTH_AUDIENCE } : {}),
};

const sso = createAuthApp(
  cfg.databaseUrl
    ? { ...cfg, databaseUrl: cfg.databaseUrl }
    : { port: cfg.port, jwtSecret: cfg.jwtSecret, ...(cfg.issuer ? { issuer: cfg.issuer } : {}), ...(cfg.audience ? { audience: cfg.audience } : {}) },
);

if (cfg.databaseUrl) sso.useDb(createDatabase(cfg.databaseUrl));

sso.start().then(({ port }) => console.log(`[apps/auth] SSO listening on :${port}`));
