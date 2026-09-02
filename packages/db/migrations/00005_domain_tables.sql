-- 00005_domain_tables.sql
-- Tabel domain OMS (step 5). Pola: payload JSONB = objek domain utuh (source of truth),
-- kolom queryable = subset yang dipakai filter/lookup repository.

-- users: password_hash menjadi nullable (domain User tidak membawa passwordHash)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

CREATE TABLE IF NOT EXISTS channels (
  id                TEXT PRIMARY KEY,
  store_id          TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  platform          TEXT NOT NULL,
  platform_shop_id  TEXT NOT NULL,
  shop_name         TEXT NOT NULL,
  marketplace       TEXT NOT NULL DEFAULT 'ID',
  scopes            JSONB NOT NULL DEFAULT '[]',
  payload           JSONB NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (platform, platform_shop_id)
);

CREATE TABLE IF NOT EXISTS products (
  id         TEXT PRIMARY KEY,
  store_id   TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'draft', -- draft | active | inactive | deleted
  skus       TEXT[] NOT NULL DEFAULT '{}',
  payload    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);

CREATE TABLE IF NOT EXISTS inventory_items (
  id           TEXT PRIMARY KEY,
  store_id     TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id   TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku          TEXT NOT NULL,
  warehouse_id TEXT NOT NULL,
  available    INTEGER NOT NULL DEFAULT 0,
  reserved     INTEGER NOT NULL DEFAULT 0,
  incoming     INTEGER NOT NULL DEFAULT 0,
  holding      INTEGER NOT NULL DEFAULT 0,
  payload      JSONB NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sku, warehouse_id)
);
CREATE INDEX IF NOT EXISTS idx_inventory_store ON inventory_items(store_id);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id                 TEXT PRIMARY KEY,
  inventory_item_id  TEXT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  type               TEXT NOT NULL, -- in | out | reserve | release | adjust
  quantity           INTEGER NOT NULL,
  reason             TEXT NOT NULL,
  reference_id       TEXT,
  actor_id           TEXT,
  occurred_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_move_item ON inventory_movements(inventory_item_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS customers (
  id         TEXT PRIMARY KEY,
  store_id   TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  tags       TEXT[] NOT NULL DEFAULT '{}',
  payload    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customers_store ON customers(store_id);

CREATE TABLE IF NOT EXISTS customer_profiles (
  customer_id      TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  platform         TEXT NOT NULL,
  platform_user_id TEXT NOT NULL,
  username         TEXT NOT NULL,
  channel_id       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (platform, platform_user_id)
);

CREATE TABLE IF NOT EXISTS warehouses (
  id         TEXT PRIMARY KEY,
  store_id   TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  code       TEXT NOT NULL,
  name       TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  status     TEXT NOT NULL DEFAULT 'active', -- active | inactive
  payload    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, code)
);

CREATE TABLE IF NOT EXISTS returns (
  id            TEXT PRIMARY KEY,
  order_id      TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  channel_id    TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  status        TEXT NOT NULL, -- requested | approved | rejected | picked_up | received | refunded | cancelled
  refund_amount JSONB,
  label         TEXT,
  payload       JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_returns_order ON returns(order_id);

CREATE TABLE IF NOT EXISTS payments (
  id             TEXT PRIMARY KEY,
  order_id       TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method         TEXT NOT NULL,
  status         TEXT NOT NULL,
  amount         JSONB NOT NULL,
  transaction_id TEXT,
  payload        JSONB NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

CREATE TABLE IF NOT EXISTS settlements (
  id         TEXT PRIMARY KEY,
  store_id   TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  platform   TEXT NOT NULL,
  status     TEXT NOT NULL, -- pending | in_transit | settled | disputed | failed
  payload    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_settlements_store ON settlements(store_id, created_at DESC);

CREATE TABLE IF NOT EXISTS promotions (
  id         TEXT PRIMARY KEY,
  store_id   TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  code       TEXT,
  type       TEXT NOT NULL,
  status     TEXT NOT NULL, -- draft | scheduled | active | paused | ended
  start_at   TIMESTAMPTZ,
  end_at     TIMESTAMPTZ,
  payload    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_promotions_store ON promotions(store_id);

CREATE TABLE IF NOT EXISTS shipments (
  id              TEXT PRIMARY KEY,
  order_id        TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  courier         TEXT NOT NULL,
  tracking_number TEXT NOT NULL UNIQUE,
  status          TEXT NOT NULL, -- pending | in_transit | delivered | failed | returned
  payload         JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);

CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  store_id   TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  channel    TEXT NOT NULL, -- email | whatsapp | sms | push
  status     TEXT NOT NULL, -- queued | sent | failed
  payload    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_store ON notifications(store_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audits (
  id         TEXT PRIMARY KEY,
  store_id   TEXT REFERENCES stores(id) ON DELETE SET NULL,
  actor_id   TEXT NOT NULL REFERENCES users(id),
  action     TEXT NOT NULL,
  payload    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audits_store ON audits(store_id, created_at DESC);