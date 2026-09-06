import * as crypto from 'crypto'
import {
  TikTokCredentials,
  TikTokError,
  TikTokErrorResponse,
  TikTokRequestOptions,
} from './tts.types'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

/** Internal normalized request description for a generated API call. */
export interface ApiCallSpec {
  method: HttpMethod
  path: string
  baseUrl: string
  /** Request params that are sent as query string. */
  query: string[]
  /** Request params sent as headers (e.g. x-tts-access-token, Content-Type). */
  headers: string[]
  /** Path params substituted into `{param}` placeholders. */
  pathParams: string[]
  /** Request Body fields (dot-notation keys). */
  body: string[]
  /** A body example snippet, used to derive a body-only type name. */
  bodyType?: string
}

function toSeconds(value: number | string | Date | undefined): number {
  if (value === undefined) return Math.floor(Date.now() / 1000)
  if (value instanceof Date) return Math.floor(value.getTime() / 1000)
  if (typeof value === 'string' && !/^\d+$/.test(value)) {
    const t = Date.parse(value)
    if (!Number.isNaN(t)) return Math.floor(t / 1000)
  }
  return Math.floor(Number(value))
}

/**
 * Compute the TikTok Shop HMAC-SHA256 signature.
 *
 * 1. Collect all query params (common + business), excluding `sign` and
 *    `access_token`.
 * 2. Sort keys in ASCII ascending order.
 * 3. `signString = apiPath + concatenated(key+value...)`.
 * 4. If a JSON body is present (non-multipart), append the compact JSON body.
 * 5. Wrap with the app_secret: `input = secret + signString + secret`.
 * 6. `sign = hex(HMAC-SHA256(secret, input))`.
 */
export function sign(
  appSecret: string,
  path: string,
  query: Record<string, unknown>,
  body?: string,
): string {
  const keys = Object.keys(query)
    .filter((k) => k !== 'sign' && k !== 'access_token')
    .sort()
  let str = path
  for (const k of keys) {
    const v = query[k]
    if (v === undefined || v === null) continue
    str += k + (typeof v === 'object' ? JSON.stringify(v) : String(v))
  }
  if (body) str += body
  const input = appSecret + str + appSecret
  return crypto.createHmac('sha256', appSecret).update(input).digest('hex')
}

/** Compact deterministic JSON for bodies used in both request + signature. */
export function serializeBody(params: Record<string, unknown>, keys: string[]): string {
  const body: Record<string, unknown> = {}
  for (const k of keys) {
    if (params[k] !== undefined) body[k] = params[k]
  }
  return JSON.stringify(body)
}

export interface TikTokClientConfig {
  credentials: TikTokCredentials
  /** Default access_token sent as `x-tts-access-token`. */
  accessToken?: string
  /** Default shop_cipher for shop-scoped calls. */
  shopCipher?: string
  /** Custom fetch impl (defaults to globalThis.fetch). */
  fetch?: typeof fetch
  /** Throw on non-2xx HTTP response (default false). */
  throwOnHttpError?: boolean
  /**
   * Optional hook invoked at the start of every `request()`. The connector uses
   * this to check token expiry and auto-refresh (single-flight) before a call.
   */
  beforeRequest?: () => Promise<void>
}

/**
 * Low-level HTTP client for the TikTok Shop Open Platform API.
 *
 * Handles base-URL resolution, HMAC-SHA256 signing, common-parameter
 * injection (app_key, timestamp, sign, shop_cipher) and JSON unwrapping.
 * Category clients and generated per-API methods are built on top of this.
 */
export class TikTokClient {
  private readonly credentials: TikTokCredentials
  private defaults: { accessToken?: string; shopCipher?: string }
  private readonly fetchImpl: typeof fetch
  private readonly throwOnHttpError: boolean
  private readonly beforeRequest?: () => Promise<void>

  constructor(cfg: TikTokClientConfig) {
    this.credentials = cfg.credentials
    this.defaults = {
      ...(cfg.accessToken !== undefined ? { accessToken: cfg.accessToken } : {}),
      ...(cfg.shopCipher !== undefined ? { shopCipher: cfg.shopCipher } : {}),
    }
    this.fetchImpl = cfg.fetch ?? (globalThis as any).fetch
    this.throwOnHttpError = cfg.throwOnHttpError ?? false
    if (cfg.beforeRequest !== undefined) this.beforeRequest = cfg.beforeRequest
    if (typeof this.fetchImpl !== 'function') {
      throw new Error(
        'Fetch is not available. Use Node 18+ or supply a `fetch` implementation in the client config.',
      )
    }
  }

  /**
   * Update the default access_token/shop_cipher at runtime (used by the
   * connector after an auto-refresh so subsequent calls sign with the fresh
   * token + send the fresh `x-tts-access-token` header).
   * Hanya field yang diberikan yang diganti; field lain tidak tersentuh.
   */
  updateToken(accessToken?: string, shopCipher?: string): void {
    const next = { ...this.defaults }
    if (accessToken !== undefined) next.accessToken = accessToken
    if (shopCipher !== undefined) next.shopCipher = shopCipher
    this.defaults = next
  }

  /**
   * Perform a signed request.
   *
   * @param spec    The generated API call specification.
   * @param params  Flat map of the API's own request parameters.
   * @param opts    Per-call overrides (access_token, shop_cipher, ...).
   */
  async request(
    spec: ApiCallSpec,
    params: Record<string, unknown>,
    opts: TikTokRequestOptions = {},
  ): Promise<any> {
    await this.beforeRequest?.()
    const accessToken = opts.access_token ?? this.defaults.accessToken
    const shopCipher = opts.shop_cipher ?? this.defaults.shopCipher
    const timestamp = toSeconds(opts.timestamp)
    const baseUrl = opts.baseUrl ?? spec.baseUrl

    // Substitute path params into the path.
    let path = spec.path
    for (const p of spec.pathParams) {
      const v = params[p]
      if (v !== undefined && v !== null) path = path.replace(`{${p}}`, String(v))
    }

    // Build query params (common + business).
    const query: Record<string, any> = {
      app_key: this.credentials.app_key,
      timestamp: String(timestamp),
    }
    for (const k of spec.query) {
      const v = params[k]
      if (v !== undefined && v !== null) {
        query[k] = typeof v === 'object' ? JSON.stringify(v) : v
      }
    }
    if (shopCipher !== undefined) query.shop_cipher = shopCipher

    // Build body (if any).
    let body: string | undefined
    if (spec.body.length) body = serializeBody(params, spec.body)

    // Sign (body included for non-multipart JSON).
    query.sign = sign(this.credentials.app_secret, spec.path, query, body)

    const search = new URLSearchParams()
    for (const [k, v] of Object.entries(query)) search.set(k, String(v))

    const url = `${baseUrl}${path}?${search.toString()}`

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    for (const h of spec.headers) {
      const v = params[h]
      if (v !== undefined && v !== null) headers[h] = String(v)
    }
    if (accessToken !== undefined) headers['x-tts-access-token'] = accessToken

    const init: RequestInit = {
      method: spec.method,
      headers,
      ...(opts.signal !== undefined ? { signal: opts.signal } : {}),
    }
    if (body !== undefined && !['GET'].includes(spec.method)) {
      init.body = body
    }

    let res: Response
    try {
      res = await this.fetchImpl(url, init)
    } catch (e: any) {
      throw new TikTokError(`Network error: ${e?.message ?? e}`, { body: e })
    }

    const text = await res.text()
    let json: any
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = { code: 'invalid_json', message: text }
    }

    if (!res.ok && this.throwOnHttpError) {
      throw new TikTokError(json?.message || `HTTP ${res.status}`, {
        code: json?.code,
        requestId: json?.request_id,
        status: res.status,
        body: json,
      })
    }

    const errBody = json as TikTokErrorResponse | null
    if (errBody && errBody.code !== undefined && Number(errBody.code) !== 0) {
      throw new TikTokError(errBody.message || String(errBody.code), {
        code: errBody.code,
        ...(errBody.request_id !== undefined ? { requestId: errBody.request_id } : {}),
        status: res.status,
        body: json,
      })
    }

    return json
  }
}
