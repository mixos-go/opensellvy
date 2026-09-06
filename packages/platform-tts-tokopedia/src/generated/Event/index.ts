// AUTO-GENERATED from TikTok Shop reference docs (references/api/event).
// Do not edit by hand; run `npm run generate` in sdk/.

import { TikTokClient } from '../../tts.client'
import { TikTokRequestOptions } from '../../tts.types'

export interface DeleteShopWebhookRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface DeleteShopWebhookBody {
  "event_type"?: string,
}

export interface DeleteShopWebhookResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export interface GetShopWebhooksRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetShopWebhooksResponse {
  "code"?: number,
  "data"?: {
  "total_count"?: number,
  "webhooks"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface UpdateShopWebhookRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface UpdateShopWebhookBody {
  "address"?: string,
  "event_type"?: string,
}

export interface UpdateShopWebhookResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export class TikTokEventApi {
  constructor(private client: TikTokClient) {}

  /**
   * DeleteShopWebhook
   * /event/202309/webhooks (DELETE)
   */
  async deleteShopWebhook(params: DeleteShopWebhookRequest, body?: DeleteShopWebhookBody, opts?: TikTokRequestOptions): Promise<DeleteShopWebhookResponse> {
    return this.client.request({"method":"DELETE","path":"/event/202309/webhooks","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":["event_type"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GetShopWebhooks
   * /event/202309/webhooks (GET)
   */
  async getShopWebhooks(params: GetShopWebhooksRequest, opts?: TikTokRequestOptions): Promise<GetShopWebhooksResponse> {
    return this.client.request({"method":"GET","path":"/event/202309/webhooks","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * UpdateShopWebhook
   * /event/202309/webhooks (PUT)
   */
  async updateShopWebhook(params: UpdateShopWebhookRequest, body?: UpdateShopWebhookBody, opts?: TikTokRequestOptions): Promise<UpdateShopWebhookResponse> {
    return this.client.request({"method":"PUT","path":"/event/202309/webhooks","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":["address","event_type"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }
}
