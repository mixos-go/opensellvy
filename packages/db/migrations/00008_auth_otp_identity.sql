-- 00008_auth_otp_identity.sql
-- OTP (passwordless/verify_email/2FA) + identitas login eksternal (Google, dll).
-- Prinsip: otp_codes HANYA menyimpan hash kode (code_hash), bukan plaintext.
-- user_social_logins = link provider external ke users internal (auto-link bila
-- email cocok; unique per (provider, provider_user_id)).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS otp_codes (
  email          TEXT NOT NULL,
  purpose        TEXT NOT NULL, -- login | verify_email | 2fa
  code_hash      TEXT NOT NULL,
  expires_at     TIMESTAMPTZ NOT NULL,
  attempts       INTEGER NOT NULL DEFAULT 0,
  request_count  INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  consumed_at    TIMESTAMPTZ,
  PRIMARY KEY (email, purpose)
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);

CREATE TABLE IF NOT EXISTS user_social_logins (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL, -- google
  provider_user_id  TEXT NOT NULL,
  provider_email    TEXT NOT NULL DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_social_logins_user_id ON user_social_logins(user_id);