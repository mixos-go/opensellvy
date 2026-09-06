// AUTO-GENERATED from TikTok Shop reference docs (references/api/affiliate).
// Do not edit by hand; run `npm run generate` in sdk/.

import { TikTokClient } from '../../tts.client'
import { TikTokRequestOptions } from '../../tts.types'

export interface AddLIVEProductsRequest {}


export interface AddLIVEProductsBody {
  "product_ids"?: Array<string>,
}

export interface AddLIVEProductsResponse {
  "code"?: number,
  "data"?: {
  "errors"?: Array<{
    "detail"?: {
      "product_id"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface AddShowcaseProductsoldRequest {}


export interface AddShowcaseProductsoldBody {
  "product_ids"?: Array<string>,
}

export interface AddShowcaseProductsoldResponse {
  "code"?: number,
  "data"?: {
  "errors"?: Array<{
    "detail"?: {
      "product_id"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface CheckAnchorContentRequest {}


export interface CheckAnchorContentBody {
  "title"?: string,
}

export interface CheckAnchorContentResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export interface CheckAnchorPrerequisitesRequest {}


export interface CheckAnchorPrerequisitesBody {
  "product_id"?: string,
}

export interface CheckAnchorPrerequisitesResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export interface GetCreatorProfileoldRequest {}


export interface GetCreatorProfileoldResponse {
  "code"?: number,
  "data"?: {
  "avatar"?: {
    "height"?: number,
    "url"?: string,
    "width"?: number,
  },
  "partner_id"?: string,
  "partner_name"?: string,
  "permissions"?: Array<string>,
  "register_region"?: string,
  "selection_region"?: string,
  "seller_type"?: string,
  "user_name"?: string,
  "user_type"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetLIVEProductsRequest {}


export interface GetLIVEProductsResponse {
  "code"?: number,
  "data"?: {
  "pinned_product_id"?: string,
  "products"?: Array<{
    "commission"?: {
      "commission_rate"?: number,
      "inclusive_reward_commission_rate"?: number,
    },
    "price"?: {
      "original_price"?: {
        "currency"?: string,
        "highest_amount"?: string,
        "lowest_amount"?: string,
      },
      "platform_discount_price"?: {
        "currency"?: string,
        "highest_amount"?: string,
        "lowest_amount"?: string,
      },
      "seller_discount_price"?: {
        "currency"?: string,
        "highest_amount"?: string,
        "lowest_amount"?: string,
      },
    },
    "status"?: {
      "added_status"?: string,
      "inventory_status"?: string,
      "review_status"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetLiveRoomInfoRequest {}


export interface GetLiveRoomInfoResponse {
  "code"?: number,
  "data"?: {
  "id"?: string,
  "start_time"?: number,
  "status"?: string,
  "title"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetShopProductslegacyRequest {
  /** The pagination offset that determines where you begin your search. If you are making your first request, this will be empty. */
  "page_token"?: string,
  /** Pagination count determines how many products you'll get after sending the request. 20 is a recommended number. */
  "page_size": number,
  /** The title keyword of the product you wish to search by. */
  "title_keyword"?: string,
  /** Sort fields include PRODUCT_ID, PRICE and SALE. If sort_field is empty or invalid, PRODUCT_ID will be set as default. */
  "sort_field"?: string,
  /** Sort orders include 0:DESC and 1:ASC. If sort order is empty or invalid, DESC will be set as default. */
  "sort_order"?: string,
}

export interface GetShopProductslegacyResponse {
  "code"?: number,
  "data"?: {
  "next_page_token"?: string,
  "products"?: Array<{
    "price"?: {
      "amount"?: string,
      "currency"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetShowcaseProductsoldRequest {
  /** The maximum number of products returned in the response. Default to be 50 if not set. */
  "page_size"?: number,
  /** The page token */
  "page_token"?: string,
  /** Where the request is sent from. LIVE: sent from live room. The response will return the product IDs in the LIVE as well. The "add_status" field will be whether the product is in the live bag, or whether the product is in the prelive product preparation list if the creator is not live streaming. SHOW */
  "origin"?: string,
}

export interface GetShowcaseProductsoldResponse {
  "code"?: number,
  "data"?: {
  "live_product_ids"?: Array<string>,
  "next_page_token"?: string,
  "products"?: Array<{
    "addition"?: Array<{
      "customized_main_image"?: Array<Record<string, unknown>>,
    }>,
    "commission"?: {
      "commission_rate"?: number,
      "inclusive_reward_commission_rate"?: number,
    },
    "price"?: {
      "original_price"?: {
        "currency"?: string,
        "highest_amount"?: string,
        "lowest_amount"?: string,
      },
      "platform_discount_price"?: {
        "currency"?: string,
        "highest_amount"?: string,
        "lowest_amount"?: string,
      },
      "seller_discount_price"?: {
        "currency"?: string,
        "highest_amount"?: string,
        "lowest_amount"?: string,
      },
    },
    "status"?: {
      "added_status"?: string,
      "inventory_status"?: string,
      "is_hidden"?: boolean,
      "review_status"?: string,
    },
  }>,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface PinLIVEProductRequest {
  /** The product IDs to move to the top in a creator's TikTok LIVE. (path) */
  "product_id": string,
}

export interface PinLIVEProductResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export interface RemoveLIVEProductsRequest {}


export interface RemoveLIVEProductsBody {
  "product_ids"?: Array<string>,
}

export interface RemoveLIVEProductsResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export interface RemoveShowcaseProductsoldRequest {}


export interface RemoveShowcaseProductsoldBody {
  "product_ids"?: Array<string>,
}

export interface RemoveShowcaseProductsoldResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export interface TopLIVEProductsRequest {}


export interface TopLIVEProductsBody {
  "product_ids"?: Array<string>,
}

export interface TopLIVEProductsResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export interface TopShowcaseProductsoldRequest {}


export interface TopShowcaseProductsoldBody {
  "product_ids"?: Array<string>,
}

export interface TopShowcaseProductsoldResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export interface UnpinLIVEProductRequest {
  /** The product ID to unpin in a creator's TikTok LIVE. (path) */
  "product_id": string,
}

export interface UnpinLIVEProductResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export class TikTokAffiliateApi {
  constructor(private client: TikTokClient) {}

  /**
   * AddLIVEProducts
   * /affiliate/202309/live_rooms/products (POST)
   */
  async addLIVEProducts(params: AddLIVEProductsRequest, body?: AddLIVEProductsBody, opts?: TikTokRequestOptions): Promise<AddLIVEProductsResponse> {
    return this.client.request({"method":"POST","path":"/affiliate/202309/live_rooms/products","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["product_ids"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * AddShowcaseProductsold
   * /affiliate/202309/showcases/products (POST)
   */
  async addShowcaseProductsold(params: AddShowcaseProductsoldRequest, body?: AddShowcaseProductsoldBody, opts?: TikTokRequestOptions): Promise<AddShowcaseProductsoldResponse> {
    return this.client.request({"method":"POST","path":"/affiliate/202309/showcases/products","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["product_ids"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * CheckAnchorContent
   * /affiliate/202403/anchors/content_check (POST)
   */
  async checkAnchorContent(params: CheckAnchorContentRequest, body?: CheckAnchorContentBody, opts?: TikTokRequestOptions): Promise<CheckAnchorContentResponse> {
    return this.client.request({"method":"POST","path":"/affiliate/202403/anchors/content_check","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["title"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * CheckAnchorPrerequisites
   * /affiliate/202402/anchors/prerequisite_check (POST)
   */
  async checkAnchorPrerequisites(params: CheckAnchorPrerequisitesRequest, body?: CheckAnchorPrerequisitesBody, opts?: TikTokRequestOptions): Promise<CheckAnchorPrerequisitesResponse> {
    return this.client.request({"method":"POST","path":"/affiliate/202402/anchors/prerequisite_check","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["product_id"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GetCreatorProfileold
   * /affiliate/202309/profiles (GET)
   */
  async getCreatorProfileold(params: GetCreatorProfileoldRequest, opts?: TikTokRequestOptions): Promise<GetCreatorProfileoldResponse> {
    return this.client.request({"method":"GET","path":"/affiliate/202309/profiles","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetLIVEProducts
   * /affiliate/202309/live_rooms/products (GET)
   */
  async getLIVEProducts(params: GetLIVEProductsRequest, opts?: TikTokRequestOptions): Promise<GetLIVEProductsResponse> {
    return this.client.request({"method":"GET","path":"/affiliate/202309/live_rooms/products","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetLiveRoomInfo
   * /affiliate/202309/live_rooms (GET)
   */
  async getLiveRoomInfo(params: GetLiveRoomInfoRequest, opts?: TikTokRequestOptions): Promise<GetLiveRoomInfoResponse> {
    return this.client.request({"method":"GET","path":"/affiliate/202309/live_rooms","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetShopProductslegacy
   * /affiliate/202309/shop_products (GET)
   */
  async getShopProductslegacy(params: GetShopProductslegacyRequest, opts?: TikTokRequestOptions): Promise<GetShopProductslegacyResponse> {
    return this.client.request({"method":"GET","path":"/affiliate/202309/shop_products","baseUrl":"https://open-api.tiktokglobalshop.com","query":["page_token","page_size","title_keyword","sort_field","sort_order"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetShowcaseProductsold
   * /affiliate/202309/showcases/products (GET)
   */
  async getShowcaseProductsold(params: GetShowcaseProductsoldRequest, opts?: TikTokRequestOptions): Promise<GetShowcaseProductsoldResponse> {
    return this.client.request({"method":"GET","path":"/affiliate/202309/showcases/products","baseUrl":"https://open-api.tiktokglobalshop.com","query":["page_size","page_token","origin"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * PinLIVEProduct
   * /affiliate/202309/live_rooms/products/{product_id}/pin (POST)
   */
  async pinLIVEProduct(params: PinLIVEProductRequest, opts?: TikTokRequestOptions): Promise<PinLIVEProductResponse> {
    return this.client.request({"method":"POST","path":"/affiliate/202309/live_rooms/products/{product_id}/pin","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":["product_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * RemoveLIVEProducts
   * /affiliate/202309/live_rooms/products (DELETE)
   */
  async removeLIVEProducts(params: RemoveLIVEProductsRequest, body?: RemoveLIVEProductsBody, opts?: TikTokRequestOptions): Promise<RemoveLIVEProductsResponse> {
    return this.client.request({"method":"DELETE","path":"/affiliate/202309/live_rooms/products","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["product_ids"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * RemoveShowcaseProductsold
   * /affiliate/202309/showcases/products (DELETE)
   */
  async removeShowcaseProductsold(params: RemoveShowcaseProductsoldRequest, body?: RemoveShowcaseProductsoldBody, opts?: TikTokRequestOptions): Promise<RemoveShowcaseProductsoldResponse> {
    return this.client.request({"method":"DELETE","path":"/affiliate/202309/showcases/products","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["product_ids"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * TopLIVEProducts
   * /affiliate/202309/live_rooms/products/top (POST)
   */
  async topLIVEProducts(params: TopLIVEProductsRequest, body?: TopLIVEProductsBody, opts?: TikTokRequestOptions): Promise<TopLIVEProductsResponse> {
    return this.client.request({"method":"POST","path":"/affiliate/202309/live_rooms/products/top","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["product_ids"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * TopShowcaseProductsold
   * /affiliate/202309/showcases/products/top (POST)
   */
  async topShowcaseProductsold(params: TopShowcaseProductsoldRequest, body?: TopShowcaseProductsoldBody, opts?: TikTokRequestOptions): Promise<TopShowcaseProductsoldResponse> {
    return this.client.request({"method":"POST","path":"/affiliate/202309/showcases/products/top","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["product_ids"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * UnpinLIVEProduct
   * /affiliate/202309/live_rooms/products/{product_id}/unpin (POST)
   */
  async unpinLIVEProduct(params: UnpinLIVEProductRequest, opts?: TikTokRequestOptions): Promise<UnpinLIVEProductResponse> {
    return this.client.request({"method":"POST","path":"/affiliate/202309/live_rooms/products/{product_id}/unpin","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":["product_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }
}
