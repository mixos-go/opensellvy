import { mailgunMailer } from '@opensellvy/core';
import { createAuthApp, createDatabase } from './index';
import type { AuthAppConfig } from './index';

const cfg: AuthAppConfig = {
  port: Number(process.env.AUTH_PORT ?? 4100),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-insecure-secret',
  ...(process.env.DATABASE_URL ? { databaseUrl: process.env.DATABASE_URL } : {}),
  ...(process.env.AUTH_ISSUER ? { issuer: process.env.AUTH_ISSUER } : {}),
  ...(process.env.AUTH_AUDIENCE ? { audience: process.env.AUTH_AUDIENCE } : {}),
  ...(process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === 'true' ? { requireEmailVerification: true } : {}),
};

// Email via Mailgun HTTP API — bukan SMTP self-host / port 25.
if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN && process.env.MAILGUN_FROM) {
  cfg.mailer = mailgunMailer({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
    from: process.env.MAILGUN_FROM,
    ...(process.env.MAILGUN_REGION === 'eu' ? { region: 'eu' as const } : {}),
  });
}

// Google login (OIDC). Diaktifkan hanya bila semua variabel ada.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI) {
  cfg.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  };
}

const sso = createAuthApp(cfg);
if (cfg.databaseUrl) sso.useDb(createDatabase(cfg.databaseUrl));

sso.start().then(({ port }) => console.log(`[apps/auth] SSO listening on :${port}`));