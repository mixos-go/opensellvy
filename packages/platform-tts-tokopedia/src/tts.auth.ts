import { TikTokCredentials } from './tts.types'

/**
 * Host halaman authorize (browser redirect) — TIDAK sama dengan host API.
 * Verified live (2026-09): hanya `services.tiktokshop.com` yang menerima
 * entry authorize; `/authorization/202309/authorize` di open-api menolak
 * dengan `36009009 Invalid path`.
 */
const AUTH_BASE = 'https://services.tiktokshop.com'
const AUTH_ENTRY = '/open/authorize'

/**
 * Host API token (OAuth) — terpisah dari host Open API.
 * Verified live: `/api/v2/token/get` & `/api/v2/token/refresh` valid;
 * `/authorization/202309/token` di open-api menolak (36009009).
 */
const TOKEN_BASE = 'https://auth.tiktok-shops.com'
const TOKEN_GET = '/api/v2/token/get'
const TOKEN_REFRESH = '/api/v2/token/refresh'

export interface TikTokAuthUrlOptions {
  /** Override base host (testing). */
  baseUrl?: string
  /** Opaque state, dipantulkan kembali dalam callback (`code` + `state`). */
  state?: string
}

export interface TokenExchangeOptions {
  /** Override base host (testing). */
  baseUrl?: string
  /** Custom fetch impl (defaults to globalThis.fetch). */
  fetch?: typeof fetch
}

/**
 * Response token ter-struktur dari endpoint OAuth TikTok Shop
 * (`auth.tiktok-shops.com/api/v2/token/*`). Payload di `data`;
 * bila `code !== 0` artinya gagal.
 */
export interface TokenResponse {
  code?: number | string
  message?: string
  request_id?: string
  data?: {
    access_token?: string
    refresh_token?: string
    /** Sisa umur access token (detik). */
    access_token_expire_in?: number
    /** Sisa umur refresh token (detik). */
    refresh_token_expire_in?: number
    open_id?: string
    seller_name?: string
    /** Identifier shop (cross-border/multi-shop) — bila ada di respons. */
    shop_cipher?: unknown
    granted_scopes?: unknown
    [key: string]: unknown
  }
}

/**
 * Build a TikTok Shop seller authorization URL (browser redirect).
 *
 * Tanpa sign — entry halaman authorize menerima `app_key` langsung
 * (verified live: HTTP 200 untuk app_key nyata). Setelah seller menyetujui,
 * TikTok redirect ke callback membawa `code` + `state`; tukar `code` via
 * `exchangeAuthCode`.
 */
export function buildAuthUrl(
  credentials: TikTokCredentials,
  redirectUrl: string,
  opts: TikTokAuthUrlOptions = {},
): string {
  const query: Record<string, string> = {
    app_key: credentials.app_key,
    path: redirectUrl,
    ...(opts.state !== undefined && opts.state !== '' ? { state: opts.state } : {}),
  }
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) search.set(k, v)
  return `${opts.baseUrl ?? AUTH_BASE}${AUTH_ENTRY}?${search.toString()}`
}

/**
 * Exchange an authorization `code` (returned to your callback) for an
 * access_token + refresh_token via the TikTok Shop token `GET` API.
 *
 * Params DI URL (bukan sign HMAC): `app_key`, `app_secret`, `auth_code`,
 * `grant_type=authorized_code` (persis — bukan `authorization_code`).
 */
export async function exchangeAuthCode(
  credentials: TikTokCredentials,
  code: string,
  opts: TokenExchangeOptions = {},
): Promise<TokenResponse> {
  const query: Record<string, string> = {
    app_key: credentials.app_key,
    app_secret: credentials.app_secret,
    auth_code: code,
    grant_type: 'authorized_code',
  }
  return tokenRequest(`${opts.baseUrl ?? TOKEN_BASE}${TOKEN_GET}`, query, opts.fetch)
}

/**
 * Refresh the access token via `grant_type=refresh_token`.
 * Access token TTS ~7 hari — refresh sebelum/ketika menjakati kedaluwarsa.
 */
export async function refreshAccessToken(
  credentials: TikTokCredentials,
  refreshToken: string,
  opts: TokenExchangeOptions = {},
): Promise<TokenResponse> {
  const query: Record<string, string> = {
    app_key: credentials.app_key,
    app_secret: credentials.app_secret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  }
  return tokenRequest(`${opts.baseUrl ?? TOKEN_BASE}${TOKEN_REFRESH}`, query, opts.fetch)
}

async function tokenRequest(
  url: string,
  query: Record<string, string>,
  fetchImpl?: typeof fetch,
): Promise<TokenResponse> {
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) search.set(k, v)
  const fn = fetchImpl ?? (globalThis as { fetch: typeof fetch }).fetch
  const res = await fn(`${url}?${search.toString()}`, { method: 'GET' })
  const text = await res.text()
  let json: TokenResponse | null
  try {
    json = text ? (JSON.parse(text) as TokenResponse) : null
  } catch {
    json = { code: 'invalid_json', message: text } as TokenResponse
  }
  return json ?? {}
}