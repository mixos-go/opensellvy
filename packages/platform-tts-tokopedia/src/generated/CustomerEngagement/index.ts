// AUTO-GENERATED from TikTok Shop reference docs (references/api/customer_engagement).
// Do not edit by hand; run `npm run generate` in sdk/.

import { TikTokClient } from '../../tts.client'
import { TikTokRequestOptions } from '../../tts.types'

export interface CreateCustomEngagementTaskRequest {
  /** A unique key to recognize a request and prevent duplicate processing of the same request, especially in cases of connection issues. Ensure this key is unique for each request to avoid accidental duplicates. Note: We recommend that you generate v4 UUIDs for use as keys. */
  "idempotency_key": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface CreateCustomEngagementTaskBody {
  "channel"?: string,
  "coupon_ids"?: Array<string>,
  "custom_message"?: {
  "body"?: string,
  "title"?: string,
  },
  "end_time"?: number,
  "product_ids"?: Array<string>,
  "task_name"?: string,
}

export interface CreateCustomEngagementTaskResponse {
  "code"?: number,
  "data"?: {
  "task_id"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface CreateEngagementTaskRequest {
  /** A unique key to recognize a request and prevent duplicate processing of the same request, especially in cases of connection issues. Ensure this key is unique for each request to avoid accidental duplicates. **Note**: We recommend that you generate v4 UUIDs for use as keys. */
  "idempotency_key": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface CreateEngagementTaskBody {
  "channel"?: string,
  "coupon_ids"?: Array<string>,
  "end_time"?: number,
  "product_ids"?: Array<string>,
  "task_name"?: string,
  "template_id"?: string,
}

export interface CreateEngagementTaskResponse {
  "code"?: number,
  "data"?: {
  "task_id"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetCustomerTabVisibilityRequest {
  /** Shop_cipher is required for cross-border shops, and optional for local shops. It's unique for each shop. Get the this property from the Get Authorized Shop API dynamically. Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API */
  "shop_cipher": string,
}

export interface GetCustomerTabVisibilityResponse {
  "code"?: number,
  "data"?: {
  "is_visible"?: boolean,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetFeaturePermissionsRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetFeaturePermissionsResponse {
  "code"?: number,
  "data"?: {
  "features"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetMessageTemplatesRequest {
  /** Shop_cipher is required for cross-border shops, and optional for local shops. It's unique for each shop. Get the this property from the Get Authorized Shop API dynamically. Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API */
  "shop_cipher": string,
  /** The BCP-47 locale codes for displaying the message content, delimited by commas. Default: en-US Refer to [Locale codes](678e3a47bae28f030a8c7523) for the list of supported locale codes. */
  "locale": string,
}

export interface GetMessageTemplatesResponse {
  "code"?: number,
  "data"?: {
  "message_templates"?: Array<{
    "coupon_card_rules"?: {
      "coupon_type"?: Array<string>,
      "max_count"?: number,
      "min_count"?: number,
    },
    "product_card_rules"?: {
      "max_count"?: number,
      "min_count"?: number,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetTaskPerformancesRequest {
  /** Shop_cipher is required for cross-border shops, and optional for local shops. It's unique for each shop. Get the this property from the Get Authorized Shop API dynamically. Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API */
  "shop_cipher": string,
}

export interface GetTaskPerformancesBody {
  "task_ids"?: Array<string>,
}

export interface GetTaskPerformancesResponse {
  "code"?: number,
  "data"?: {
  "task_performances"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface SendEngagementMessageRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface SendEngagementMessageBody {
  "buyer_emails"?: Array<string>,
  "task_id"?: string,
}

export interface SendEngagementMessageResponse {
  "code"?: number,
  "data"?: {
  "errors"?: Array<{
    "detail"?: {
      "buyer_email"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export class TikTokCustomerEngagementApi {
  constructor(private client: TikTokClient) {}

  /**
   * CreateCustomEngagementTask
   * /customer_engagement/202502/engagement_tasks/custom (POST)
   */
  async createCustomEngagementTask(params: CreateCustomEngagementTaskRequest, body?: CreateCustomEngagementTaskBody, opts?: TikTokRequestOptions): Promise<CreateCustomEngagementTaskResponse> {
    return this.client.request({"method":"POST","path":"/customer_engagement/202502/engagement_tasks/custom","baseUrl":"https://open-api.tiktokglobalshop.com","query":["idempotency_key","shop_cipher"],"headers":[],"pathParams":[],"body":["channel","coupon_ids","custom_message","end_time","product_ids","task_name"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * CreateEngagementTask
   * /customer_engagement/202412/engagement_tasks (POST)
   */
  async createEngagementTask(params: CreateEngagementTaskRequest, body?: CreateEngagementTaskBody, opts?: TikTokRequestOptions): Promise<CreateEngagementTaskResponse> {
    return this.client.request({"method":"POST","path":"/customer_engagement/202412/engagement_tasks","baseUrl":"https://open-api.tiktokglobalshop.com","query":["idempotency_key","shop_cipher"],"headers":[],"pathParams":[],"body":["channel","coupon_ids","end_time","product_ids","task_name","template_id"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GetCustomerTabVisibility
   * /customer_engagement/202501/customer_tab/visibility (GET)
   */
  async getCustomerTabVisibility(params: GetCustomerTabVisibilityRequest, opts?: TikTokRequestOptions): Promise<GetCustomerTabVisibilityResponse> {
    return this.client.request({"method":"GET","path":"/customer_engagement/202501/customer_tab/visibility","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetFeaturePermissions
   * /customer_engagement/202502/permissions (GET)
   */
  async getFeaturePermissions(params: GetFeaturePermissionsRequest, opts?: TikTokRequestOptions): Promise<GetFeaturePermissionsResponse> {
    return this.client.request({"method":"GET","path":"/customer_engagement/202502/permissions","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetMessageTemplates
   * /customer_engagement/202412/message_templates (GET)
   */
  async getMessageTemplates(params: GetMessageTemplatesRequest, opts?: TikTokRequestOptions): Promise<GetMessageTemplatesResponse> {
    return this.client.request({"method":"GET","path":"/customer_engagement/202412/message_templates","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher","locale"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetTaskPerformances
   * /customer_engagement/202412/performances (POST)
   */
  async getTaskPerformances(params: GetTaskPerformancesRequest, body?: GetTaskPerformancesBody, opts?: TikTokRequestOptions): Promise<GetTaskPerformancesResponse> {
    return this.client.request({"method":"POST","path":"/customer_engagement/202412/performances","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":["task_ids"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * SendEngagementMessage
   * /customer_engagement/202412/messages (POST)
   */
  async sendEngagementMessage(params: SendEngagementMessageRequest, body?: SendEngagementMessageBody, opts?: TikTokRequestOptions): Promise<SendEngagementMessageResponse> {
    return this.client.request({"method":"POST","path":"/customer_engagement/202412/messages","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":["buyer_emails","task_id"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }
}
