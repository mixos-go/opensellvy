// AUTO-GENERATED from TikTok Shop reference docs (references/api/analytics).
// Do not edit by hand; run `npm run generate` in sdk/.

import { TikTokClient } from '../../tts.client'
import { TikTokRequestOptions } from '../../tts.types'

export interface GetGMVTrendPerformancesRequest {
  /** live stream room id (path) */
  "live_room_id": string,
}

export interface GetGMVTrendPerformancesResponse {
  "code"?: number,
  "data"?: {
  "gmv_trend_performances"?: Array<{
    "data_points"?: {
      "gmv"?: {
        "amount"?: string,
        "currency"?: string,
      },
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetInteractiveTrendPerformancesRequest {
  /** live stream room id (path) */
  "live_room_id": string,
}

export interface GetInteractiveTrendPerformancesResponse {
  "code"?: number,
  "data"?: {
  "interactive_trend_performances"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetLiveCoreStatsRequest {
  /** the live stream room id (path) */
  "live_room_id": string,
}

export interface GetLiveCoreStatsResponse {
  "code"?: number,
  "data"?: {
  "stats"?: {
    "accumulated_comment_count"?: number,
    "accumulated_new_follower_count"?: number,
    "accumulated_sharing_count"?: number,
    "avg_watching_duration"?: number,
    "buyer_count"?: number,
    "click_order_rate"?: string,
    "click_through_rate"?: string,
    "created_order_count"?: number,
    "current_visitor_count"?: number,
    "local_gmv"?: {
      "amount"?: string,
      "currency"?: string,
    },
    "local_unit_price"?: {
      "amount"?: string,
      "currency"?: string,
    },
    "paid_order_count"?: number,
    "peak_concurrent_user_count"?: number,
    "product_reach_count"?: number,
    "product_view_count"?: number,
    "sales"?: number,
    "watch_pv"?: number,
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetProductStatsRequest {
  /** live stream room id (path) */
  "live_room_id": string,
}

export interface GetProductStatsResponse {
  "code"?: number,
  "data"?: {
  "product_stats"?: Array<{
    "local_gmv"?: {
      "amount"?: string,
      "currency"?: string,
    },
    "local_unit_price"?: {
      "amount"?: string,
      "currency"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetShopLIVEPerformanceListRequest {
  /** Start date (ISO 8601 YYYY-MM-DD format) in shop registered timezone. In the parameter name, "ge" refers to "greater than or equal to" (inclusive) */
  "start_date_ge": string,
  /** End date (ISO 8601 YYYY-MM-DD format) in shop registered timezone. In the parameter name, "lt" refers to "less than" (exclusive) */
  "end_date_lt": string,
  /** Number of products per page. Max value: 100 Default value: 10 */
  "page_size"?: number,
  /** Field to sort on. Default: gmv Available values: - gmv - products_added - different_products_sold - sku_orders - items_sold - customers - 24h_live_gmv */
  "sort_field"?: string,
  /** Sort direction. Available values: ASC, DESC Default value: DESC */
  "sort_order"?: string,
  /** Currency. Available values: USD, LOCAL Default value: LOCAL */
  "currency"?: string,
  /** Page token, indicating the current position. Used for requesting next page data. Leave this field empty for first time queries. */
  "page_token"?: string,
  /** Types of the accounts under which videos were created. Available values: ALL, OFFICIAL_ACCOUNTS, MARKETING_ACCOUNTS, AFFILIATE_ACCOUNTS Default value: ALL */
  "account_type"?: string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetShopLIVEPerformanceListResponse {
  "code"?: number,
  "data"?: {
  "latest_available_date"?: string,
  "live_stream_sessions"?: Array<{
    "interaction_performance"?: {
      "acu"?: number,
      "avg_viewing_duration"?: string,
      "click_through_rate"?: string,
      "comments"?: number,
      "likes"?: number,
      "new_followers"?: number,
      "pcu"?: number,
      "product_clicks"?: number,
      "product_impressions"?: number,
      "shares"?: number,
      "viewers"?: number,
      "views"?: number,
    },
    "sales_performance"?: {
      "24h_live_gmv"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "avg_price"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "click_to_order_rate"?: string,
      "created_sku_orders"?: number,
      "customers"?: number,
      "different_products_sold"?: number,
      "gmv"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "items_sold"?: number,
      "products_added"?: number,
      "sku_orders"?: number,
    },
  }>,
  "next_page_token"?: string,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetShopLIVEPerformanceListOLDRequest {
  /** Start date (ISO 8601 YYYY-MM-DD format) in shop registered timezone. In the parameter name, "ge" refers to "greater than or equal to" (inclusive) */
  "start_date_ge": string,
  /** End date (ISO 8601 YYYY-MM-DD format) in shop registered timezone. In the parameter name, "lt" refers to "less than" (exclusive) */
  "end_date_lt": string,
  /** Number of products per page. Max value: 100 Default value: 10 */
  "page_size"?: string,
  /** Field to sort on. Default: gmv Available values: */
  "sort_field"?: string,
  /** Sort direction. Available values: ASC, DESC Default value: DESC */
  "sort_order"?: string,
  /** Currency. Available values: USD, LOCAL Default value: LOCAL */
  "currency"?: string,
  /** Page token, indicating the current position. Used for requesting next page data. Leave this field empty for first time queries. */
  "page_token"?: string,
  /** Types of the accounts under which videos were created. Available values: ALL, OFFICIAL_ACCOUNTS, MARKETING_ACCOUNTS, MARKETING_ACCOUNTS Default value: ALL */
  "account_type"?: string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetShopLIVEPerformanceListOLDResponse {
  "code"?: number,
  "data"?: {
  "latest_available_date"?: string,
  "live_stream_sessions"?: Array<{
    "interaction_performance"?: {
      "acu"?: number,
      "avg_viewing_duration"?: string,
      "click_through_rate"?: string,
      "comments"?: number,
      "likes"?: number,
      "new_followers"?: number,
      "pcu"?: number,
      "product_clicks"?: number,
      "product_impressions"?: number,
      "shares"?: number,
      "viewers"?: number,
      "views"?: number,
    },
    "sales_performance"?: {
      "24h_live_gmv"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "avg_price"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "click_to_order_rate"?: string,
      "created_sku_orders"?: number,
      "customers"?: number,
      "different_products_sold"?: number,
      "gmv"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "products_added"?: number,
      "sku_orders"?: number,
      "unit_sold"?: number,
    },
  }>,
  "next_page_token"?: string,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetShopLIVEPerformanceOverviewRequest {
  /** Start date (ISO 8601 YYYY-MM-DD format) in shop registered timezone. In the parameter name, "ge" refers to "greater than or equal to" (inclusive) */
  "start_date_ge": string,
  /** End date (ISO 8601 YYYY-MM-DD format) in shop registered timezone. In the parameter name, "lt" refers to "less than" (exclusive) */
  "end_date_lt": string,
  /** If "today" is set to true, start_date_ge and end_date_lt will be overwritten. The response will contain real-time metrics of today (local time) */
  "today"?: boolean,
  /** Granularity of the data. Available values: ALL, 1D Default value: ALL */
  "granularity"?: string,
  /** Currency. Available values: USD, LOCAL Default value: LOCAL */
  "currency"?: string,
  /** Types of the accounts under which videos were created. Available values: ALL, OFFICIAL_ACCOUNTS, MARKETING_ACCOUNTS, AFFILIATE_ACCOUNTS Default value: ALL */
  "account_type"?: string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetShopLIVEPerformanceOverviewResponse {
  "code"?: number,
  "data"?: {
  "latest_available_date"?: string,
  "performance"?: {
    "intervals"?: Array<{
      "gmv"?: {
        "amount"?: string,
        "currency"?: string,
      },
    }>,
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetShopLIVEPerformanceOverviewOLDRequest {
  /** Start date (ISO 8601 YYYY-MM-DD format) in shop registered timezone. In the parameter name, "ge" refers to "greater than or equal to" (inclusive) */
  "start_date_ge": string,
  /** End date (ISO 8601 YYYY-MM-DD format) in shop registered timezone. In the parameter name, "lt" refers to "less than" (exclusive) */
  "end_date_lt": string,
  /** Whether previous period data is returned for comparison. Available values: true, false Default value: false The previous period has the same length and granularity as the current period with end time being the same as the start time of the current period. Example: If start_time_ge = 2024-04-01 and e */
  "with_comparison"?: boolean,
  /** Granularity of the data. Available values: ALL, 1D Default value: ALL */
  "granularity"?: string,
  /** Currency. Available values: USD, LOCAL Default value: LOCAL */
  "currency"?: string,
  /** Types of the accounts under which videos were created. Available values: ALL, OFFICIAL_ACCOUNTS, MARKETING_ACCOUNTS, AFFILIATE_ACCOUNTS Default value: ALL */
  "account_type"?: string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetShopLIVEPerformanceOverviewOLDResponse {
  "code"?: number,
  "data"?: {
  "latest_available_date"?: string,
  "performance"?: {
    "comparison_intervals"?: Array<{
      "gmv"?: {
        "amount"?: string,
        "currency"?: string,
      },
    }>,
    "intervals"?: Array<{
      "gmv"?: {
        "amount"?: string,
        "currency"?: string,
      },
    }>,
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetShopLIVEPerformancePerMinutesRequest {
  /** TTS LIVE session ID (path) */
  "live_id": string,
  /** Page token, indicating the current position. The page_token is empty by default, indicating first position. */
  "page_token"?: string,
  /** USD or LOCAL */
  "currency"?: string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetShopLIVEPerformancePerMinutesResponse {
  "code"?: number,
  "data"?: {
  "next_page_token"?: string,
  "performance"?: {
    "intervals"?: Array<{
      "conversion"?: {
        "avg_price"?: {
          "amount"?: string,
          "currency"?: string,
        },
        "click_to_order_rate"?: {
          "main_order_ctor"?: string,
          "sku_order_ctor"?: string,
        },
        "created_sku_orders"?: number,
        "gpm"?: {
          "show_gpm"?: string,
          "watch_gpm"?: string,
        },
        "sku_order_rate"?: string,
      },
      "interactions"?: {
        "comment_rate"?: string,
        "comments"?: number,
        "follow_rate"?: string,
        "like_rate"?: string,
        "likes"?: number,
        "new_followers"?: number,
        "share_rate"?: string,
        "shares"?: number,
      },
      "sales"?: {
        "customers"?: number,
        "gmv"?: {
          "amount"?: string,
          "currency"?: string,
        },
        "items_sold"?: number,
        "main_orders"?: number,
        "sku_orders"?: number,
      },
      "traffic"?: {
        "ctr"?: string,
        "enter_room_rate"?: string,
        "impressions"?: number,
        "product_clicks"?: number,
        "product_impressions"?: number,
        "viewers"?: number,
        "views"?: number,
      },
    }>,
    "overall"?: {
      "duration"?: number,
      "end_time"?: number,
      "gmv"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "impressions"?: number,
      "items_sold"?: number,
      "live_title"?: string,
      "start_time"?: number,
      "unique_viewers"?: number,
    },
  },
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetShopLIVEProductsPerformanceListRequest {
  /** TTS LIVE session ID (path) */
  "live_id": string,
  /** Sort direction. Available values: ASC, DESC Default value: DESC */
  "sort_order"?: string,
  /** Field to sort on. Default: gmv Available values: - direct_gmv - items_sold - customers - created_sku_orders - sku_orders - main_orders - product_impressions - produt_clicks */
  "sort_field"?: string,
  /** USD or LOCAL */
  "currency"?: string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetShopLIVEProductsPerformanceListResponse {
  "code"?: number,
  "data"?: {
  "products"?: Array<{
    "sales"?: {
      "avg_price"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "created_sku_orders"?: number,
      "customers"?: number,
      "direct_gmv"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "items_sold"?: number,
      "main_orders"?: number,
      "payment_rate"?: string,
      "sku_orders"?: number,
    },
    "traffic"?: {
      "add_to_cart_count"?: number,
      "click_to_order_rate"?: {
        "main_order_ctor"?: string,
        "sku_order_ctor"?: string,
      },
      "ctr"?: string,
      "gpm"?: {
        "watch_gpm"?: string,
      },
      "product_impressions"?: number,
      "produt_clicks"?: number,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetShopPerformanceRequest {
  /** Start date (ISO 8601 YYYY-MM-DD format) in shop registered timezone. In the parameter name, "ge" refers to "greater than or equal to" (inclusive) */
  "start_date_ge": string,
  /** End date (ISO 8601 YYYY-MM-DD format) in shop registered timezone. In the parameter name, "lt" refers to "less than" (exclusive) */
  "end_date_lt": string,
  /** Granularity of the data. Available values: ALL, 1D Default value: ALL * ALL: aggregate * 1D: daily */
  "granularity"?: string,
  /** Currency. Available values: USD, LOCAL Default value: LOCAL * USD: US dollars * LOCAL: local currency where the shop is located */
  "currency"?: string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetShopPerformanceResponse {
  "code"?: number,
  "data"?: {
  "latest_available_date"?: string,
  "performance"?: {
    "intervals"?: Array<{
      "sales"?: {
        "avg_customers_count"?: number,
        "gmv"?: {
          "breakdowns"?: Array<{
            "gmv"?: {
              "amount"?: string,
              "currency"?: string,
            },
          }>,
          "overall"?: {
            "amount"?: string,
            "currency"?: string,
          },
        },
        "gross_revenue"?: {
          "breakdowns"?: Array<Record<string, unknown>>,
          "overall"?: {
            "amount"?: string,
            "currency"?: string,
          },
        },
        "items_sold"?: number,
        "orders_count"?: number,
        "refunds"?: {
          "amount"?: string,
          "currency"?: string,
        },
        "sku_orders_count"?: number,
      },
      "traffic"?: {
        "avg_conversation_rate"?: string,
        "avg_page_views"?: number,
        "avg_visitors"?: number,
      },
    }>,
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetShopPerformancePerHourRequest {
  /** (ISO 8601 YYYY-MM-DD format) in shop registered timezone. (path) */
  "date": string,
  /** Currency. Available values: USD, LOCAL Default value: LOCAL * USD: US dollars * LOCAL: local currency where the shop is located */
  "currency"?: string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetShopPerformancePerHourResponse {
  "code"?: number,
  "data"?: {
  "performance"?: {
    "intervals"?: Array<{
      "gmv"?: {
        "amount"?: string,
        "currency"?: string,
      },
    }>,
    "latest_available_timestamp"?: number,
    "overall"?: {
      "customers"?: number,
      "gmv"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "items_sold"?: number,
      "visitors"?: number,
    },
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetShopProductPerformanceDetailRequest {
  /** product id (path) */
  "product_id": string,
  /** Start date (ISO 8601 YYYY-MM-DD format) in shop registered timezone. In the parameter name, "ge" refers to "greater than or equal to" (inclusive) */
  "start_date_ge": string,
  /** End date (ISO 8601 YYYY-MM-DD format) in shop registered timezone. In the parameter name, "lt" refers to "less than" (exclusive) */
  "end_date_lt": string,
  /** Granularity of the data. Available values: ALL, 1D Default value: ALL * ALL: aggregate * 1D: daily */
  "granularity"?: string,
  /** Currency. Available values: USD, LOCAL Default value: LOCAL * USD: US dollars * LOCAL: local currency where the shop is located */
  "currency"?: string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetShopProductPerformanceDetailResponse {
  "code"?: number,
  "data"?: {
  "latest_available_date"?: string,
  "performance"?: {
    "intervals"?: Array<{
      "cancel_and_refunds"?: {
        "canceled"?: number,
        "refunded"?: number,
        "replacements"?: number,
        "returned"?: number,
      },
      "sales"?: Array<{
        "breakdowns"?: Array<{
          "sales"?: {
            "avg_customers"?: number,
            "gmv"?: {
              "amount"?: string,
              "currency"?: string,
            },
            "items_sold"?: number,
          },
        }>,
        "gmv"?: {
          "amount"?: string,
          "currency"?: string,
        },
        "items_sold"?: number,
        "orders"?: number,
      }>,
      "traffic"?: Array<{
        "breakdowns"?: Array<{
          "traffic"?: {
            "avg_conversion_rate"?: string,
            "avg_unique_page_views"?: number,
            "ctr"?: string,
            "impressions"?: number,
            "page_views"?: number,
          },
        }>,
      }>,
    }>,
    "ratings"?: Array<Record<string, unknown>>,
    "top_contents"?: Array<{
      "contents"?: {
        "gmv"?: {
          "amount"?: string,
          "currency"?: string,
        },
      },
    }>,
    "top_creators"?: Array<{
      "gmv"?: {
        "amount"?: string,
        "currency"?: string,
      },
    }>,
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetShopProductPerformanceListRequest {
  /** Start date (ISO 8601 YYYY-MM-DD format) in shop registered timezone. In the parameter name, "ge" refers to "greater than or equal to" (inclusive) */
  "start_date_ge": string,
  /** End date (ISO 8601 YYYY-MM-DD format) in shop registered timezone. In the parameter name, "lt" refers to "less than" (exclusive) */
  "end_date_lt": string,
  /** Number of products per page. Max value: 100 Default value: 10 */
  "page_size"?: number,
  /** Page token, indicating the current position. Used for requesting next page data. Leave this field empty for first time queries. */
  "page_token"?: string,
  /** Field to sort on. Default: gmv Available values: - gmv - items_sold - orders */
  "sort_field"?: string,
  /** Sort direction. Available values: ASC, DESC Default value: DESC * ASC: ascending * DESC: descending */
  "sort_order"?: string,
  /** Currency. Available values: USD, LOCAL Default value: LOCAL * USD: US dollars * LOCAL: local currency where the shop is located */
  "currency"?: string,
  /** Category id array */
  "category_filter"?: Array<string>,
  /** LIVE INACTIVE ALL (default) */
  "product_status_filter"?: string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetShopProductPerformanceListResponse {
  "code"?: number,
  "data"?: {
  "latest_available_date"?: string,
  "next_page_token"?: string,
  "products"?: Array<{
    "overall_performance"?: {
      "gmv"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "items_sold"?: number,
      "orders"?: number,
    },
  }>,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetShopSKUPerformanceRequest {
  /** SKU ID (path) */
  "sku_id": string,
  /** Start time (ISO 8601 YYYY-MM-DD format) in shop registered timezone, inclusive. */
  "start_date_ge": string,
  /** End time (ISO 8601 YYYY-MM-DD format) in shop registered timezone, exclusive. */
  "end_date_lt": string,
  /** Granularity of the data. Available values: ALL, 1D Default value: ALL * ALL: aggregate * 1D: daily */
  "granularity"?: string,
  /** Currency: - USD: US dollars - LOCAL (default): Local currency where the shop is located */
  "currency"?: string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetShopSKUPerformanceResponse {
  "code"?: number,
  "data"?: {
  "latest_available_date"?: string,
  "performance"?: {
    "intervals"?: Array<{
      "gmv"?: {
        "amount"?: string,
        "currency"?: string,
      },
    }>,
    "product_id"?: number,
    "sku_id"?: string,
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetShopSKUPerformanceListRequest {
  /** Start time (ISO 8601 YYYY-MM-DD format) in shop registered timezone, inclusive. */
  "start_date_ge": string,
  /** End time (ISO 8601 YYYY-MM-DD format) in shop registered timezone, exclusive. */
  "end_date_lt": string,
  /** Number of records per page. The maximum page_size value is 100 */
  "page_size"?: number,
  /** Page token, indicating the current position. The page_token is empty by default, indicating first position. */
  "page_token"?: string,
  /** Sort field, possible values: - gmv (default) - sku_orders - units_sold */
  "sort_field"?: string,
  /** Sort direction, possible values: - DESC (default) - ASC */
  "sort_order"?: string,
  /** Category id array */
  "category_filter"?: Array<string>,
  /** LIVE INACTIVE ALL (default) */
  "product_status_filter"?: string,
  /** Filter SKUs by product IDs. If product_ids are provided, the API will only return SKUs for the given product IDs, otherwise it will return all SKUs for the shop */
  "product_ids"?: Array<string>,
  /** Currency: - USD: US dollars - LOCAL (default): Local currency where the shop is located */
  "currency"?: string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetShopSKUPerformanceListResponse {
  "code"?: number,
  "data"?: {
  "latest_available_date"?: string,
  "next_page_token"?: string,
  "skus"?: Array<{
    "gmv"?: {
      "amount"?: string,
      "currency"?: string,
    },
  }>,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetShopVideoPerformanceDetailsRequest {
  /** Video ID (path) */
  "video_id": string,
  /** Start date (ISO 8601 YYYY-MM-DD format) in shop registered timezone. In the parameter name, "ge" refers to "greater than or equal to" (inclusive) */
  "start_date_ge": string,
  /** End date (ISO 8601 YYYY-MM-DD format) in shop registered timezone. In the parameter name, "lt" refers to "less than" (exclusive) */
  "end_date_lt": string,
  /** Granularity of the data. Available values: ALL, 1D Default value: ALL * ALL: aggregate * 1D: daily */
  "granularity"?: string,
  /** Currency. Available values: USD, LOCAL Default value: LOCAL * USD: US dollars * LOCAL: local currency where the shop is located */
  "currency"?: string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetShopVideoPerformanceDetailsResponse {
  "code"?: number,
  "data"?: {
  "latest_available_date"?: string,
  "performance"?: {
    "intervals"?: Array<{
      "sales"?: Array<{
        "breakdowns"?: Array<{
          "gmv"?: {
            "amount"?: string,
            "currency"?: string,
          },
          "gpm"?: {
            "amount"?: string,
            "currency"?: string,
          },
        }>,
        "overall"?: {
          "ctr"?: string,
          "customers"?: number,
          "gmv"?: {
            "amount"?: string,
            "currency"?: string,
          },
          "gpm"?: {
            "amount"?: string,
            "currency"?: string,
          },
          "items_sold"?: number,
          "product_clicks"?: number,
          "product_impressions"?: number,
        },
      }>,
      "traffic"?: {
        "comments"?: number,
        "likes"?: number,
        "new_followers"?: number,
        "shares"?: number,
        "views"?: number,
      },
    }>,
    "viewer_profile"?: Array<Record<string, unknown>>,
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetShopVideoPerformanceListRequest {
  /** Start date (ISO 8601 YYYY-MM-DD format) in shop registered timezone. In the parameter name, "ge" refers to "greater than or equal to" (inclusive) */
  "start_date_ge": string,
  /** End date (ISO 8601 YYYY-MM-DD format) in shop registered timezone. In the parameter name, "lt" refers to "less than" (exclusive) */
  "end_date_lt": string,
  /** Number of products per page. Max value: 100 Default value: 10 */
  "page_size"?: number,
  /** Sort on. Default value: gmv Available values: - gmv - gpm - avg_customers - sku_orders - items_sold - views - click_through_rate */
  "sort_field"?: string,
  /** Sort direction. Available values: ASC, DESC Default value: DESC * ASC: ascending * DESC: descending */
  "sort_order"?: string,
  /** Currency. Available values: USD, LOCAL Default value: LOCAL * USD: US dollars * LOCAL: local currency where the shop is located */
  "currency"?: string,
  /** Page token, indicating the current position. Used for requesting next page data. Leave this field empty for first time queries. */
  "page_token"?: string,
  /** Types of the accounts under which videos were created. Available values: ALL, OFFICIAL_ACCOUNTS, MARKETING_ACCOUNTS, AFFILIATE_ACCOUNTS Default value: ALL - ALL: all account types - OFFICIAL_ACCOUNTS, - MARKETING_ACCOUNTS, - AFFILIATE_ACCOUNTS */
  "account_type"?: string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetShopVideoPerformanceListResponse {
  "code"?: number,
  "data"?: {
  "latest_available_date"?: string,
  "next_page_token"?: string,
  "total_count"?: number,
  "videos"?: Array<{
    "gmv"?: {
      "amount"?: string,
      "currency"?: string,
    },
    "gpm"?: {
      "amount"?: string,
      "currency"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetShopVideoPerformanceOverviewRequest {
  /** Start date (ISO 8601 YYYY-MM-DD format) in shop registered timezone. In the parameter name, "ge" refers to "greater than or equal to" (inclusive) */
  "start_date_ge": string,
  /** End date (ISO 8601 YYYY-MM-DD format) in shop registered timezone. In the parameter name, "lt" refers to "less than" (exclusive) */
  "end_date_lt": string,
  /** If "today" is set to true, start_date_ge and end_date_lt will be overwritten. The response will contain real-time metrics of today (local time) */
  "today"?: boolean,
  /** Granularity of the data. Available values: ALL, 1D Default value: ALL * ALL: aggregate * 1D: daily */
  "granularity"?: string,
  /** Currency. Available values: USD, LOCAL Default value: LOCAL * USD: US dollars * LOCAL: local currency where the shop is located */
  "currency"?: string,
  /** Types of the accounts under which videos were created. Available values: ALL, OFFICIAL_ACCOUNTS, MARKETING_ACCOUNTS, AFFILIATE_ACCOUNTS Default value: ALL - ALL: all account types - OFFICIAL_ACCOUNTS, - MARKETING_ACCOUNTS, - AFFILIATE_ACCOUNTS */
  "account_type"?: string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetShopVideoPerformanceOverviewResponse {
  "code"?: number,
  "data"?: {
  "latest_available_date"?: string,
  "performance"?: {
    "intervals"?: Array<{
      "gmv"?: {
        "amount"?: string,
        "currency"?: string,
      },
    }>,
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetShopVideoProductPerformanceListRequest {
  /** Video ID (path) */
  "video_id": string,
  /** End date (ISO 8601 YYYY-MM-DD format) in shop registered timezone. In the parameter name, "lt" refers to "less than" (exclusive) */
  "end_date_lt": string,
  /** Number of products per page. Max value: 100 Default value: 10 */
  "page_size"?: number,
  /** Sort on. Available values: gmv, units_sold, daily_avg_buyers Default value: gmv */
  "sort_field"?: string,
  /** Sort direction. Available values: ASC, DESC Default value: DESC * ASC: ascending * DESC: descending */
  "sort_order"?: string,
  /** Currency. Available values: USD, LOCAL Default value: LOCAL * USD: US dollars * LOCAL: local currency where the shop is located */
  "currency"?: string,
  /** Page token, indicating the current position. Used for requesting next page data. Leave this field empty for first time queries. */
  "page_token"?: string,
  /** Start date (ISO 8601 YYYY-MM-DD format) in shop registered timezone. In the parameter name, "ge" refers to "greater than or equal to" (inclusive) */
  "start_date_ge": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetShopVideoProductPerformanceListResponse {
  "code"?: number,
  "data"?: {
  "latest_available_date"?: string,
  "next_page_token"?: string,
  "products"?: Array<{
    "gmv"?: {
      "amount"?: string,
      "currency"?: string,
    },
  }>,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetTrafficPerformancesRequest {
  /** live stream room id (path) */
  "live_room_id": string,
}

export interface GetTrafficPerformancesResponse {
  "code"?: number,
  "data"?: {
  "traffic_performances"?: Array<{
    "source"?: {
      "name"?: string,
      "watch_pv"?: number,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetUserPortraitsRequest {
  /** live stream room id (path) */
  "live_room_id": string,
}

export interface GetUserPortraitsResponse {
  "code"?: number,
  "data"?: {
  "all_ads_age_indicators"?: Array<Record<string, unknown>>,
  "all_ads_gender_indicators"?: Array<Record<string, unknown>>,
  "all_fan_indicators"?: Array<Record<string, unknown>>,
  "paid_ads_age_indicators"?: Array<Record<string, unknown>>,
  "paid_ads_gender_indicators"?: Array<Record<string, unknown>>,
  "paid_fan_indicators"?: Array<Record<string, unknown>>,
  "region_indicators"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetVideoPerformancesRequest {
  /** Collection of video IDs for retrieving the e-commerce metrics. Callers must ensure that all video IDs share the same author ID. Limit collection size 100. Use "," to separate array elements when send in the query. */
  "video_ids": string,
  /** Start date for the metrics, set with a one-day delay from today due to latency in the data pipeline. The start_time parameter must be within the last 180 days from the current date. Only date value is processed, hour/mininute/second values will be ignored. For example, if the start_time value is: 17 */
  "start_time_ge": number,
  /** End date for the metrics, set with a one-day delay from today due to latency in the data pipeline. Only date value is processed, hour/mininute/second values will be ignored. */
  "end_time_le": number,
}

export interface GetVideoPerformancesResponse {
  "code"?: number,
  "data"?: {
  "videos"?: Array<{
    "performances"?: {
      "metrics"?: {
        "anchor_display_rate"?: string,
        "click_through_rate"?: string,
        "gmv"?: {
          "amount"?: string,
          "currency"?: string,
        },
        "item_sold_count"?: number,
        "order_count"?: number,
      },
      "time_range"?: {
        "end_time"?: number,
        "start_time"?: number,
      },
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetViewTrendPerformancesRequest {
  /** live stream room id (path) */
  "live_room_id": string,
}

export interface GetViewTrendPerformancesResponse {
  "code"?: number,
  "data"?: {
  "view_trend_performances"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export class TikTokAnalyticsApi {
  constructor(private client: TikTokClient) {}

  /**
   * GetGMVTrendPerformances
   * /analytics/202309/live_rooms/{live_room_id}/gmv_trend_performances (GET)
   */
  async getGMVTrendPerformances(params: GetGMVTrendPerformancesRequest, opts?: TikTokRequestOptions): Promise<GetGMVTrendPerformancesResponse> {
    return this.client.request({"method":"GET","path":"/analytics/202309/live_rooms/{live_room_id}/gmv_trend_performances","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":["live_room_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetInteractiveTrendPerformances
   * /analytics/202309/live_rooms/{live_room_id}/interactive_trend_performances (GET)
   */
  async getInteractiveTrendPerformances(params: GetInteractiveTrendPerformancesRequest, opts?: TikTokRequestOptions): Promise<GetInteractiveTrendPerformancesResponse> {
    return this.client.request({"method":"GET","path":"/analytics/202309/live_rooms/{live_room_id}/interactive_trend_performances","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":["live_room_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetLiveCoreStats
   * /analytics/202309/live_rooms/{live_room_id}/core_stats (GET)
   */
  async getLiveCoreStats(params: GetLiveCoreStatsRequest, opts?: TikTokRequestOptions): Promise<GetLiveCoreStatsResponse> {
    return this.client.request({"method":"GET","path":"/analytics/202309/live_rooms/{live_room_id}/core_stats","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":["live_room_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetProductStats
   * /analytics/202309/live_rooms/{live_room_id}/product_stats (GET)
   */
  async getProductStats(params: GetProductStatsRequest, opts?: TikTokRequestOptions): Promise<GetProductStatsResponse> {
    return this.client.request({"method":"GET","path":"/analytics/202309/live_rooms/{live_room_id}/product_stats","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":["live_room_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetShopLIVEPerformanceList
   * /analytics/202509/shop_lives/performance (GET)
   */
  async getShopLIVEPerformanceList(params: GetShopLIVEPerformanceListRequest, opts?: TikTokRequestOptions): Promise<GetShopLIVEPerformanceListResponse> {
    return this.client.request({"method":"GET","path":"/analytics/202509/shop_lives/performance","baseUrl":"https://open-api.tiktokglobalshop.com","query":["start_date_ge","end_date_lt","page_size","sort_field","sort_order","currency","page_token","account_type","shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetShopLIVEPerformanceListOLD
   * /analytics/202505/shop_lives/performance (POST)
   */
  async getShopLIVEPerformanceListOLD(params: GetShopLIVEPerformanceListOLDRequest, opts?: TikTokRequestOptions): Promise<GetShopLIVEPerformanceListOLDResponse> {
    return this.client.request({"method":"POST","path":"/analytics/202505/shop_lives/performance","baseUrl":"https://open-api.tiktokglobalshop.com","query":["start_date_ge","end_date_lt","page_size","sort_field","sort_order","currency","page_token","account_type","shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetShopLIVEPerformanceOverview
   * /analytics/202509/shop_lives/overview_performance (GET)
   */
  async getShopLIVEPerformanceOverview(params: GetShopLIVEPerformanceOverviewRequest, opts?: TikTokRequestOptions): Promise<GetShopLIVEPerformanceOverviewResponse> {
    return this.client.request({"method":"GET","path":"/analytics/202509/shop_lives/overview_performance","baseUrl":"https://open-api.tiktokglobalshop.com","query":["start_date_ge","end_date_lt","today","granularity","currency","account_type","shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetShopLIVEPerformanceOverviewOLD
   * /analytics/202503/shop_lives/overview_performance (POST)
   */
  async getShopLIVEPerformanceOverviewOLD(params: GetShopLIVEPerformanceOverviewOLDRequest, opts?: TikTokRequestOptions): Promise<GetShopLIVEPerformanceOverviewOLDResponse> {
    return this.client.request({"method":"POST","path":"/analytics/202503/shop_lives/overview_performance","baseUrl":"https://open-api.tiktokglobalshop.com","query":["start_date_ge","end_date_lt","with_comparison","granularity","currency","account_type","shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetShopLIVEPerformancePerMinutes
   * /analytics/202510/shop_lives/{live_id}/performance_per_minutes (GET)
   */
  async getShopLIVEPerformancePerMinutes(params: GetShopLIVEPerformancePerMinutesRequest, opts?: TikTokRequestOptions): Promise<GetShopLIVEPerformancePerMinutesResponse> {
    return this.client.request({"method":"GET","path":"/analytics/202510/shop_lives/{live_id}/performance_per_minutes","baseUrl":"https://open-api.tiktokglobalshop.com","query":["page_token","currency","shop_cipher"],"headers":[],"pathParams":["live_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetShopLIVEProductsPerformanceList
   * /analytics/202512/shop/{live_id}/products_performance (GET)
   */
  async getShopLIVEProductsPerformanceList(params: GetShopLIVEProductsPerformanceListRequest, opts?: TikTokRequestOptions): Promise<GetShopLIVEProductsPerformanceListResponse> {
    return this.client.request({"method":"GET","path":"/analytics/202512/shop/{live_id}/products_performance","baseUrl":"https://open-api.tiktokglobalshop.com","query":["sort_order","sort_field","currency","shop_cipher"],"headers":[],"pathParams":["live_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetShopPerformance
   * /analytics/202509/shop/performance (GET)
   */
  async getShopPerformance(params: GetShopPerformanceRequest, opts?: TikTokRequestOptions): Promise<GetShopPerformanceResponse> {
    return this.client.request({"method":"GET","path":"/analytics/202509/shop/performance","baseUrl":"https://open-api.tiktokglobalshop.com","query":["start_date_ge","end_date_lt","granularity","currency","shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetShopPerformancePerHour
   * /analytics/202510/shop/performance/{date}/performance_per_hour (GET)
   */
  async getShopPerformancePerHour(params: GetShopPerformancePerHourRequest, opts?: TikTokRequestOptions): Promise<GetShopPerformancePerHourResponse> {
    return this.client.request({"method":"GET","path":"/analytics/202510/shop/performance/{date}/performance_per_hour","baseUrl":"https://open-api.tiktokglobalshop.com","query":["currency","shop_cipher"],"headers":[],"pathParams":["date"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetShopProductPerformanceDetail
   * /analytics/202509/shop_products/{product_id}/performance (GET)
   */
  async getShopProductPerformanceDetail(params: GetShopProductPerformanceDetailRequest, opts?: TikTokRequestOptions): Promise<GetShopProductPerformanceDetailResponse> {
    return this.client.request({"method":"GET","path":"/analytics/202509/shop_products/{product_id}/performance","baseUrl":"https://open-api.tiktokglobalshop.com","query":["start_date_ge","end_date_lt","granularity","currency","shop_cipher"],"headers":[],"pathParams":["product_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetShopProductPerformanceList
   * /analytics/202509/shop_products/performance (GET)
   */
  async getShopProductPerformanceList(params: GetShopProductPerformanceListRequest, opts?: TikTokRequestOptions): Promise<GetShopProductPerformanceListResponse> {
    return this.client.request({"method":"GET","path":"/analytics/202509/shop_products/performance","baseUrl":"https://open-api.tiktokglobalshop.com","query":["start_date_ge","end_date_lt","page_size","page_token","sort_field","sort_order","currency","category_filter","product_status_filter","shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetShopSKUPerformance
   * /analytics/202509/shop_skus/{sku_id}/performance (GET)
   */
  async getShopSKUPerformance(params: GetShopSKUPerformanceRequest, opts?: TikTokRequestOptions): Promise<GetShopSKUPerformanceResponse> {
    return this.client.request({"method":"GET","path":"/analytics/202509/shop_skus/{sku_id}/performance","baseUrl":"https://open-api.tiktokglobalshop.com","query":["start_date_ge","end_date_lt","granularity","currency","shop_cipher"],"headers":[],"pathParams":["sku_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetShopSKUPerformanceList
   * /analytics/202509/shop_skus/performance (GET)
   */
  async getShopSKUPerformanceList(params: GetShopSKUPerformanceListRequest, opts?: TikTokRequestOptions): Promise<GetShopSKUPerformanceListResponse> {
    return this.client.request({"method":"GET","path":"/analytics/202509/shop_skus/performance","baseUrl":"https://open-api.tiktokglobalshop.com","query":["start_date_ge","end_date_lt","page_size","page_token","sort_field","sort_order","category_filter","product_status_filter","product_ids","currency","shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetShopVideoPerformanceDetails
   * /analytics/202509/shop_videos/{video_id}/performance (GET)
   */
  async getShopVideoPerformanceDetails(params: GetShopVideoPerformanceDetailsRequest, opts?: TikTokRequestOptions): Promise<GetShopVideoPerformanceDetailsResponse> {
    return this.client.request({"method":"GET","path":"/analytics/202509/shop_videos/{video_id}/performance","baseUrl":"https://open-api.tiktokglobalshop.com","query":["start_date_ge","end_date_lt","granularity","currency","shop_cipher"],"headers":[],"pathParams":["video_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetShopVideoPerformanceList
   * /analytics/202509/shop_videos/performance (GET)
   */
  async getShopVideoPerformanceList(params: GetShopVideoPerformanceListRequest, opts?: TikTokRequestOptions): Promise<GetShopVideoPerformanceListResponse> {
    return this.client.request({"method":"GET","path":"/analytics/202509/shop_videos/performance","baseUrl":"https://open-api.tiktokglobalshop.com","query":["start_date_ge","end_date_lt","page_size","sort_field","sort_order","currency","page_token","account_type","shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetShopVideoPerformanceOverview
   * /analytics/202509/shop_videos/overview_performance (GET)
   */
  async getShopVideoPerformanceOverview(params: GetShopVideoPerformanceOverviewRequest, opts?: TikTokRequestOptions): Promise<GetShopVideoPerformanceOverviewResponse> {
    return this.client.request({"method":"GET","path":"/analytics/202509/shop_videos/overview_performance","baseUrl":"https://open-api.tiktokglobalshop.com","query":["start_date_ge","end_date_lt","today","granularity","currency","account_type","shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetShopVideoProductPerformanceList
   * /analytics/202509/shop_videos/{video_id}/products/performance (GET)
   */
  async getShopVideoProductPerformanceList(params: GetShopVideoProductPerformanceListRequest, opts?: TikTokRequestOptions): Promise<GetShopVideoProductPerformanceListResponse> {
    return this.client.request({"method":"GET","path":"/analytics/202509/shop_videos/{video_id}/products/performance","baseUrl":"https://open-api.tiktokglobalshop.com","query":["end_date_lt","page_size","sort_field","sort_order","currency","page_token","start_date_ge","shop_cipher"],"headers":[],"pathParams":["video_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetTrafficPerformances
   * /analytics/202309/live_rooms/{live_room_id}/traffic_performances (GET)
   */
  async getTrafficPerformances(params: GetTrafficPerformancesRequest, opts?: TikTokRequestOptions): Promise<GetTrafficPerformancesResponse> {
    return this.client.request({"method":"GET","path":"/analytics/202309/live_rooms/{live_room_id}/traffic_performances","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":["live_room_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetUserPortraits
   * /analytics/202309/live_rooms/{live_room_id}/user_portraits (GET)
   */
  async getUserPortraits(params: GetUserPortraitsRequest, opts?: TikTokRequestOptions): Promise<GetUserPortraitsResponse> {
    return this.client.request({"method":"GET","path":"/analytics/202309/live_rooms/{live_room_id}/user_portraits","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":["live_room_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetVideoPerformances
   * /analytics/202403/videos/performances (GET)
   */
  async getVideoPerformances(params: GetVideoPerformancesRequest, opts?: TikTokRequestOptions): Promise<GetVideoPerformancesResponse> {
    return this.client.request({"method":"GET","path":"/analytics/202403/videos/performances","baseUrl":"https://open-api.tiktokglobalshop.com","query":["video_ids","start_time_ge","end_time_le"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetViewTrendPerformances
   * /analytics/202309/live_rooms/{live_room_id}/view_trend_performances (GET)
   */
  async getViewTrendPerformances(params: GetViewTrendPerformancesRequest, opts?: TikTokRequestOptions): Promise<GetViewTrendPerformancesResponse> {
    return this.client.request({"method":"GET","path":"/analytics/202309/live_rooms/{live_room_id}/view_trend_performances","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":["live_room_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }
}
