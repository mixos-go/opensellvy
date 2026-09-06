// AUTO-GENERATED from TikTok Shop reference docs (references/api/data_reconciliation).
// Do not edit by hand; run `npm run generate` in sdk/.

import { TikTokClient } from '../../tts.client'
import { TikTokRequestOptions } from '../../tts.types'

export interface OrderStatusDataExchangeRequest {
  /** Tiktok shop seller shop id. */
  "shop_id"?: number,
}

export interface OrderStatusDataExchangeBody {
  "orders"?: Array<Record<string, unknown>>,
}

export interface OrderStatusDataExchangeResponse {
  "code"?: number,
  "data"?: {
  "errors"?: Array<{
    "detail"?: {
      "channel_order_id"?: string,
      "channel_type"?: string,
      "extra_errors"?: Array<Record<string, unknown>>,
      "order_id"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface QualityFactoryOrderDataImportAPIRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface QualityFactoryOrderDataImportAPIBody {
  "orders"?: Array<Record<string, unknown>>,
}

export interface QualityFactoryOrderDataImportAPIResponse {
  "code"?: number,
  "data"?: {
  "errors"?: Array<{
    "detail"?: {
      "channel_order_id"?: string,
      "channel_type"?: string,
      "extra_errors"?: Array<Record<string, unknown>>,
      "order_id"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export class TikTokDataReconciliationApi {
  constructor(private client: TikTokClient) {}

  /**
   * OrderStatusDataExchange
   * /data_reconciliation/202309/orders/sync (POST)
   */
  async orderStatusDataExchange(params: OrderStatusDataExchangeRequest, body?: OrderStatusDataExchangeBody, opts?: TikTokRequestOptions): Promise<OrderStatusDataExchangeResponse> {
    return this.client.request({"method":"POST","path":"/data_reconciliation/202309/orders/sync","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_id"],"headers":[],"pathParams":[],"body":["orders"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * QualityFactoryOrderDataImportAPI
   * /data_reconciliation/202401/orders/import (POST)
   */
  async qualityFactoryOrderDataImportAPI(params: QualityFactoryOrderDataImportAPIRequest, body?: QualityFactoryOrderDataImportAPIBody, opts?: TikTokRequestOptions): Promise<QualityFactoryOrderDataImportAPIResponse> {
    return this.client.request({"method":"POST","path":"/data_reconciliation/202401/orders/import","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":["orders"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }
}
