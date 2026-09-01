-- 00004_orders.sql
-- Order & fulfillment tables

CREATE TABLE IF NOT EXISTS orders (
  id                  TEXT PRIMARY KEY,
  store_id            TEXT NOT NULL REFERENCES stores(id),
  platform            TEXT NOT NULL,
  platform_order_id   TEXT NOT NULL,
  marketplace_order_id TEXT,
  order_number        TEXT NOT NULL,
  customer_id         TEXT,
  status              TEXT NOT NULL,
  sub_status          TEXT,
  total               JSONB NOT NULL,
  items               JSONB NOT NULL,
  raw                 JSONB NOT NULL DEFAULT '{}',
  synced_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, platform, platform_order_id)
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_platform ON orders(platform, synced_at);
