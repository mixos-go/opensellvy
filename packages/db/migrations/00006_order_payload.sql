-- 00006_order_payload.sql
-- orders mendapat channel_id + payload (aggregate utuh) + paid_at (analitik).
-- Kolom lama (total/items/raw) tetap dipertahankan untuk kompatibilitas.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS channel_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payload JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;