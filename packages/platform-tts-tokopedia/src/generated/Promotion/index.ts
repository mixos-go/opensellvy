// AUTO-GENERATED from TikTok Shop reference docs (references/api/promotion).
// Do not edit by hand; run `npm run generate` in sdk/.

import { TikTokClient } from '../../tts.client'
import { TikTokRequestOptions } from '../../tts.types'

export interface CreateActivityRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface CreateActivityBody {
  "activity_type"?: string,
  "begin_time"?: number,
  "discount"?: {
  "bmsm_discount"?: {
    "details"?: Array<Record<string, unknown>>,
  },
  "gift_discount"?: {
    "gift_infos"?: Array<Record<string, unknown>>,
    "gift_receiving_type"?: string,
  },
  "shipping_discount"?: {
    "area_scope"?: {
      "specific_areas"?: Array<string>,
      "type"?: string,
    },
    "inventory_type"?: string,
    "shipping_method"?: string,
    "threshold_type"?: string,
    "threshold_value"?: string,
    "type"?: string,
    "value"?: string,
  },
  },
  "duration_type"?: string,
  "end_time"?: number,
  "participation_limit"?: Array<Record<string, unknown>>,
  "product_level"?: string,
  "target_user_info"?: {
  "user_type"?: string,
  },
  "title"?: string,
}

export interface CreateActivityResponse {
  "code"?: number,
  "data"?: {
  "activity_id"?: string,
  "create_time"?: number,
  "status"?: string,
  "update_time"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface DeactivateActivityRequest {
  /** A unique ID that identifies different activities. (path) */
  "activity_id": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface DeactivateActivityResponse {
  "code"?: number,
  "data"?: {
  "activity_id"?: string,
  "status"?: string,
  "title"?: string,
  "update_time"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetActivityRequest {
  /** Activity ID (path) */
  "activity_id": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetActivityResponse {
  "code"?: number,
  "data"?: {
  "activity_commands"?: Array<string>,
  "activity_id"?: string,
  "activity_type"?: string,
  "begin_time"?: number,
  "create_time"?: number,
  "discount"?: {
    "bmsm_discount"?: {
      "details"?: Array<Record<string, unknown>>,
    },
    "gift_discount"?: {
      "gift_infos"?: Array<Record<string, unknown>>,
      "gift_receiving_type"?: string,
    },
    "shipping_discount"?: {
      "area_scope"?: {
        "specific_areas"?: Array<string>,
        "type"?: string,
      },
      "inventory_type"?: string,
      "shipping_method"?: string,
      "threshold_type"?: string,
      "threshold_value"?: string,
      "type"?: string,
      "value"?: string,
    },
  },
  "duration_type"?: string,
  "end_time"?: number,
  "participation_limit"?: Array<Record<string, unknown>>,
  "product_level"?: string,
  "products"?: Array<{
    "activity_price"?: {
      "amount"?: string,
      "currency"?: string,
    },
    "skus"?: {
      "activity_price"?: {
        "amount"?: string,
        "currency"?: string,
      },
    },
  }>,
  "status"?: string,
  "target_user_info"?: {
    "user_type"?: string,
  },
  "title"?: string,
  "update_time"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetCouponRequest {
  /** Coupon id. (path) */
  "coupon_id": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetCouponResponse {
  "code"?: number,
  "data"?: {
  "coupon"?: {
    "claim_duration"?: {
      "end_time"?: number,
      "start_time"?: number,
    },
    "create_time"?: number,
    "creation_source"?: string,
    "discount"?: {
      "max_discount"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "percentage"?: string,
      "reduction_amount"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "type"?: string,
    },
    "display_channels"?: Array<string>,
    "display_type"?: string,
    "id"?: string,
    "live_tasks"?: Array<Record<string, unknown>>,
    "product_ids"?: Array<string>,
    "product_scope"?: string,
    "promo_code"?: string,
    "redemption_duration"?: {
      "end_time"?: number,
      "relative_time"?: number,
      "start_time"?: number,
      "type"?: string,
    },
    "seller_tnc"?: string,
    "status"?: string,
    "target_buyer_segment"?: string,
    "threshold"?: {
      "min_spend"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "type"?: string,
    },
    "title"?: string,
    "update_time"?: number,
    "usage_limits"?: {
      "redemption_limit"?: number,
      "single_buyer_claim_limit"?: number,
      "total_claim_limit"?: number,
    },
    "usage_stats"?: {
      "claimed_count"?: number,
      "redeemed_count"?: number,
    },
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export interface RemoveActivityProductRequest {
  /** Activity ID (path) */
  "activity_id": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface RemoveActivityProductBody {
  "product_ids"?: Array<string>,
  "sku_ids"?: Array<string>,
}

export interface RemoveActivityProductResponse {
  "code"?: number,
  "data"?: {
  "activity_id"?: string,
  "status"?: string,
  "update_time"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface SearchActivitiesRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface SearchActivitiesBody {
  "activity_title"?: string,
  "activity_type"?: string,
  "page_size"?: number,
  "page_token"?: string,
  "status"?: string,
}

export interface SearchActivitiesResponse {
  "code"?: number,
  "data"?: {
  "activities"?: Array<{
    "discount"?: {
      "bmsm_discount"?: {
        "details"?: Array<Record<string, unknown>>,
      },
      "gift_discount"?: {
        "gift_infos"?: Array<Record<string, unknown>>,
        "gift_receiving_type"?: string,
      },
      "shipping_discount"?: {
        "area_scope"?: {
          "specific_areas"?: Array<string>,
          "type"?: string,
        },
        "inventory_type"?: string,
        "shipping_method"?: string,
        "threshold_type"?: string,
        "threshold_value"?: string,
        "type"?: string,
        "value"?: string,
      },
    },
  }>,
  "next_page_token"?: string,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface SearchCouponsRequest {
  /** Page cursor. Omitting this parameter will return the first page of results. */
  "page_token"?: string,
  /** The number of coupons returned in one page of results. The range is [1, 100], with a default value of 50. */
  "page_size"?: number,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface SearchCouponsBody {
  "display_type"?: Array<string>,
  "status"?: Array<string>,
  "title_keyword"?: string,
}

export interface SearchCouponsResponse {
  "code"?: number,
  "data"?: {
  "coupons"?: Array<{
    "claim_duration"?: {
      "end_time"?: number,
      "start_time"?: number,
    },
    "discount"?: {
      "max_discount"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "percentage"?: string,
      "reduction_amount"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "type"?: string,
    },
    "redemption_duration"?: {
      "end_time"?: number,
      "relative_time"?: number,
      "start_time"?: number,
      "type"?: string,
    },
    "threshold"?: {
      "min_spend"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "type"?: string,
    },
    "usage_limits"?: {
      "redemption_limit"?: number,
      "single_buyer_claim_limit"?: number,
      "total_claim_limit"?: number,
    },
  }>,
  "next_page_token"?: string,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface UpdateActivityRequest {
  /** Activity ID (path) */
  "activity_id": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface UpdateActivityBody {
  "begin_time"?: number,
  "discount"?: {
  "bmsm_discount"?: {
    "details"?: Array<Record<string, unknown>>,
  },
  "gift_discount"?: {
    "gift_infos"?: Array<Record<string, unknown>>,
    "gift_receiving_type"?: string,
  },
  "shipping_discount"?: {
    "area_scope"?: {
      "specific_areas"?: Array<string>,
      "type"?: string,
    },
    "inventory_type"?: string,
    "shipping_method"?: string,
    "threshold_type"?: string,
    "threshold_value"?: string,
    "type"?: string,
    "value"?: string,
  },
  },
  "duration_type"?: string,
  "end_time"?: number,
  "participation_limit"?: Array<Record<string, unknown>>,
  "product_level"?: string,
  "target_user_info"?: {
  "user_type"?: string,
  },
  "title"?: string,
}

export interface UpdateActivityResponse {
  "code"?: number,
  "data"?: {
  "activity_id"?: string,
  "title"?: string,
  "update_time"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface UpdateActivityProductRequest {
  /** Activity ID (path) */
  "activity_id": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface UpdateActivityProductBody {
  "activity_id"?: string,
  "products"?: Array<Record<string, unknown>>,
}

export interface UpdateActivityProductResponse {
  "code"?: number,
  "data"?: {
  "activity_id"?: string,
  "status"?: string,
  "title"?: string,
  "total_count"?: number,
  "update_time"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export class TikTokPromotionApi {
  constructor(private client: TikTokClient) {}

  /**
   * CreateActivity
   * /promotion/202309/activities (POST)
   */
  async createActivity(params: CreateActivityRequest, body?: CreateActivityBody, opts?: TikTokRequestOptions): Promise<CreateActivityResponse> {
    return this.client.request({"method":"POST","path":"/promotion/202309/activities","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":["activity_type","begin_time","discount","duration_type","end_time","participation_limit","product_level","target_user_info","title"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * DeactivateActivity
   * /promotion/202309/activities/{activity_id}/deactivate (POST)
   */
  async deactivateActivity(params: DeactivateActivityRequest, opts?: TikTokRequestOptions): Promise<DeactivateActivityResponse> {
    return this.client.request({"method":"POST","path":"/promotion/202309/activities/{activity_id}/deactivate","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":["activity_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetActivity
   * /promotion/202309/activities/{activity_id} (GET)
   */
  async getActivity(params: GetActivityRequest, opts?: TikTokRequestOptions): Promise<GetActivityResponse> {
    return this.client.request({"method":"GET","path":"/promotion/202309/activities/{activity_id}","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":["activity_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetCoupon
   * /promotion/202406/coupons/{coupon_id} (GET)
   */
  async getCoupon(params: GetCouponRequest, opts?: TikTokRequestOptions): Promise<GetCouponResponse> {
    return this.client.request({"method":"GET","path":"/promotion/202406/coupons/{coupon_id}","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":["coupon_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * RemoveActivityProduct
   * /promotion/202309/activities/{activity_id}/products (DELETE)
   */
  async removeActivityProduct(params: RemoveActivityProductRequest, body?: RemoveActivityProductBody, opts?: TikTokRequestOptions): Promise<RemoveActivityProductResponse> {
    return this.client.request({"method":"DELETE","path":"/promotion/202309/activities/{activity_id}/products","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":["activity_id"],"body":["product_ids","sku_ids"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * SearchActivities
   * /promotion/202309/activities/search (POST)
   */
  async searchActivities(params: SearchActivitiesRequest, body?: SearchActivitiesBody, opts?: TikTokRequestOptions): Promise<SearchActivitiesResponse> {
    return this.client.request({"method":"POST","path":"/promotion/202309/activities/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":["activity_title","activity_type","page_size","page_token","status"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * SearchCoupons
   * /promotion/202406/coupons/search (POST)
   */
  async searchCoupons(params: SearchCouponsRequest, body?: SearchCouponsBody, opts?: TikTokRequestOptions): Promise<SearchCouponsResponse> {
    return this.client.request({"method":"POST","path":"/promotion/202406/coupons/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":["page_token","page_size","shop_cipher"],"headers":[],"pathParams":[],"body":["display_type","status","title_keyword"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * UpdateActivity
   * /promotion/202309/activities/{activity_id} (PUT)
   */
  async updateActivity(params: UpdateActivityRequest, body?: UpdateActivityBody, opts?: TikTokRequestOptions): Promise<UpdateActivityResponse> {
    return this.client.request({"method":"PUT","path":"/promotion/202309/activities/{activity_id}","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":["activity_id"],"body":["begin_time","discount","duration_type","end_time","participation_limit","product_level","target_user_info","title"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * UpdateActivityProduct
   * /promotion/202309/activities/{activity_id}/products (PUT)
   */
  async updateActivityProduct(params: UpdateActivityProductRequest, body?: UpdateActivityProductBody, opts?: TikTokRequestOptions): Promise<UpdateActivityProductResponse> {
    return this.client.request({"method":"PUT","path":"/promotion/202309/activities/{activity_id}/products","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":["activity_id"],"body":["activity_id","products"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }
}
