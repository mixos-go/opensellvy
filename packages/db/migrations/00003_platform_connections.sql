-- 00003_platform_connections.sql
-- Platform OAuth connections & tokens

CREATE TABLE IF NOT EXISTS platform_accounts (
  id             TEXT PRIMARY KEY,
  store_id       TEXT NOT NULL REFERENCES stores(id),
  platform       TEXT NOT NULL,
  shop_id        TEXT NOT NULL,
  shop_name      TEXT NOT NULL,
  auth_state     TEXT NOT NULL DEFAULT 'connected',
  scopes         JSONB NOT NULL DEFAULT '[]',
  marketplace    TEXT NOT NULL DEFAULT 'ID',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, platform, shop_id)
);

CREATE TABLE IF NOT EXISTS platform_tokens (
  id                   TEXT PRIMARY KEY,
  platform_account_id  TEXT NOT NULL REFERENCES platform_accounts(id),
  access_token_enc     TEXT NOT NULL,
  refresh_token_enc    TEXT NOT NULL,
  expires_at           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
