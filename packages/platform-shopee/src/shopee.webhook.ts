import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PlatformWebhookHandler } from '@opensellvy/connector';

export interface ShopeeWebhookOptions {
  partnerKey: string;
  baseUrl: string;
}

interface NormalizedBody {
  code?: number;
  data?: unknown;
  msg?: string;
  request_id?: string;
  type?: string;
}

type NormalizedEvent =
  | { type: 'order.updated'; data: unknown }
  | { type: 'order.status_changed'; data: unknown }
  | { type: 'product.updated'; data: unknown }
  | { type: 'return.updated'; data: unknown };
type GlobalEvent = { type: string; data: unknown };

/**
 * Webhook Shopee: header request berisi `Authorization` / `Signature` —
 * kita bandingkan terhadap HMAC-SHA256(branch_id + body) atau digest raw body
 * menggunakan partner_key, dengan perbandingan timing-safe.
 * verifier menerima signature string apa pun yang dikirim platform.
 */
export function createShopeeWebhook(opts: ShopeeWebhookOptions): PlatformWebhookHandler {
  const verifyHmac = (body: string, signature: string, secret: string): boolean => {
    try {
      const expected = createHmac('sha256', secret).update(body).digest('hex');
      const a = Buffer.from(signature);
      const b = Buffer.from(expected);
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  };

  return {
    async verify(payload, signature) {
      if (!signature) return false;
      const rawBody = typeof payload === 'string' ? payload : JSON.stringify(payload ?? {});
      return verifyHmac(rawBody, signature, opts.partnerKey);
    },

    async map(event, payload) {
      const body = (payload ?? {}) as NormalizedBody;
      const evtType = body.type ?? event ?? 'unknown';
      const data = body.data ?? payload;

      const normalized: GlobalEvent | NormalizedEvent = { type: evtType.toLowerCase(), data };

      // normalkan tipe event yang umum dari Shopee
      if (/(order_update|order_status)/i.test(evtType)) {
        return {
          type: /status/i.test(evtType) ? 'order.status_changed' : 'order.updated',
          data,
        };
      }
      if (/product/i.test(evtType)) {
        return { type: 'product.updated', data };
      }
      if (/return|refund/i.test(evtType)) {
        return { type: 'return.updated', data };
      }
      return normalized;
    },
  };
}
