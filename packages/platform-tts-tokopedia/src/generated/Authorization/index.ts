// AUTO-GENERATED from TikTok Shop reference docs (references/api/authorization).
// Do not edit by hand; run `npm run generate` in sdk/.

import { TikTokClient } from '../../tts.client'
import { TikTokRequestOptions } from '../../tts.types'

export interface DeauthorizeShopRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. Get by API [Get Authorization Shop](https://partner.tiktokshop.com/docv2/page/6507ead7b99d5302be949ba9?external_id=650 */
  "shop_cipher": string,
}

export interface DeauthorizeShopResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export interface GetAuthorizedCategoryAssetsRequest {}


export interface GetAuthorizedCategoryAssetsResponse {
  "code"?: number,
  "data"?: {
  "category_assets"?: Array<{
    "category"?: {
      "id"?: number,
      "name"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetAuthorizedShopsRequest {}


export interface GetAuthorizedShopsResponse {
  "code"?: number,
  "data"?: {
  "shops"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetWidgetTokenRequest {
  /** shopID is not needed */
  "shop_id"?: number,
}

export interface GetWidgetTokenResponse {
  "code"?: number,
  "data"?: {
  "widget_token"?: {
    "expire_at"?: number,
    "token"?: string,
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export class TikTokAuthorizationApi {
  constructor(private client: TikTokClient) {}

  /**
   * DeauthorizeShop
   * /authorization/202403/shops (DELETE)
   */
  async deauthorizeShop(params: DeauthorizeShopRequest, opts?: TikTokRequestOptions): Promise<DeauthorizeShopResponse> {
    return this.client.request({"method":"DELETE","path":"/authorization/202403/shops","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetAuthorizedCategoryAssets
   * /authorization/202405/category_assets (GET)
   */
  async getAuthorizedCategoryAssets(params: GetAuthorizedCategoryAssetsRequest, opts?: TikTokRequestOptions): Promise<GetAuthorizedCategoryAssetsResponse> {
    return this.client.request({"method":"GET","path":"/authorization/202405/category_assets","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetAuthorizedShops
   * /authorization/202309/shops (GET)
   */
  async getAuthorizedShops(params: GetAuthorizedShopsRequest, opts?: TikTokRequestOptions): Promise<GetAuthorizedShopsResponse> {
    return this.client.request({"method":"GET","path":"/authorization/202309/shops","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetWidgetToken
   * /authorization/202401/widget_token (GET)
   */
  async getWidgetToken(params: GetWidgetTokenRequest, opts?: TikTokRequestOptions): Promise<GetWidgetTokenResponse> {
    return this.client.request({"method":"GET","path":"/authorization/202401/widget_token","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_id"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }
}
