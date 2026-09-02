import { createHmac } from 'node:crypto';
import { HttpClient, HttpError } from '@opensellvy/core';
import type { PlatformCredentials } from '@opensellvy/connector';

/**
 * Endpoint & parameter bersama Shopee Open API v2.0.
 * - Shop API   base string: partner_id + path + timestamp + access_token + shop_id
 * - Public API base string: partner_id + path + timestamp
 * Signature = HMAC-SHA256(base string, partner_key) → hex.
 * Lihat: https://open.shopee.com/developer-guide/16
 */

const DEFAULT_BASE_URL = 'https://partner.shopeemobile.com';

/** JSON boilerplate response Shopee — `error` kosong = sukses. */
export interface ShopeeResponse<T> {
  request_id?: string;
  error: string;
  message?: string;
  response?: T;
  /** detail error tambahan (shield)_ reclaim dsb */
  detail?: unknown;
}

export class ShopeeApiError extends Error {
  readonly code: string;
  readonly requestId?: string;

  constructor(message: string, code: string, requestId?: string) {
    super(message);
    this.name = 'ShopeeApiError';
    this.code = code;
    if (requestId) this.requestId = requestId;
  }
}

export interface ShopeeClientOptions {
  credentials: PlatformCredentials;
  /** injeksi fetch untuk test. */
  fetch?: typeof fetch;
  /** injeksi timestamp (detik) utk test signing deterministik. */
  now?: () => number;
  timeoutMs?: number;
}

export type ShopeeApiType = 'public' | 'shop';

export interface ShopeeRequest {
  apiType: ShopeeApiType;
  /** path API tanpa host & tanpa query, mis /api/v2/order/get_order_detail */
  path: string;
  method: 'GET' | 'POST';
  /** parameter request — utk GET dimasukkan ke query string, utk POST ke body JSON. */
  params?: Record<string, unknown>;
}

/**
 * Client low-level Shopee: menangani signing HMAC-SHA256 + common parameter
 * (partner_id, timestamp, access_token, shop_id, sign) + normalisasi error.
 */
export class ShopeeClient {
  private readonly credentials: PlatformCredentials;
  private readonly http: HttpClient;
  private readonly nowFn: () => number;
  private readonly timeoutMs: number;

  constructor(opts: ShopeeClientOptions) {
    this.credentials = opts.credentials;
    this.timeoutMs = opts.timeoutMs ?? 10_000;
    this.nowFn = opts.now ?? (() => Math.floor(Date.now() / 1000));
    const baseUrl = (this.credentials.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.http = new HttpClient({
      baseUrl,
      timeoutMs: this.timeoutMs,
      ...(opts.fetch ? { fetch: opts.fetch } : {}),
    });
  }

  get baseUrl(): string {
    return (this.credentials.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
  }

  get partnerId(): string {
    return this.credentials.appId;
  }

  get partnerKey(): string {
    return this.credentials.secret;
  }

  /** timestamp (detik) saat ini — public agar bisa dipakai ulang untuk signing URL. */
  now(): number {
    return this.nowFn();
  }

  /**
   * Hitung base string signature Shopee.
   * Shop API: `partner_id + path + timestamp + access_token + shop_id`
   * Public:  `partner_id + path + timestamp`
   */
  buildBaseString(req: Pick<ShopeeRequest, 'apiType' | 'path'>, timestamp: number, accessToken?: string, shopId?: string): string {
    if (req.apiType === 'public') {
      return `${this.partnerId}${req.path}${timestamp}`;
    }
    return `${this.partnerId}${req.path}${timestamp}${accessToken ?? ''}${shopId ?? ''}`;
  }

  sign(req: Pick<ShopeeRequest, 'apiType' | 'path'>, timestamp: number, accessToken?: string, shopId?: string): string {
    const base = this.buildBaseString(req, timestamp, accessToken, shopId);
    return createHmac('sha256', this.partnerKey).update(base).digest('hex');
  }

  /** URL authorize flow — pakai endpoint public yang sesuai baseUrl. */
  authorizePath(): string {
    return '/api/v2/shop/auth_partner';
  }

  async request<T>(req: ShopeeRequest, opts: { accessToken?: string; shopId?: string; apiType?: ShopeeApiType } = {}): Promise<T> {
    const timestamp = this.now();
    const apiType = opts.apiType ?? req.apiType;
    const accessToken = opts.accessToken;
    const shopId = opts.shopId ?? this.credentials.shopId;
    const sign = this.sign(req, timestamp, accessToken, shopId);

    const common: Record<string, string> = {
      partner_id: this.partnerId,
      timestamp: String(timestamp),
    };
    if (apiType === 'shop') {
      if (accessToken) common.access_token = accessToken;
      if (shopId) common.shop_id = shopId;
    }
    common.sign = sign;

    const query: Record<string, string> = { ...common };
    for (const [k, v] of Object.entries(req.params ?? {})) query[k] = String(v);

    let response: Awaited<ReturnType<HttpClient['request']>>;
    try {
      if (req.method === 'GET') {
        response = await this.http.get<unknown>(req.path, { query });
      } else {
        response = await this.http.post<unknown>(req.path, { query, body: req.params ?? {} });
      }
    } catch (err) {
      if (err instanceof HttpError) {
        throw new ShopeeApiError(`Shopee API ${req.method} ${req.path} gagal (HTTP ${err.status})`, 'http.error');
      }
      throw err;
    }

    const raw = response.data as ShopeeResponse<T> | undefined;
    if (raw && raw.error) {
      throw new ShopeeApiError(
        `Shopee error di ${req.path}: ${raw.error}${raw.message ? ` — ${raw.message}` : ''}`,
        raw.error,
        raw.request_id,
      );
    }
    return (raw?.response ?? (raw as unknown as T)) as T;
  }
}