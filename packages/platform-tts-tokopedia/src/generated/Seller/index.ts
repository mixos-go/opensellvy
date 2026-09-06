// AUTO-GENERATED from TikTok Shop reference docs (references/api/seller).
// Do not edit by hand; run `npm run generate` in sdk/.

import { TikTokClient } from '../../tts.client'
import { TikTokRequestOptions } from '../../tts.types'

export interface GetActiveShopsRequest {}


export interface GetActiveShopsResponse {
  "code"?: number,
  "data"?: {
  "shops"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetSellerPermissionsRequest {}


export interface GetSellerPermissionsResponse {
  "code"?: number,
  "data"?: {
  "permissions"?: Array<string>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetSellerStatusRequest {}


export interface GetSellerStatusResponse {
  "code"?: number,
  "data"?: {
  "seller_status_data"?: {
    "partner_channel"?: string,
    "seller_status"?: string,
    "shop_statuses"?: Array<Record<string, unknown>>,
    "tax_form_status"?: string,
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetShopCreatorsRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetShopCreatorsResponse {
  "code"?: number,
  "data"?: {
  "shop_creators"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface SyncCollectionsRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface SyncCollectionsBody {
  "collections"?: Array<Record<string, unknown>>,
  "logo_url"?: string,
  "source"?: number,
}

export interface SyncCollectionsResponse {
  "code"?: number,
  "data"?: {
  "failed_info"?: {
    "ids"?: Array<string>,
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export class TikTokSellerApi {
  constructor(private client: TikTokClient) {}

  /**
   * GetActiveShops
   * /seller/202309/shops (GET)
   */
  async getActiveShops(params: GetActiveShopsRequest, opts?: TikTokRequestOptions): Promise<GetActiveShopsResponse> {
    return this.client.request({"method":"GET","path":"/seller/202309/shops","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetSellerPermissions
   * /seller/202309/permissions (GET)
   */
  async getSellerPermissions(params: GetSellerPermissionsRequest, opts?: TikTokRequestOptions): Promise<GetSellerPermissionsResponse> {
    return this.client.request({"method":"GET","path":"/seller/202309/permissions","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetSellerStatus
   * /seller/202508/status (GET)
   */
  async getSellerStatus(params: GetSellerStatusRequest, opts?: TikTokRequestOptions): Promise<GetSellerStatusResponse> {
    return this.client.request({"method":"GET","path":"/seller/202508/status","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetShopCreators
   * /seller/202407/shop_creators (GET)
   */
  async getShopCreators(params: GetShopCreatorsRequest, opts?: TikTokRequestOptions): Promise<GetShopCreatorsResponse> {
    return this.client.request({"method":"GET","path":"/seller/202407/shop_creators","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * SyncCollections
   * /seller/202508/collections/sync (POST)
   */
  async syncCollections(params: SyncCollectionsRequest, body?: SyncCollectionsBody, opts?: TikTokRequestOptions): Promise<SyncCollectionsResponse> {
    return this.client.request({"method":"POST","path":"/seller/202508/collections/sync","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":["collections","logo_url","source"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }
}
