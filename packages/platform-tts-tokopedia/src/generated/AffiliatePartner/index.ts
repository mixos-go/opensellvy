// AUTO-GENERATED from TikTok Shop reference docs (references/api/affiliate_partner).
// Do not edit by hand; run `npm run generate` in sdk/.

import { TikTokClient } from '../../tts.client'
import { TikTokRequestOptions } from '../../tts.types'

export interface CreateAffiliatePartnerCampaignRequest {
  /** The partner identifier used in API requests. Retrieve this value by using the [Get Authorized Category Assets API] (https://partner.tiktokshop.com/docv2/page/666012dd609d4402cc3be995). */
  "category_asset_cipher": string,
}

export interface CreateAffiliatePartnerCampaignBody {
  "campaign_end_time"?: number,
  "campaign_start_time"?: number,
  "commission_rate"?: number,
  "contact_info"?: {
  "email"?: string,
  "line"?: string,
  "phone"?: string,
  "viber"?: string,
  "whatsapp"?: string,
  "zalo"?: string,
  },
  "description"?: string,
  "name"?: string,
  "registration_end_time"?: number,
  "registration_start_time"?: number,
  "target_seller_types"?: Array<string>,
  "target_shop_codes"?: Array<string>,
}

export interface CreateAffiliatePartnerCampaignResponse {
  "code"?: number,
  "data"?: {
  "campaign_id"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface EditAffiliatePartnerCampaignRequest {
  /** The ID of the campaign. (path) */
  "campaign_id": string,
  /** The partner identifier used in API requests. Retrieve this value by using the [Get Authorized Category Assets API] (https://partner.tiktokshop.com/docv2/page/666012dd609d4402cc3be995). */
  "category_asset_cipher": string,
}

export interface EditAffiliatePartnerCampaignBody {
  "campaign_end_time"?: number,
  "campaign_start_time"?: number,
  "commission_rate"?: number,
  "contact_info"?: {
  "email"?: string,
  "line"?: string,
  "phone"?: string,
  "viber"?: string,
  "whatsapp"?: string,
  "zalo"?: string,
  },
  "description"?: string,
  "name"?: string,
  "registration_end_time"?: number,
  "registration_start_time"?: number,
  "target_seller_types"?: Array<string>,
  "target_shop_codes"?: Array<string>,
}

export interface EditAffiliatePartnerCampaignResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export interface GenerateAffiliatePartnerCampaignProductLinkRequest {
  /** The ID of the campaign. (path) */
  "campaign_id": string,
  /** The ID of the product. (path) */
  "product_id": string,
  /** The partner identifier used in API requests. Retrieve this value by using the [Get Authorized Category Assets API] (https://partner.tiktokshop.com/docv2/page/666012dd609d4402cc3be995). */
  "category_asset_cipher": string,
}

export interface GenerateAffiliatePartnerCampaignProductLinkBody {
  "creator_commission_rate"?: number,
}

export interface GenerateAffiliatePartnerCampaignProductLinkResponse {
  "code"?: number,
  "data"?: {
  "product_promotion_link"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetAffiliateCampaignCreatorFulfillmentStatusInfoRequest {
  /** The campaign identifier. (path) */
  "campaign_id": string,
  /** The product identifier. (path) */
  "product_id": string,
  /** The number of results to be returned per page. Valid range: 1-50. */
  "page_size"?: number,
  /** An opaque token used to retrieve the next page of a paginated result set. Retrieve this value from the result of the next_page_token from a previous response. It is not needed for the first page. */
  "page_token"?: string,
}

export interface GetAffiliateCampaignCreatorFulfillmentStatusInfoResponse {
  "code"?: number,
  "data"?: {
  "next_page_token"?: string,
  "promotion_creators"?: Array<{
    "creator"?: {
      "avatar_url"?: string,
      "creator_temp_id"?: string,
      "follower_num"?: number,
      "nick_name"?: string,
      "user_name"?: string,
    },
    "paid_amount"?: {
      "amount"?: string,
      "currency"?: string,
    },
  }>,
  "total_creator_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetAffiliateCampaignCreatorFulfillmentStatusListRequest {
  /** the unique id of a campaign (path) */
  "campaign_id": string,
  /** The number of results to be returned per page. Valid range: 1-50. */
  "page_size"?: number,
  /** An opaque token used to retrieve the next page of a paginated result set. Retrieve this value from the result of the next_page_token from a previous response. It is not needed for the first page. */
  "page_token"?: string,
}

export interface GetAffiliateCampaignCreatorFulfillmentStatusListResponse {
  "code"?: number,
  "data"?: {
  "campaign_product_statistics"?: Array<{
    "campaign_product_detail"?: {
      "creator_commission_percent"?: string,
      "indicator_data"?: {
        "actual_amount"?: string,
        "actual_order_num"?: string,
        "actual_partner_commission"?: string,
        "collaborated_creators_num"?: string,
        "creator_sales_num"?: string,
        "estimated_amount"?: string,
        "estimated_partner_commission"?: string,
        "paid_order_num"?: string,
        "promoted_creator_num"?: string,
        "sample_requested_creator_num"?: string,
      },
      "partner_commission_percent"?: string,
      "plan_commission_percent"?: string,
      "product_id"?: string,
      "product_name"?: string,
      "product_price"?: {
        "currency"?: string,
        "max_price"?: string,
        "min_price"?: string,
      },
      "product_status"?: string,
      "product_stock_count"?: string,
      "product_thumbnail"?: {
        "uri"?: string,
        "url_list"?: Array<string>,
      },
      "total_commission_percent"?: string,
    },
  }>,
  "next_page_token"?: string,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetAffiliateCampaignCreatorProductContentStatisticsRequest {
  /** The campaign identifier. (path) */
  "campaign_id": string,
  /** The product identifier. (path) */
  "product_id": string,
  /** Creator Open ID. [More details](https://partner.tiktokshop.com/docv2/page/3obfokj6) (path) */
  "creator_temp_id": string,
  /** The affiliate product identifier to be included in the response. Refer to promotion_creators.affiliate_product_id in the response of Get Affiliate Campaign Creator Fulfillment Status Info gateway. */
  "affiliate_product_id": string,
  /** Content type.Identify content as video or live. - 1: VIDEO - 2: LIVE_ROOM */
  "content_type"?: string,
}

export interface GetAffiliateCampaignCreatorProductContentStatisticsResponse {
  "code"?: number,
  "data"?: {
  "creator_content_statistics"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetAffiliateCampaignCreatorProductSampleStatusRequest {
  /** The campaign identifier. (path) */
  "campaign_id": string,
  /** The product identifier. (path) */
  "product_id": string,
  /** Creator Open ID. [More details](https://partner.tiktokshop.com/docv2/page/3obfokj6) (path) */
  "creator_temp_id": string,
}

export interface GetAffiliateCampaignCreatorProductSampleStatusResponse {
  "code"?: number,
  "data"?: {
  "sample_status"?: {
    "delivery_option"?: string,
    "estimated_earliest_delivery_date"?: string,
    "estimated_latest_delivery_date"?: string,
    "quantity"?: number,
    "shipping_provider_name"?: string,
    "tracking_results"?: Array<Record<string, unknown>>,
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetAffiliatePartnerCampaignDetailRequest {
  /** The ID of the campaign. (path) */
  "campaign_id": string,
  /** The partner identifier used in API requests. Retrieve this value by using the [Get Authorized Category Assets API] (https://partner.tiktokshop.com/docv2/page/666012dd609d4402cc3be995). */
  "category_asset_cipher": string,
}

export interface GetAffiliatePartnerCampaignDetailResponse {
  "code"?: number,
  "data"?: {
  "campaign_end_time"?: number,
  "campaign_start_time"?: number,
  "commission_rate"?: number,
  "contact_info"?: {
    "email"?: string,
    "line"?: string,
    "phone"?: string,
    "viber"?: string,
    "whatsapp"?: string,
    "zalo"?: string,
  },
  "description"?: string,
  "id"?: string,
  "name"?: string,
  "region"?: string,
  "registration_end_time"?: number,
  "registration_start_time"?: number,
  "status"?: string,
  "target_seller_types"?: Array<string>,
  "target_shops"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetAffiliatePartnerCampaignListRequest {
  /** The partner identifier used in API requests. Retrieve this value by using the [Get Authorized Category Assets API](https://partner.tiktokshop.com/docv2/page/666012dd609d4402cc3be995). */
  "category_asset_cipher": string,
  /** The number of results to be returned per page. Default: 10. Valid range: [1-100]. */
  "page_size": number,
  /** An opaque token used to retrieve the next page of a paginated result set. Retrieve this value from the result of the next_page_token from a previous response. It is not needed for the first page. Maximum page size is 100 items. */
  "page_token"?: string,
  /** The campaign status. The status is an enumerated type with values: - READY - UPCOMING - ONGOING - CLOSED - UNSPECIFIED */
  "status"?: string,
  /** The campaign type. This is an enumerated type with values: - MY_CAMPAIGNS - GS_SELLING_CAMPAIGNS - SELLER_CAMPAIGNS - EXCLUSIVE_TIKTOK_SHOP Default value is MY_CAMPAIGNS. */
  "type"?: string,
  /** An extended filter to be used when the campaign type property type is set to SELLER_CAMPAIGNS or EXCLUSIVE_TIKTOK_SHOP. If the type property is set to SELLER_CAMPAIGNS, the valid values for this property are: - MARKETPLACE: the response includes campaigns that the partner did not join. - JOINED : th */
  "query_type_filter"?: string,
}

export interface GetAffiliatePartnerCampaignListResponse {
  "code"?: number,
  "data"?: {
  "campaigns"?: Array<Record<string, unknown>>,
  "next_page_token"?: string,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetAffiliatePartnerCampaignProductListRequest {
  /** The ID of the campaign. (path) */
  "campaign_id": string,
  /** The partner identifier used in API requests. Retrieve this value by using the [Get Authorized Category Assets API](https://partner.tiktokshop.com/docv2/page/666012dd609d4402cc3be995). */
  "category_asset_cipher": string,
  /** The number of results to be returned per page. */
  "page_size": number,
  /** An opaque token used to retrieve the next page of a paginated result set. Retrieve this value from the result of the next_page_token from a previous response. It is not needed for the first page. */
  "page_token"?: string,
  /** The product review status. This an enumerated type with values: - PENDING - APPROVED - REJECTED - PENDING_CLOSED - CLOSED */
  "review_status"?: string,
  /** Filter the product list by product name. If value of product_name is contained in product.name, the product will be included in the response. */
  "product_name"?: string,
  /** Filter the product list by product ID. If value of product_id matches product.id, the product will be included in the response. */
  "product_id"?: string,
  /** Filter the product list by shop name. If value of shop_name is contained in product.shop_name, the product will be included in the response. */
  "shop_name"?: string,
  /** Filter the product list by category ID. If value of category_id matches product.category.id, or the product falls into the leaf category of the specified category, the product will be included in the response. */
  "category_id"?: string,
}

export interface GetAffiliatePartnerCampaignProductListResponse {
  "code"?: number,
  "data"?: {
  "next_page_token"?: string,
  "products"?: Array<{
    "category"?: {
      "id"?: string,
      "name"?: string,
    },
    "highest_price"?: {
      "amount"?: string,
      "currency"?: string,
    },
    "lowest_price"?: {
      "amount"?: string,
      "currency"?: string,
    },
    "sku_information_list"?: {
      "base_price"?: {
        "currency"?: string,
        "list_price"?: string,
        "localized_dutiable_price"?: string,
        "region_code"?: string,
        "sale_price"?: string,
      },
      "inventory"?: {
        "available_quantity"?: string,
      },
    },
  }>,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface PartnerGenerateMultiAffiliateCampaignProductLinkRequest {
  /** The ID of the campaign (path) */
  "campaign_id": string,
  /** The partner identifier used in API requests. Retrieve this value by using the [Get Authorized Category Assets API] (https://partner.tiktokshop.com/docv2/page/666012dd609d4402cc3be995). */
  "category_asset_cipher"?: string,
}

export interface PartnerGenerateMultiAffiliateCampaignProductLinkBody {
  "product_ids"?: Array<string>,
}

export interface PartnerGenerateMultiAffiliateCampaignProductLinkResponse {
  "code"?: number,
  "data"?: {
  "failed_product_ids"?: Array<string>,
  "product_promotion_links"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface PublishAffiliatePartnerCampaignRequest {
  /** The campaign identifier. (path) */
  "campaign_id": string,
  /** The partner identifier used in API requests. Retrieve this value by using the [Get Authorized Category Assets API] (https://partner.tiktokshop.com/docv2/page/666012dd609d4402cc3be995). */
  "category_asset_cipher": string,
}

export interface PublishAffiliatePartnerCampaignResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export interface ReviewAffiliatePartnerCampaignProductRequest {
  /** The campaign identifier. (path) */
  "campaign_id": string,
  /** The product identifier. (path) */
  "product_id": string,
  /** The partner identifier used in API requests. Retrieve this value by using the [Get Authorized Category Assets API] (https://partner.tiktokshop.com/docv2/page/666012dd609d4402cc3be995). */
  "category_asset_cipher": string,
}

export interface ReviewAffiliatePartnerCampaignProductBody {
  "reject_reasons"?: Array<string>,
  "review_result"?: string,
}

export interface ReviewAffiliatePartnerCampaignProductResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export interface SearchCAPAffiliateOrdersRequest {
  /** The next page token */
  "page_token"?: string,
  /** The default is 20, it must be positive integer, the range is 1-100 */
  "page_size": number,
  /** The partner identifier used in API requests. Retrieve this value by using the [Get Authorized Category Assets API] (https://partner.tiktokshop.com/docv2/page/666012dd609d4402cc3be995). */
  "category_asset_cipher": string,
}

export interface SearchCAPAffiliateOrdersBody {
  "create_time_ge"?: number,
  "create_time_lt"?: number,
  "order_id"?: string,
  "order_status"?: number,
  "product_id"?: string,
}

export interface SearchCAPAffiliateOrdersResponse {
  "code"?: number,
  "data"?: {
  "next_page_token"?: string,
  "orders"?: Array<{
    "skus"?: {
      "actual_bonus_commission"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "actual_commission"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "actual_commission_base"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "actual_shop_ads_commission"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "agency_bonus_commission"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "agency_commission"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "agency_commission_rate"?: string,
      "agency_shop_ads_commission"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "attribution_type"?: string,
      "commission_bonus_rate"?: string,
      "commission_model"?: string,
      "commission_rate"?: string,
      "commission_tier_setting"?: string,
      "content_id"?: string,
      "content_type"?: string,
      "creator_username"?: string,
      "estimated_bonus_commission"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "estimated_commission"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "estimated_commission_base"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "estimated_shop_ads_commission"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "id"?: string,
      "isr"?: string,
      "iva"?: string,
      "open_collaboration_id"?: string,
      "price"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "product_id"?: string,
      "product_name"?: string,
      "quantity"?: number,
      "refunded_quantity"?: number,
      "returned_quantity"?: number,
      "shop_ads_commission_rate"?: string,
      "shop_name"?: string,
      "target_collaboration_id"?: string,
      "total_agency_commission"?: {
        "amount"?: string,
        "currency"?: string,
      },
    },
  }>,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface SearchTapAffiliateOrdersRequest {
  /** The next page token */
  "page_token"?: string,
  /** The default is 20, it must be positive integer, the range is 1-100 */
  "page_size": number,
  /** The partner identifier used in API requests. Retrieve this value by using the [Get Authorized Category Assets API] (https://partner.tiktokshop.com/docv2/page/666012dd609d4402cc3be995). */
  "category_asset_cipher": string,
}

export interface SearchTapAffiliateOrdersBody {
  "campaign_id"?: string,
  "create_time_ge"?: number,
  "create_time_lt"?: number,
}

export interface SearchTapAffiliateOrdersResponse {
  "code"?: number,
  "data"?: {
  "next_page_token"?: string,
  "orders"?: Array<{
    "skus"?: {
      "actual_commission_base"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "actual_creator_commission"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "actual_creator_commission_reward_fee"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "actual_partner_commission_reward_fee"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "actual_tap_commission"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "campaign_id"?: string,
      "content_id"?: string,
      "content_type"?: string,
      "creator_commission_rate"?: number,
      "creator_commission_reward_rate"?: number,
      "creator_username"?: string,
      "estimated_commission_base"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "estimated_creator_commission"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "estimated_creator_commission_reward_fee"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "estimated_partner_commission_reward_fee"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "estimated_tap_commission"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "id"?: string,
      "partner_commission_reward_rate"?: number,
      "price"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "product_id"?: string,
      "product_name"?: string,
      "quantity"?: number,
      "refunded_quantity"?: number,
      "returned_quantity"?: number,
      "tap_commission_rate"?: number,
    },
  }>,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export class TikTokAffiliatePartnerApi {
  constructor(private client: TikTokClient) {}

  /**
   * CreateAffiliatePartnerCampaign
   * /affiliate_partner/202405/campaigns (POST)
   */
  async createAffiliatePartnerCampaign(params: CreateAffiliatePartnerCampaignRequest, body?: CreateAffiliatePartnerCampaignBody, opts?: TikTokRequestOptions): Promise<CreateAffiliatePartnerCampaignResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_partner/202405/campaigns","baseUrl":"https://open-api.tiktokglobalshop.com","query":["category_asset_cipher"],"headers":[],"pathParams":[],"body":["campaign_end_time","campaign_start_time","commission_rate","contact_info","description","name","registration_end_time","registration_start_time","target_seller_types","target_shop_codes"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * EditAffiliatePartnerCampaign
   * /affiliate_partner/202405/campaigns/{campaign_id}/partial_edit (POST)
   */
  async editAffiliatePartnerCampaign(params: EditAffiliatePartnerCampaignRequest, body?: EditAffiliatePartnerCampaignBody, opts?: TikTokRequestOptions): Promise<EditAffiliatePartnerCampaignResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_partner/202405/campaigns/{campaign_id}/partial_edit","baseUrl":"https://open-api.tiktokglobalshop.com","query":["category_asset_cipher"],"headers":[],"pathParams":["campaign_id"],"body":["campaign_end_time","campaign_start_time","commission_rate","contact_info","description","name","registration_end_time","registration_start_time","target_seller_types","target_shop_codes"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GenerateAffiliatePartnerCampaignProductLink
   * /affiliate_partner/202405/campaigns/{campaign_id}/products/{product_id}/promotion_link/generate (POST)
   */
  async generateAffiliatePartnerCampaignProductLink(params: GenerateAffiliatePartnerCampaignProductLinkRequest, body?: GenerateAffiliatePartnerCampaignProductLinkBody, opts?: TikTokRequestOptions): Promise<GenerateAffiliatePartnerCampaignProductLinkResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_partner/202405/campaigns/{campaign_id}/products/{product_id}/promotion_link/generate","baseUrl":"https://open-api.tiktokglobalshop.com","query":["category_asset_cipher"],"headers":[],"pathParams":["campaign_id","product_id"],"body":["creator_commission_rate"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GetAffiliateCampaignCreatorFulfillmentStatusInfo
   * /affiliate_partner/202501/campaigns/{campaign_id}/products/{product_id}/performance (GET)
   */
  async getAffiliateCampaignCreatorFulfillmentStatusInfo(params: GetAffiliateCampaignCreatorFulfillmentStatusInfoRequest, opts?: TikTokRequestOptions): Promise<GetAffiliateCampaignCreatorFulfillmentStatusInfoResponse> {
    return this.client.request({"method":"GET","path":"/affiliate_partner/202501/campaigns/{campaign_id}/products/{product_id}/performance","baseUrl":"https://open-api.tiktokglobalshop.com","query":["page_size","page_token"],"headers":[],"pathParams":["campaign_id","product_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetAffiliateCampaignCreatorFulfillmentStatusList
   * /affiliate_partner/202501/campaigns/{campaign_id}/products/performance (GET)
   */
  async getAffiliateCampaignCreatorFulfillmentStatusList(params: GetAffiliateCampaignCreatorFulfillmentStatusListRequest, opts?: TikTokRequestOptions): Promise<GetAffiliateCampaignCreatorFulfillmentStatusListResponse> {
    return this.client.request({"method":"GET","path":"/affiliate_partner/202501/campaigns/{campaign_id}/products/performance","baseUrl":"https://open-api.tiktokglobalshop.com","query":["page_size","page_token"],"headers":[],"pathParams":["campaign_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetAffiliateCampaignCreatorProductContentStatistics
   * /affiliate_partner/202508/campaigns/{campaign_id}/products/{product_id}/creator/{creator_temp_id}/content/statistics (GET)
   */
  async getAffiliateCampaignCreatorProductContentStatistics(params: GetAffiliateCampaignCreatorProductContentStatisticsRequest, opts?: TikTokRequestOptions): Promise<GetAffiliateCampaignCreatorProductContentStatisticsResponse> {
    return this.client.request({"method":"GET","path":"/affiliate_partner/202508/campaigns/{campaign_id}/products/{product_id}/creator/{creator_temp_id}/content/statistics","baseUrl":"https://open-api.tiktokglobalshop.com","query":["affiliate_product_id","content_type"],"headers":[],"pathParams":["campaign_id","product_id","creator_temp_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetAffiliateCampaignCreatorProductSampleStatus
   * /affiliate_partner/202508/campaigns/{campaign_id}/products/{product_id}/creator/{creator_temp_id}/content/statistics/sample/status (GET)
   */
  async getAffiliateCampaignCreatorProductSampleStatus(params: GetAffiliateCampaignCreatorProductSampleStatusRequest, opts?: TikTokRequestOptions): Promise<GetAffiliateCampaignCreatorProductSampleStatusResponse> {
    return this.client.request({"method":"GET","path":"/affiliate_partner/202508/campaigns/{campaign_id}/products/{product_id}/creator/{creator_temp_id}/content/statistics/sample/status","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":["campaign_id","product_id","creator_temp_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetAffiliatePartnerCampaignDetail
   * /affiliate_partner/202405/campaigns/{campaign_id} (GET)
   */
  async getAffiliatePartnerCampaignDetail(params: GetAffiliatePartnerCampaignDetailRequest, opts?: TikTokRequestOptions): Promise<GetAffiliatePartnerCampaignDetailResponse> {
    return this.client.request({"method":"GET","path":"/affiliate_partner/202405/campaigns/{campaign_id}","baseUrl":"https://open-api.tiktokglobalshop.com","query":["category_asset_cipher"],"headers":[],"pathParams":["campaign_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetAffiliatePartnerCampaignList
   * /affiliate_partner/202405/campaigns (GET)
   */
  async getAffiliatePartnerCampaignList(params: GetAffiliatePartnerCampaignListRequest, opts?: TikTokRequestOptions): Promise<GetAffiliatePartnerCampaignListResponse> {
    return this.client.request({"method":"GET","path":"/affiliate_partner/202405/campaigns","baseUrl":"https://open-api.tiktokglobalshop.com","query":["category_asset_cipher","page_size","page_token","status","type","query_type_filter"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetAffiliatePartnerCampaignProductList
   * /affiliate_partner/202405/campaigns/{campaign_id}/products (GET)
   */
  async getAffiliatePartnerCampaignProductList(params: GetAffiliatePartnerCampaignProductListRequest, opts?: TikTokRequestOptions): Promise<GetAffiliatePartnerCampaignProductListResponse> {
    return this.client.request({"method":"GET","path":"/affiliate_partner/202405/campaigns/{campaign_id}/products","baseUrl":"https://open-api.tiktokglobalshop.com","query":["category_asset_cipher","page_size","page_token","review_status","product_name","product_id","shop_name","category_id"],"headers":[],"pathParams":["campaign_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * PartnerGenerateMultiAffiliateCampaignProductLink
   * /affiliate_partner/202505/campaigns/{campaign_id}/products/promotion_links/generate_batch (POST)
   */
  async partnerGenerateMultiAffiliateCampaignProductLink(params: PartnerGenerateMultiAffiliateCampaignProductLinkRequest, body?: PartnerGenerateMultiAffiliateCampaignProductLinkBody, opts?: TikTokRequestOptions): Promise<PartnerGenerateMultiAffiliateCampaignProductLinkResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_partner/202505/campaigns/{campaign_id}/products/promotion_links/generate_batch","baseUrl":"https://open-api.tiktokglobalshop.com","query":["category_asset_cipher"],"headers":[],"pathParams":["campaign_id"],"body":["product_ids"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * PublishAffiliatePartnerCampaign
   * /affiliate_partner/202405/campaigns/{campaign_id}/publish (POST)
   */
  async publishAffiliatePartnerCampaign(params: PublishAffiliatePartnerCampaignRequest, opts?: TikTokRequestOptions): Promise<PublishAffiliatePartnerCampaignResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_partner/202405/campaigns/{campaign_id}/publish","baseUrl":"https://open-api.tiktokglobalshop.com","query":["category_asset_cipher"],"headers":[],"pathParams":["campaign_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * ReviewAffiliatePartnerCampaignProduct
   * /affiliate_partner/202405/campaigns/{campaign_id}/products/{product_id}/review (POST)
   */
  async reviewAffiliatePartnerCampaignProduct(params: ReviewAffiliatePartnerCampaignProductRequest, body?: ReviewAffiliatePartnerCampaignProductBody, opts?: TikTokRequestOptions): Promise<ReviewAffiliatePartnerCampaignProductResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_partner/202405/campaigns/{campaign_id}/products/{product_id}/review","baseUrl":"https://open-api.tiktokglobalshop.com","query":["category_asset_cipher"],"headers":[],"pathParams":["campaign_id","product_id"],"body":["reject_reasons","review_result"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * SearchCAPAffiliateOrders
   * /affiliate_partner/202504/cap_order/search (POST)
   */
  async searchCAPAffiliateOrders(params: SearchCAPAffiliateOrdersRequest, body?: SearchCAPAffiliateOrdersBody, opts?: TikTokRequestOptions): Promise<SearchCAPAffiliateOrdersResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_partner/202504/cap_order/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":["page_token","page_size","category_asset_cipher"],"headers":[],"pathParams":[],"body":["create_time_ge","create_time_lt","order_id","order_status","product_id"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * SearchTapAffiliateOrders
   * /affiliate_partner/202411/orders/search (POST)
   */
  async searchTapAffiliateOrders(params: SearchTapAffiliateOrdersRequest, body?: SearchTapAffiliateOrdersBody, opts?: TikTokRequestOptions): Promise<SearchTapAffiliateOrdersResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_partner/202411/orders/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":["page_token","page_size","category_asset_cipher"],"headers":[],"pathParams":[],"body":["campaign_id","create_time_ge","create_time_lt"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }
}
