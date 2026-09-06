import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PlatformWebhookHandler } from '@opensellvy/connector';

export interface TtsWebhookOptions {
  /** app_secret TikTok — dipakai utk verifikasi `X-TTK-SIGN`. */
  appSecret: string;
}

interface WebhookBody {
  event_type?: string;
  sign?: string;
  timestamp?: number | string;
  data?: unknown;
  [key: string]: unknown;
}

type NormalizedEvent =
  | { type: 'order.updated'; data: unknown }
  | { type: 'order.status_changed'; data: unknown }
  | { type: 'product.updated'; data: unknown }
  | { type: 'return.updated'; data: unknown }
  | { type: 'shipment.updated'; data: unknown };
type GlobalEvent = { type: string; data: unknown };

/**
 * Webhook TikTok Shop:
 * - headers `X-TTK-SIGN` + `X-TTK-TIMESTAMP`, body JSON berisi `sign` & `timestamp`.
 * - verifikasi: `expected = hex(HMAC-SHA256(app_secret, xTtkTimestamp + body.sign))`
 *   dibandingkan timing-safe dengan header `X-TTK-SIGN`.
 */
export function createTtsWebhook(opts: TtsWebhookOptions): PlatformWebhookHandler {
  const verify = (bodyText: string, signature: string, tsHeader: string, bodySign: string): boolean => {
    try {
      const expected = createHmac('sha256', opts.appSecret).update(`${tsHeader}${bodySign}`).digest('hex');
      const a = Buffer.from(signature);
      const b = Buffer.from(expected);
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  };

  return {
    /**
     * @param payload raw body (string JSON) atau object.
     * @param signature nilai header `X-TTK-SIGN`.
     */
    async verify(payload, signature) {
      if (!signature) return false;
      const rawBody = typeof payload === 'string' ? payload : JSON.stringify(payload ?? {});
      let body: WebhookBody;
      try {
        body = JSON.parse(rawBody) as WebhookBody;
      } catch {
        body = {};
      }
      // Payload webhook TikTok berisi `timestamp` + `sign`; signature di header
      // `X-TTK-SIGN` = hex(HMAC-SHA256(app_secret, timestamp + sign)).
      return verify(rawBody, signature, String(body.timestamp ?? ''), String(body.sign ?? ''));
    },

    async map(event, payload) {
      const body = (payload ?? {}) as WebhookBody;
      const evtType = body.event_type ?? event ?? 'unknown';
      const data = body.data ?? payload;

      const normalized: GlobalEvent | NormalizedEvent = { type: evtType.toLowerCase(), data };

      // normalkan tipe event umum TikTok Shop
      if (/order_?status/i.test(evtType)) {
        return { type: 'order.status_changed', data };
      }
      if (/order|recipient_address|package_update|shipment/i.test(evtType)) {
        return { type: /package|shipment/i.test(evtType) ? 'shipment.updated' : 'order.updated', data };
      }
      if (/product|cancel/i.test(evtType)) {
        return { type: /cancel/i.test(evtType) ? 'order.status_changed' : 'product.updated', data };
      }
      if (/return|refund/i.test(evtType)) {
        return { type: 'return.updated', data };
      }
      return normalized;
    },
  };
}