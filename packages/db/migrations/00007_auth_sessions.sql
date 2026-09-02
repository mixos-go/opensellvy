-- 00007_auth_sessions.sql
-- Lengkapi refresh_tokens untuk core/auth session (rotation & revoke).
-- email/role di-denormalisasi agar rotation bisa menerbitkan token baru
-- tanpa re-lookup user; store_id opsional utk session issuer-scope.

ALTER TABLE refresh_tokens
  ADD COLUMN IF NOT EXISTS email       TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS store_id    TEXT REFERENCES stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS role        TEXT NOT NULL DEFAULT 'owner';

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
