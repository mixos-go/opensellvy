// AUTO-GENERATED from TikTok Shop reference docs (references/api/affiliate_seller).
// Do not edit by hand; run `npm run generate` in sdk/.

import { TikTokClient } from '../../tts.client'
import { TikTokRequestOptions } from '../../tts.types'

export interface CreateConversationwithcreatorRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface CreateConversationwithcreatorBody {
  "creator_open_id"?: string,
  "only_need_conversation_id"?: boolean,
}

export interface CreateConversationwithcreatorResponse {
  "code"?: number,
  "data"?: {
  "avatar"?: string,
  "conversation_id"?: string,
  "creator_im_id"?: string,
  "is_new"?: boolean,
  "unread_count"?: number,
  "username"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface CreateOpenCollaborationRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface CreateOpenCollaborationBody {
  "commission_rate"?: number,
  "product_id"?: string,
}

export interface CreateOpenCollaborationResponse {
  "code"?: number,
  "data"?: {
  "open_collaboration"?: {
    "effective_time"?: number,
    "id"?: string,
    "product_id"?: string,
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export interface CreateTargetCollaborationRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface CreateTargetCollaborationBody {
  "creator_user_open_ids"?: Array<string>,
  "end_time"?: string,
  "free_sample_rule"?: {
  "has_free_sample"?: boolean,
  "is_sample_approval_exempt"?: boolean,
  },
  "message"?: string,
  "name"?: string,
  "products"?: Array<Record<string, unknown>>,
  "seller_contact_info"?: {
  "email"?: string,
  },
}

export interface CreateTargetCollaborationResponse {
  "code"?: number,
  "data"?: {
  "target_collaboration"?: {
    "id"?: string,
  },
  "target_collaboration_conflicts"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface EditOpenCollaborationSampleRuleRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface EditOpenCollaborationSampleRuleBody {
  "product_id"?: string,
  "sample_rule"?: {
  "activate_status"?: string,
  "end_time"?: number,
  "is_sample_time_unlimited"?: boolean,
  "sample_quota"?: number,
  "start_time"?: number,
  "thresholds"?: {
    "avg_ec_video_views"?: number,
    "category_ids"?: Array<string>,
    "minimum_follower_count"?: number,
    "minimum_gmv"?: number,
    "predicted_fulfillment_rank"?: string,
  },
  },
}

export interface EditOpenCollaborationSampleRuleResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export interface EditOpenCollaborationSettingsRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface EditOpenCollaborationSettingsBody {
  "auto_add_product"?: {
  "commission_rate"?: number,
  "enable"?: boolean,
  },
}

export interface EditOpenCollaborationSettingsResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export interface GenerateAffiliateProductPromotionLinkRequest {
  /** The product identifier. (path) */
  "product_id": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. Get by API [Get Authorization Shop](https://partner.tiktokshop.com/docv2/page/6507ead7b99d5302be949ba9?external_id=650 */
  "shop_cipher"?: string,
}

export interface GenerateAffiliateProductPromotionLinkResponse {
  "code"?: number,
  "data"?: {
  "product_promotion_link"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GenerateTargetCollaborationLinkRequest {
  /** Target collaboration ID. (path) */
  "target_collaboration_id": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. Get by API [Get Authorization Shop](https://partner.tiktokshop.com/docv2/page/6507ead7b99d5302be949ba9?external_id=650 */
  "shop_cipher": string,
}

export interface GenerateTargetCollaborationLinkResponse {
  "code"?: number,
  "data"?: {
  "link"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetConversationListRequest {
  /** The maximum number of queries. The maximum number is 50. */
  "page_size": number,
  /** Pagination offset determines where you begin to query. It's empty when you raise your first request. */
  "page_token"?: string,
  /** - If true, only conversation_id in conversation is returned. - If false, all fields in conversation are returned. true by default. */
  "only_need_conversation_id"?: boolean,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetConversationListBody {
  "only_need_conversation_id"?: boolean,
}

export interface GetConversationListResponse {
  "code"?: number,
  "data"?: {
  "conversations"?: Array<Record<string, unknown>>,
  "has_more"?: boolean,
  "next_page_token"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetLatestUnreadMessagesRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetLatestUnreadMessagesResponse {
  "code"?: number,
  "data"?: {
  "newest_message_list"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetMarketplaceCreatorPerformanceRequest {
  /** Creator Open ID. [More details](https://partner.tiktokshop.com/docv2/page/3obfokj6) (path) */
  "creator_user_id": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetMarketplaceCreatorPerformanceResponse {
  "code"?: number,
  "data"?: {
  "creator"?: {
    "avatar"?: {
      "url"?: string,
    },
    "avg_commission_rate"?: number,
    "avg_commission_rate_range"?: {
      "maximum_amount"?: number,
      "minimum_amount"?: number,
    },
    "avg_ec_live_comment_count"?: number,
    "avg_ec_live_like_count"?: number,
    "avg_ec_live_share_count"?: number,
    "avg_ec_live_view_count"?: number,
    "avg_ec_video_comment_count"?: number,
    "avg_ec_video_like_count"?: number,
    "avg_ec_video_play_count"?: number,
    "avg_ec_video_share_count"?: number,
    "avg_gmv_per_buyer"?: {
      "amount"?: string,
      "currency"?: string,
    },
    "avg_gmv_per_buyer_range"?: {
      "currency"?: string,
      "formatted_range"?: string,
      "maximum_amount"?: string,
      "minimum_amount"?: string,
    },
    "bio_description"?: string,
    "brand_collaboration_count"?: number,
    "category_gmv_distribution"?: Array<Record<string, unknown>>,
    "category_ids"?: Array<string>,
    "content_gmv_distribution"?: Array<Record<string, unknown>>,
    "ec_live_count"?: number,
    "ec_live_engagement_rate"?: string,
    "ec_video_count"?: number,
    "ec_video_engagement_rate"?: string,
    "follower_age"?: Array<Record<string, unknown>>,
    "follower_count"?: number,
    "follower_gender"?: Array<Record<string, unknown>>,
    "follower_location"?: Array<Record<string, unknown>>,
    "gmv"?: {
      "amount"?: string,
      "currency"?: string,
    },
    "gmv_range"?: {
      "currency"?: string,
      "formatted_range"?: string,
      "maximum_amount"?: string,
      "minimum_amount"?: string,
    },
    "gpm"?: {
      "amount"?: string,
      "currency"?: string,
    },
    "gpm_range"?: {
      "currency"?: string,
      "formatted_range"?: string,
      "maximum_amount"?: string,
      "minimum_amount"?: string,
    },
    "live_gmv"?: {
      "amount"?: string,
      "currency"?: string,
    },
    "live_gpm"?: {
      "amount"?: string,
      "currency"?: string,
    },
    "live_gpm_range"?: {
      "currency"?: string,
      "formatted_range"?: string,
      "maximum_amount"?: string,
      "minimum_amount"?: string,
    },
    "nickname"?: string,
    "post_rate"?: string,
    "pps"?: string,
    "product_original_price_range"?: {
      "currency"?: string,
      "maximum_amount"?: string,
      "minimum_amount"?: string,
    },
    "profile_tt_uri"?: string,
    "promoted_product_num"?: number,
    "rating"?: string,
    "selection_region"?: string,
    "top_collaborated_brand_ids"?: Array<string>,
    "units_sold"?: number,
    "units_sold_range"?: {
      "formatted_range"?: string,
      "maximum_amount"?: number,
      "minimum_amount"?: number,
    },
    "username"?: string,
    "video_gmv"?: {
      "amount"?: string,
      "currency"?: string,
    },
    "video_gpm"?: {
      "amount"?: string,
      "currency"?: string,
    },
    "video_gpm_range"?: {
      "currency"?: string,
      "formatted_range"?: string,
      "maximum_amount"?: string,
      "minimum_amount"?: string,
    },
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetMessageintheConversationRequest {
  /** The conversation identifier. (path) */
  "conversation_id": string,
  /** The maximum number of queries. The maximum number is 20. */
  "page_size": number,
  /** Pagination offset determines where you begin to query. It's empty when you raise your first request. */
  "page_token"?: string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetMessageintheConversationResponse {
  "code"?: number,
  "data"?: {
  "has_more"?: boolean,
  "messages"?: Array<{
    "message_body"?: {
      "content"?: string,
      "conversation_id"?: string,
      "create_time"?: number,
      "id"?: string,
      "sender_id"?: string,
      "type"?: string,
    },
  }>,
  "next_page_token"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetOpenCollaborationCreatorContentDetailRequest {
  /** Pagination offset determines where you begin to search for. It's empty when you raise your first request. */
  "page_token"?: string,
  /** The value of "page_size" must be greater than 0 and less than or equal to 100. */
  "page_size": number,
  /** The product ID that needs to be queried. */
  "product_id": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetOpenCollaborationCreatorContentDetailResponse {
  "code"?: number,
  "data"?: {
  "creator_content_details"?: Array<{
    "creator_profile"?: {
      "avatar"?: {
        "url"?: string,
      },
      "creator_open_id"?: string,
      "follower_count"?: number,
      "nickname"?: string,
      "username"?: string,
    },
  }>,
  "next_page_token"?: string,
  "product"?: {
    "id"?: string,
    "image_url"?: string,
  },
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetOpenCollaborationSampleRulesRequest {
  /** The product IDs to which the sample rules apply. */
  "product_ids": Array<string>,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetOpenCollaborationSampleRulesResponse {
  "code"?: number,
  "data"?: {
  "sample_rules"?: Array<{
    "thresholds"?: {
      "avg_ec_video_views"?: number,
      "category_ids"?: Array<string>,
      "minimum_follower_count"?: number,
      "minimum_gmv"?: number,
      "predicted_fulfillment_rank"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetOpenCollaborationSettingsRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetOpenCollaborationSettingsResponse {
  "code"?: number,
  "data"?: {
  "open_collaboration_settings"?: {
    "auto_add_product"?: {
      "commission_rate"?: number,
      "enable"?: boolean,
    },
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetSellerSearchCreatorMarketplaceAdvancedFiltersRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetSellerSearchCreatorMarketplaceAdvancedFiltersResponse {
  "code"?: number,
  "data"?: {
  "advanced_filters"?: {
    "category_pro"?: Array<string>,
    "creator_level"?: Array<string>,
    "language"?: Array<string>,
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export interface MarkConversationReadRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface MarkConversationReadBody {
  "conversation_ids"?: Array<string>,
}

export interface MarkConversationReadResponse {
  "code"?: number,
  "data"?: {
  "failed_conversation_ids"?: Array<string>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface QueryTargetCollaborationDetailRequest {
  /** target collaboration id (path) */
  "target_collaboration_id": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface QueryTargetCollaborationDetailResponse {
  "code"?: number,
  "data"?: {
  "target_collaboration"?: {
    "content_creator_count"?: number,
    "creator_invited_count"?: number,
    "creators"?: Array<{
      "avatar"?: {
        "url"?: string,
      },
    }>,
    "end_time"?: number,
    "free_sample_rule"?: {
      "has_free_sample"?: boolean,
      "is_sample_approval_exempt"?: boolean,
    },
    "id"?: string,
    "message"?: string,
    "name"?: string,
    "product_count"?: number,
    "products"?: Array<{
      "commission"?: {
        "currency"?: string,
        "effective_time"?: string,
        "maximum_amount"?: string,
        "minimum_amount"?: string,
        "rate"?: number,
        "shop_ads_commission_rate"?: number,
      },
      "original_price"?: {
        "currency"?: string,
        "maximum_amount"?: string,
        "minimum_amount"?: string,
      },
    }>,
    "seller_contact_info"?: {
      "email"?: string,
    },
    "showcase_creator_count"?: number,
    "start_time"?: number,
    "type"?: string,
    "update_time"?: number,
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export interface RemoveCreatorFromOpenCollaborationRequest {
  /** Open collaboration ID. This API is only applicable to the seller removing creators from open collaboration. (path) */
  "open_collaboration_id": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface RemoveCreatorFromOpenCollaborationBody {
  "creator_user_open_id"?: string,
  "product_id"?: string,
}

export interface RemoveCreatorFromOpenCollaborationResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export interface RemoveOpenCollaborationRequest {
  /** The product id of the open collaboration to be terminated (path) */
  "product_id": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface RemoveOpenCollaborationResponse {
  "code"?: number,
  "data"?: {
  "terminated_effective_time"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface RemoveTargetCollaborationRequest {
  /** The unique id of the specified target collaboration. (path) */
  "target_collaboration_id": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface RemoveTargetCollaborationResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export interface SearchOpenCollaborationRequest {
  /** Pagination offset determines where you begin to search for. It's empty when you raise your first request. */
  "page_token"?: string,
  /** The value of "page_size" must be greater than 0 and less than or equal to 100. */
  "page_size": number,
  /** Default value of "sort_order" is DESC. Enum: - ASC：means to sort data in ascending order - DESC：means to sort data in descending order */
  "sort_order"?: string,
  /** Some sorting fields are as follows: - product_original_price: sort by products' original price. By default, the open collaborations are sorted in descending order by creation time. */
  "sort_field"?: string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface SearchOpenCollaborationBody {
  "keyword"?: string,
  "keyword_type"?: string,
  "top_level_category_id"?: string,
}

export interface SearchOpenCollaborationResponse {
  "code"?: number,
  "data"?: {
  "next_page_token"?: string,
  "open_collaborations"?: Array<{
    "current_commission"?: {
      "end_time"?: number,
      "rate"?: number,
      "start_time"?: number,
    },
    "product"?: {
      "id"?: string,
      "inventory"?: number,
      "main_image_url"?: string,
      "original_price"?: {
        "currency"?: string,
        "maximum_amount"?: string,
        "minimum_amount"?: string,
      },
      "status"?: string,
      "title"?: string,
    },
  }>,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface SearchSellerAffiliateOrdersRequest {
  /** An opaque token used to retrieve the next page of a paginated result set. Retrieve this value from the result of the next_page_token from a previous response. It is not needed for the first page. */
  "page_token"?: string,
  /** The number of results to be returned per page. Default: 20 Valid Range: [1-100] */
  "page_size": number,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface SearchSellerAffiliateOrdersBody {
  "create_time_ge"?: number,
  "create_time_lt"?: number,
  "program_id"?: string,
}

export interface SearchSellerAffiliateOrdersResponse {
  "code"?: number,
  "data"?: {
  "next_page_token"?: string,
  "orders"?: Array<{
    "skus"?: {
      "actual_cofunded_creator_bonus_amount"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "actual_commission_base"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "actual_paid_commission"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "actual_paid_shop_ads_commission"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "estimated_cofunded_creator_bonus_amount"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "estimated_commission_base"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "estimated_paid_commission"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "estimated_paid_shop_ads_commission"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "price"?: {
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

export interface SearchTargetCollaborationsRequest {
  /** The value of "page_size" must be 20, 50 or 100. */
  "page_size"?: number,
  /** Pagination offset determines where you begin to search for. It's empty when raise your first request. */
  "page_token"?: string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface SearchTargetCollaborationsBody {
  "collaboration_status"?: string,
  "creator_accept_status"?: string,
  "creator_user_open_id"?: string,
  "free_sample_setting"?: string,
  "search_param"?: {
  "keyword"?: string,
  "keyword_type"?: string,
  },
}

export interface SearchTargetCollaborationsResponse {
  "code"?: number,
  "data"?: {
  "next_page_token"?: string,
  "target_collaborations"?: Array<{
    "free_sample_rule"?: {
      "has_free_sample"?: boolean,
      "is_sample_approval_exempt"?: boolean,
    },
  }>,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface SellerGetSampleRequestDeeplinkRequest {
  /** Product id */
  "product_id": string,
  /** Sku id */
  "sku_id": string,
  /** If the product belongs to a TAP campaign, a campaign_id is required. only support campaign type : - MY_CAMPAIGNS - SELLER_CAMPAIGNS */
  "campaign_id"?: string,
  /** If the product belongs to a seller collaboration, a collaboration_id is required. */
  "collaboration_id"?: string,
  /** 7 days by default. 14 days maximum. 1 day minimum. */
  "valid_days"?: number,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface SellerGetSampleRequestDeeplinkResponse {
  "code"?: number,
  "data"?: {
  "deeplink"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface SellerReviewSampleApplicationsRequest {
  /** The unique id of sample request application ID (path) */
  "application_id": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface SellerReviewSampleApplicationsBody {
  "reject_reason"?: string,
  "review_result"?: string,
}

export interface SellerReviewSampleApplicationsResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export interface SellerSearchAffiliateOpenCollaborationProductRequest {
  /** The sort order for the sort_field parameter. Default: ASC Possible values: - ASC: Ascending order - DESC: Descending order */
  "sort_order"?: string,
  /** The returned results will be sorted by the specified field. See the description of the field values in the request body for more information about each field. Default: commission_rate Possible values: - commission_rate - product_sales_price - commission - units_sold */
  "sort_field"?: string,
  /** An opaque token used to retrieve the next page of a paginated result set. Retrieve this value from the result of the next_page_token from a previous response. It is not needed for the first page. */
  "page_token"?: string,
  /** The number of results to be returned per page. Valid range: [1-20]. */
  "page_size": number,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. Get by API [Get Authorization Shop](https://partner.tiktokshop.com/docv2/page/6507ead7b99d5302be949ba9?external_id=650 */
  "shop_cipher"?: string,
}

export interface SellerSearchAffiliateOpenCollaborationProductBody {
  "category"?: {
  "id"?: string,
  },
  "commission_rate_range"?: {
  "rate_ge"?: number,
  "rate_lt"?: number,
  },
  "sales_price_range"?: {
  "amount_ge"?: string,
  "amount_lt"?: string,
  },
  "title_keywords"?: Array<string>,
}

export interface SellerSearchAffiliateOpenCollaborationProductResponse {
  "code"?: number,
  "data"?: {
  "next_page_token"?: string,
  "products"?: Array<{
    "commission"?: {
      "amount"?: string,
      "currency"?: string,
      "rate"?: number,
    },
    "original_price"?: {
      "currency"?: string,
      "maximum_amount"?: string,
      "minimum_amount"?: string,
    },
    "sales_price"?: {
      "currency"?: string,
      "maximum_amount"?: string,
      "minimum_amount"?: string,
    },
    "shop"?: {
      "name"?: string,
    },
  }>,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface SellerSearchCreatoronMarketplaceRequest {
  /** Pagination offset determines where you begin to search for. It's empty when raise your first request */
  "page_token"?: string,
  /** The value of "page_size" must be 12 or 20 */
  "page_size": number,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface SellerSearchCreatoronMarketplaceBody {
  "advanced_filters"?: {
  "category_pro"?: Array<string>,
  "creator_level"?: Array<string>,
  "language"?: Array<string>,
  },
  "affiliate_data"?: {
  "avg_commission_rate"?: string,
  "creator_agency_staus"?: string,
  "is_fast_growing"?: boolean,
  "not_invited_l90_days"?: boolean,
  "post_rate"?: string,
  },
  "category"?: Array<Record<string, unknown>>,
  "content_performance"?: {
  "avg_engagement_rate"?: string,
  "avg_live_avg_viewers_ge"?: string,
  "avg_shopable_engagement_rate"?: string,
  "avg_shoppable_live_avg_viewers_ge"?: string,
  "avg_shoppable_video_views"?: string,
  "avg_video_views"?: string,
  },
  "follower_demographics"?: {
  "age_ranges"?: Array<string>,
  "count_range"?: {
    "count_ge"?: number,
    "count_le"?: number,
  },
  "gender_distribution"?: {
    "gender"?: string,
    "percentage_ge"?: number,
  },
  },
  "gmv_ranges"?: Array<string>,
  "keyword"?: string,
  "search_key"?: string,
  "units_sold_ranges"?: Array<string>,
}

export interface SellerSearchCreatoronMarketplaceResponse {
  "code"?: number,
  "data"?: {
  "creators"?: Array<{
    "avatar"?: {
      "url"?: string,
    },
    "gmv"?: {
      "amount"?: string,
      "currency"?: string,
    },
    "gmv_range"?: {
      "currency"?: string,
      "formatted_range"?: string,
      "maximum_amount"?: string,
      "minimum_amount"?: string,
    },
    "live_gmv"?: {
      "amount"?: string,
      "currency"?: string,
    },
    "top_follower_demographics"?: {
      "age_ranges"?: Array<string>,
      "major_gender"?: {
        "gender"?: string,
        "percentage"?: number,
      },
    },
    "units_sold_range"?: {
      "formatted_range"?: string,
      "maximum_amount"?: number,
      "minimum_amount"?: number,
    },
    "video_gmv"?: {
      "amount"?: string,
      "currency"?: string,
    },
  }>,
  "next_page_token"?: string,
  "search_key"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface SellerSearchSampleApplicationsRequest {
  /** Pagination offset determines where you begin to search for. It's empty when raise your first request. */
  "page_token"?: string,
  /** The value of "page_size" must be greater than 0 and less than or equal to 50. */
  "page_size"?: number,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface SellerSearchSampleApplicationsBody {
  "creator_user_oepn_id"?: string,
  "order_id"?: string,
  "product_id"?: string,
  "status"?: string,
  "target_collabration_id"?: string,
  "title"?: string,
  "username"?: string,
}

export interface SellerSearchSampleApplicationsResponse {
  "code"?: number,
  "data"?: {
  "next_page_token"?: string,
  "sample_applications"?: Array<{
    "creator"?: {
      "avatar_url"?: string,
      "content_count"?: number,
      "creator_open_id"?: string,
      "ec_video_view"?: number,
      "follower_count"?: number,
      "fulfillment_percentage"?: string,
      "gmv"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "nickname"?: string,
      "username"?: string,
    },
    "product"?: {
      "id"?: string,
      "sku_id"?: string,
      "sku_image_url"?: string,
      "sku_name"?: string,
      "title"?: string,
    },
  }>,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface SellerSearchSampleApplicationsFulfillmentsRequest {
  /** The application identifier. (path) */
  "application_id": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface SellerSearchSampleApplicationsFulfillmentsBody {
  "content_format"?: string,
}

export interface SellerSearchSampleApplicationsFulfillmentsResponse {
  "code"?: number,
  "data"?: {
  "fulfillments"?: Array<{
    "content"?: {
      "comment_count"?: number,
      "create_time"?: number,
      "description"?: string,
      "format"?: string,
      "id"?: string,
      "like_count"?: number,
      "live_end_time"?: number,
      "page_link"?: string,
      "paid_order_count"?: number,
      "url"?: string,
      "view_count"?: number,
    },
    "product"?: {
      "id"?: string,
      "main_image_url"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface SendIMMessageRequest {
  /** conversation_id (path) */
  "conversation_id": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface SendIMMessageBody {
  "content"?: string,
  "msg_type"?: string,
}

export interface SendIMMessageResponse {
  "code"?: number,
  "data"?: {
  "message_id"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface UpdateTargetCollaborationRequest {
  /** The unique id of specific target collaboration. (path) */
  "target_collaboration_id": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface UpdateTargetCollaborationBody {
  "creator_user_open_ids"?: Array<string>,
  "end_time"?: string,
  "free_sample_rule"?: {
  "has_free_sample"?: boolean,
  "is_sample_approval_exempt"?: boolean,
  },
  "name"?: string,
  "products"?: Array<Record<string, unknown>>,
  "seller_contact_info"?: {
  "email"?: string,
  },
}

export interface UpdateTargetCollaborationResponse {
  "code"?: number,
  "data"?: {
  "target_collaboration_conflicts"?: Array<Record<string, unknown>>,
  "update_failed"?: {
    "add_creator_open_ids"?: Array<string>,
    "add_products"?: {
      "commission_rate"?: number,
      "id"?: string,
    },
    "change_commissions"?: {
      "commission_rate"?: number,
      "product_id"?: string,
    },
    "end_time"?: number,
    "name"?: string,
    "remove_creator_open_ids"?: Array<string>,
    "remove_product_ids"?: Array<string>,
    "seller_contact_info"?: {
      "email"?: string,
    },
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export interface UploadMessageImageRequest {}


export interface UploadMessageImageResponse {
  "code"?: number,
  "data"?: {
  "height"?: number,
  "url"?: string,
  "width"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export class TikTokAffiliateSellerApi {
  constructor(private client: TikTokClient) {}

  /**
   * CreateConversationwithcreator
   * /affiliate_seller/202508/conversations (POST)
   */
  async createConversationwithcreator(params: CreateConversationwithcreatorRequest, body?: CreateConversationwithcreatorBody, opts?: TikTokRequestOptions): Promise<CreateConversationwithcreatorResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_seller/202508/conversations","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":["creator_open_id","only_need_conversation_id"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * CreateOpenCollaboration
   * /affiliate_seller/202412/open_collaborations (POST)
   */
  async createOpenCollaboration(params: CreateOpenCollaborationRequest, body?: CreateOpenCollaborationBody, opts?: TikTokRequestOptions): Promise<CreateOpenCollaborationResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_seller/202412/open_collaborations","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":["commission_rate","product_id"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * CreateTargetCollaboration
   * /affiliate_seller/202508/target_collaborations (POST)
   */
  async createTargetCollaboration(params: CreateTargetCollaborationRequest, body?: CreateTargetCollaborationBody, opts?: TikTokRequestOptions): Promise<CreateTargetCollaborationResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_seller/202508/target_collaborations","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":["creator_user_open_ids","end_time","free_sample_rule","message","name","products","seller_contact_info"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * EditOpenCollaborationSampleRule
   * /affiliate_seller/202410/open_collaborations/sample_rules (POST)
   */
  async editOpenCollaborationSampleRule(params: EditOpenCollaborationSampleRuleRequest, body?: EditOpenCollaborationSampleRuleBody, opts?: TikTokRequestOptions): Promise<EditOpenCollaborationSampleRuleResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_seller/202410/open_collaborations/sample_rules","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":["product_id","sample_rule"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * EditOpenCollaborationSettings
   * /affiliate_seller/202405/open_collaboration_settings (POST)
   */
  async editOpenCollaborationSettings(params: EditOpenCollaborationSettingsRequest, body?: EditOpenCollaborationSettingsBody, opts?: TikTokRequestOptions): Promise<EditOpenCollaborationSettingsResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_seller/202405/open_collaboration_settings","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":["auto_add_product"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GenerateAffiliateProductPromotionLink
   * /affiliate_seller/202405/products/{product_id}/promotion_link/generate (POST)
   */
  async generateAffiliateProductPromotionLink(params: GenerateAffiliateProductPromotionLinkRequest, opts?: TikTokRequestOptions): Promise<GenerateAffiliateProductPromotionLinkResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_seller/202405/products/{product_id}/promotion_link/generate","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":["product_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GenerateTargetCollaborationLink
   * /affiliate_seller/202509/target_collaboration/{target_collaboration_id}/link (POST)
   */
  async generateTargetCollaborationLink(params: GenerateTargetCollaborationLinkRequest, opts?: TikTokRequestOptions): Promise<GenerateTargetCollaborationLinkResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_seller/202509/target_collaboration/{target_collaboration_id}/link","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":["target_collaboration_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetConversationList
   * /affiliate_seller/202505/conversations (GET)
   */
  async getConversationList(params: GetConversationListRequest, body?: GetConversationListBody, opts?: TikTokRequestOptions): Promise<GetConversationListResponse> {
    return this.client.request({"method":"GET","path":"/affiliate_seller/202505/conversations","baseUrl":"https://open-api.tiktokglobalshop.com","query":["page_size","page_token","only_need_conversation_id","shop_cipher"],"headers":[],"pathParams":[],"body":["only_need_conversation_id"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GetLatestUnreadMessages
   * /affiliate_seller/202412/conversations/messages/list/newest (GET)
   */
  async getLatestUnreadMessages(params: GetLatestUnreadMessagesRequest, opts?: TikTokRequestOptions): Promise<GetLatestUnreadMessagesResponse> {
    return this.client.request({"method":"GET","path":"/affiliate_seller/202412/conversations/messages/list/newest","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetMarketplaceCreatorPerformance
   * /affiliate_seller/202508/marketplace_creators/{creator_user_id} (GET)
   */
  async getMarketplaceCreatorPerformance(params: GetMarketplaceCreatorPerformanceRequest, opts?: TikTokRequestOptions): Promise<GetMarketplaceCreatorPerformanceResponse> {
    return this.client.request({"method":"GET","path":"/affiliate_seller/202508/marketplace_creators/{creator_user_id}","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":["creator_user_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetMessageintheConversation
   * /affiliate_seller/202412/conversation/{conversation_id}/messages (GET)
   */
  async getMessageintheConversation(params: GetMessageintheConversationRequest, opts?: TikTokRequestOptions): Promise<GetMessageintheConversationResponse> {
    return this.client.request({"method":"GET","path":"/affiliate_seller/202412/conversation/{conversation_id}/messages","baseUrl":"https://open-api.tiktokglobalshop.com","query":["page_size","page_token","shop_cipher"],"headers":[],"pathParams":["conversation_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetOpenCollaborationCreatorContentDetail
   * /affiliate_seller/202508/open_collaborations/creator_content_details (GET)
   */
  async getOpenCollaborationCreatorContentDetail(params: GetOpenCollaborationCreatorContentDetailRequest, opts?: TikTokRequestOptions): Promise<GetOpenCollaborationCreatorContentDetailResponse> {
    return this.client.request({"method":"GET","path":"/affiliate_seller/202508/open_collaborations/creator_content_details","baseUrl":"https://open-api.tiktokglobalshop.com","query":["page_token","page_size","product_id","shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetOpenCollaborationSampleRules
   * /affiliate_seller/202410/open_collaborations/sample_rules (GET)
   */
  async getOpenCollaborationSampleRules(params: GetOpenCollaborationSampleRulesRequest, opts?: TikTokRequestOptions): Promise<GetOpenCollaborationSampleRulesResponse> {
    return this.client.request({"method":"GET","path":"/affiliate_seller/202410/open_collaborations/sample_rules","baseUrl":"https://open-api.tiktokglobalshop.com","query":["product_ids","shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetOpenCollaborationSettings
   * /affiliate_seller/202409/open_collaboration_settings (GET)
   */
  async getOpenCollaborationSettings(params: GetOpenCollaborationSettingsRequest, opts?: TikTokRequestOptions): Promise<GetOpenCollaborationSettingsResponse> {
    return this.client.request({"method":"GET","path":"/affiliate_seller/202409/open_collaboration_settings","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetSellerSearchCreatorMarketplaceAdvancedFilters
   * /affiliate_seller/202601/marketplace_creators/search/filter (POST)
   */
  async getSellerSearchCreatorMarketplaceAdvancedFilters(params: GetSellerSearchCreatorMarketplaceAdvancedFiltersRequest, opts?: TikTokRequestOptions): Promise<GetSellerSearchCreatorMarketplaceAdvancedFiltersResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_seller/202601/marketplace_creators/search/filter","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * MarkConversationRead
   * /affiliate_seller/202412/conversatons/read (POST)
   */
  async markConversationRead(params: MarkConversationReadRequest, body?: MarkConversationReadBody, opts?: TikTokRequestOptions): Promise<MarkConversationReadResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_seller/202412/conversatons/read","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":["conversation_ids"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * QueryTargetCollaborationDetail
   * /affiliate_seller/202508/target_collaborations/{target_collaboration_id} (GET)
   */
  async queryTargetCollaborationDetail(params: QueryTargetCollaborationDetailRequest, opts?: TikTokRequestOptions): Promise<QueryTargetCollaborationDetailResponse> {
    return this.client.request({"method":"GET","path":"/affiliate_seller/202508/target_collaborations/{target_collaboration_id}","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":["target_collaboration_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * RemoveCreatorFromOpenCollaboration
   * /affiliate_seller/202508/open_collaborations/{open_collaboration_id}/remove_creator (POST)
   */
  async removeCreatorFromOpenCollaboration(params: RemoveCreatorFromOpenCollaborationRequest, body?: RemoveCreatorFromOpenCollaborationBody, opts?: TikTokRequestOptions): Promise<RemoveCreatorFromOpenCollaborationResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_seller/202508/open_collaborations/{open_collaboration_id}/remove_creator","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":["open_collaboration_id"],"body":["creator_user_open_id","product_id"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * RemoveOpenCollaboration
   * /affiliate_seller/202409/open_collaborations/products/{product_id} (DELETE)
   */
  async removeOpenCollaboration(params: RemoveOpenCollaborationRequest, opts?: TikTokRequestOptions): Promise<RemoveOpenCollaborationResponse> {
    return this.client.request({"method":"DELETE","path":"/affiliate_seller/202409/open_collaborations/products/{product_id}","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":["product_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * RemoveTargetCollaboration
   * /affiliate_seller/202409/target_collaborations/{target_collaboration_id} (DELETE)
   */
  async removeTargetCollaboration(params: RemoveTargetCollaborationRequest, opts?: TikTokRequestOptions): Promise<RemoveTargetCollaborationResponse> {
    return this.client.request({"method":"DELETE","path":"/affiliate_seller/202409/target_collaborations/{target_collaboration_id}","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":["target_collaboration_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * SearchOpenCollaboration
   * /affiliate_seller/202412/open_collaborations/search (POST)
   */
  async searchOpenCollaboration(params: SearchOpenCollaborationRequest, body?: SearchOpenCollaborationBody, opts?: TikTokRequestOptions): Promise<SearchOpenCollaborationResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_seller/202412/open_collaborations/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":["page_token","page_size","sort_order","sort_field","shop_cipher"],"headers":[],"pathParams":[],"body":["keyword","keyword_type","top_level_category_id"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * SearchSellerAffiliateOrders
   * /affiliate_seller/202410/orders/search (POST)
   */
  async searchSellerAffiliateOrders(params: SearchSellerAffiliateOrdersRequest, body?: SearchSellerAffiliateOrdersBody, opts?: TikTokRequestOptions): Promise<SearchSellerAffiliateOrdersResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_seller/202410/orders/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":["page_token","page_size","shop_cipher"],"headers":[],"pathParams":[],"body":["create_time_ge","create_time_lt","program_id"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * SearchTargetCollaborations
   * /affiliate_seller/202508/target_collaborations/search (POST)
   */
  async searchTargetCollaborations(params: SearchTargetCollaborationsRequest, body?: SearchTargetCollaborationsBody, opts?: TikTokRequestOptions): Promise<SearchTargetCollaborationsResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_seller/202508/target_collaborations/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":["page_size","page_token","shop_cipher"],"headers":[],"pathParams":[],"body":["collaboration_status","creator_accept_status","creator_user_open_id","free_sample_setting","search_param"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * SellerGetSampleRequestDeeplink
   * /affiliate_seller/202512/sample_applications/deeplink (GET)
   */
  async sellerGetSampleRequestDeeplink(params: SellerGetSampleRequestDeeplinkRequest, opts?: TikTokRequestOptions): Promise<SellerGetSampleRequestDeeplinkResponse> {
    return this.client.request({"method":"GET","path":"/affiliate_seller/202512/sample_applications/deeplink","baseUrl":"https://open-api.tiktokglobalshop.com","query":["product_id","sku_id","campaign_id","collaboration_id","valid_days","shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * SellerReviewSampleApplications
   * /affiliate_seller/202507/sample_applications/{application_id}/review (POST)
   */
  async sellerReviewSampleApplications(params: SellerReviewSampleApplicationsRequest, body?: SellerReviewSampleApplicationsBody, opts?: TikTokRequestOptions): Promise<SellerReviewSampleApplicationsResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_seller/202507/sample_applications/{application_id}/review","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":["application_id"],"body":["reject_reason","review_result"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * SellerSearchAffiliateOpenCollaborationProduct
   * /affiliate_seller/202405/open_collaborations/products/search (POST)
   */
  async sellerSearchAffiliateOpenCollaborationProduct(params: SellerSearchAffiliateOpenCollaborationProductRequest, body?: SellerSearchAffiliateOpenCollaborationProductBody, opts?: TikTokRequestOptions): Promise<SellerSearchAffiliateOpenCollaborationProductResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_seller/202405/open_collaborations/products/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":["sort_order","sort_field","page_token","page_size","shop_cipher"],"headers":[],"pathParams":[],"body":["category","commission_rate_range","sales_price_range","title_keywords"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * SellerSearchCreatoronMarketplace
   * /affiliate_seller/202508/marketplace_creators/search (POST)
   */
  async sellerSearchCreatoronMarketplace(params: SellerSearchCreatoronMarketplaceRequest, body?: SellerSearchCreatoronMarketplaceBody, opts?: TikTokRequestOptions): Promise<SellerSearchCreatoronMarketplaceResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_seller/202508/marketplace_creators/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":["page_token","page_size","shop_cipher"],"headers":[],"pathParams":[],"body":["advanced_filters","affiliate_data","category","content_performance","follower_demographics","gmv_ranges","keyword","search_key","units_sold_ranges"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * SellerSearchSampleApplications
   * /affiliate_seller/202508/sample_applications/search (POST)
   */
  async sellerSearchSampleApplications(params: SellerSearchSampleApplicationsRequest, body?: SellerSearchSampleApplicationsBody, opts?: TikTokRequestOptions): Promise<SellerSearchSampleApplicationsResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_seller/202508/sample_applications/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":["page_token","page_size","shop_cipher"],"headers":[],"pathParams":[],"body":["creator_user_oepn_id","order_id","product_id","status","target_collabration_id","title","username"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * SellerSearchSampleApplicationsFulfillments
   * /affiliate_seller/202409/sample_applications/{application_id}/fulfillments/search (POST)
   */
  async sellerSearchSampleApplicationsFulfillments(params: SellerSearchSampleApplicationsFulfillmentsRequest, body?: SellerSearchSampleApplicationsFulfillmentsBody, opts?: TikTokRequestOptions): Promise<SellerSearchSampleApplicationsFulfillmentsResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_seller/202409/sample_applications/{application_id}/fulfillments/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":["application_id"],"body":["content_format"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * SendIMMessage
   * /affiliate_seller/202412/conversations/{conversation_id}/messages (POST)
   */
  async sendIMMessage(params: SendIMMessageRequest, body?: SendIMMessageBody, opts?: TikTokRequestOptions): Promise<SendIMMessageResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_seller/202412/conversations/{conversation_id}/messages","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":["conversation_id"],"body":["content","msg_type"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * UpdateTargetCollaboration
   * /affiliate_seller/202508/target_collaborations/{target_collaboration_id} (PUT)
   */
  async updateTargetCollaboration(params: UpdateTargetCollaborationRequest, body?: UpdateTargetCollaborationBody, opts?: TikTokRequestOptions): Promise<UpdateTargetCollaborationResponse> {
    return this.client.request({"method":"PUT","path":"/affiliate_seller/202508/target_collaborations/{target_collaboration_id}","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":["target_collaboration_id"],"body":["creator_user_open_ids","end_time","free_sample_rule","name","products","seller_contact_info"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * UploadMessageImage
   * /affiliate_seller/202511/images/upload (POST)
   */
  async uploadMessageImage(params: UploadMessageImageRequest, opts?: TikTokRequestOptions): Promise<UploadMessageImageResponse> {
    return this.client.request({"method":"POST","path":"/affiliate_seller/202511/images/upload","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }
}
