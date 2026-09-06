// AUTO-GENERATED from TikTok Shop reference docs (references/api/order).
// Do not edit by hand; run `npm run generate` in sdk/.

import { TikTokClient } from '../../tts.client'
import { TikTokRequestOptions } from '../../tts.types'

export interface AddExternalOrderReferencesRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface AddExternalOrderReferencesBody {
  "orders"?: Array<{
  "external_order"?: {
    "id"?: string,
    "line_items"?: Array<Record<string, unknown>>,
    "platform"?: string,
  },
  }>,
}

export interface AddExternalOrderReferencesResponse {
  "code"?: number,
  "data"?: {
  "errors"?: Array<{
    "detail"?: {
      "external_order"?: {
        "id"?: string,
        "platform"?: string,
      },
      "order_id"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetExternalOrderReferencesRequest {
  /** The unique identifier for a TikTok Shop order. (path) */
  "order_id": string,
  /** The alias of your external order management system (OMS). Possible values: - SHOPIFY - WOOCOMMERCE - BIGCOMMERCE - MAGENTO - SALESFORCE_COMMERCE_CLOUD - CHANNEL_ADVISOR - AMAZON - ORDER_MANAGEMENT_SYSTEM - WAREHOUSE_MANAGEMENT_SYSTEM - ERP_SYSTEM */
  "platform": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetExternalOrderReferencesResponse {
  "code"?: number,
  "data"?: {
  "external_orders"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetOrderDetailRequest {
  /** A list of TikTok Shop order ID values. Max count: 50 */
  "ids": Array<string>,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetOrderDetailResponse {
  "code"?: number,
  "data"?: {
  "orders"?: Array<{
    "handling_duration"?: {
      "days"?: string,
      "type"?: string,
    },
    "payment"?: {
      "buyer_service_fee"?: string,
      "currency"?: string,
      "distance_fee"?: string,
      "distance_shipping_fee"?: string,
      "handling_fee"?: string,
      "item_insurance_fee"?: string,
      "item_insurance_tax"?: string,
      "original_shipping_fee"?: string,
      "original_total_product_price"?: string,
      "payment_discount_service_fee"?: string,
      "payment_platform_discount"?: string,
      "platform_discount"?: string,
      "product_tax"?: string,
      "retail_delivery_fee"?: string,
      "seller_discount"?: string,
      "shipping_fee"?: string,
      "shipping_fee_cofunded_discount"?: string,
      "shipping_fee_platform_discount"?: string,
      "shipping_fee_seller_discount"?: string,
      "shipping_fee_tax"?: string,
      "shipping_insurance_fee"?: string,
      "small_order_fee"?: string,
      "sub_total"?: string,
      "tax"?: string,
      "total_amount"?: string,
    },
    "recipient_address"?: {
      "address_detail"?: string,
      "address_line1"?: string,
      "address_line2"?: string,
      "address_line3"?: string,
      "address_line4"?: string,
      "delivery_preferences"?: {
        "drop_off_location"?: string,
      },
      "district_info"?: Array<Record<string, unknown>>,
      "first_name"?: string,
      "first_name_local_script"?: string,
      "full_address"?: string,
      "last_name"?: string,
      "last_name_local_script"?: string,
      "name"?: string,
      "phone_number"?: string,
      "post_town"?: string,
      "postal_code"?: string,
      "region_code"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetOrderListRequest {
  /** The number of results to be returned per page. Default: 20. Valid range: [1-100]. */
  "page_size": number,
  /** The sort order for the sort_field parameter. Default: DESC Possible values: - ASC: Ascending order - DESC: Descending order */
  "sort_order"?: string,
  /** An opaque token used to retrieve the next page of a paginated result set. Retrieve this value from the result of the next_page_token from a previous response. It is not needed for the first page. */
  "page_token"?: string,
  /** The returned results will be sorted by the specified field. Default: create_time Possible values: - create_time - update_time Specify the order for sorting the returned results by using the sort_order parameter. */
  "sort_field"?: string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetOrderListBody {
  "buyer_user_id"?: string,
  "create_time_ge"?: number,
  "create_time_lt"?: number,
  "is_buyer_request_cancel"?: boolean,
  "order_status"?: string,
  "shipping_type"?: string,
  "update_time_ge"?: number,
  "update_time_lt"?: number,
  "warehouse_ids"?: Array<string>,
}

export interface GetOrderListResponse {
  "code"?: number,
  "data"?: {
  "next_page_token"?: string,
  "orders"?: Array<{
    "handling_duration"?: {
      "days"?: string,
      "type"?: string,
    },
    "payment"?: {
      "buyer_service_fee"?: string,
      "currency"?: string,
      "distance_fee"?: string,
      "distance_shipping_fee"?: string,
      "handling_fee"?: string,
      "item_insurance_fee"?: string,
      "item_insurance_tax"?: string,
      "original_shipping_fee"?: string,
      "original_total_product_price"?: string,
      "payment_discount_service_fee"?: string,
      "payment_platform_discount"?: string,
      "platform_discount"?: string,
      "product_tax"?: string,
      "retail_delivery_fee"?: string,
      "seller_discount"?: string,
      "shipping_fee"?: string,
      "shipping_fee_cofunded_discount"?: string,
      "shipping_fee_platform_discount"?: string,
      "shipping_fee_seller_discount"?: string,
      "shipping_fee_tax"?: string,
      "shipping_insurance_fee"?: string,
      "small_order_fee"?: string,
      "sub_total"?: string,
      "tax"?: string,
      "total_amount"?: string,
    },
    "recipient_address"?: {
      "address_detail"?: string,
      "address_line1"?: string,
      "address_line2"?: string,
      "address_line3"?: string,
      "address_line4"?: string,
      "delivery_preferences"?: {
        "drop_off_location"?: string,
      },
      "district_info"?: Array<Record<string, unknown>>,
      "first_name"?: string,
      "first_name_local_script"?: string,
      "full_address"?: string,
      "last_name"?: string,
      "last_name_local_script"?: string,
      "name"?: string,
      "phone_number"?: string,
      "post_town"?: string,
      "postal_code"?: string,
      "region_code"?: string,
    },
  }>,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetPriceDetailRequest {
  /** Order ID (path) */
  "order_id": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetPriceDetailResponse {
  "code"?: number,
  "data"?: {
  "cod_fee"?: string,
  "cod_fee_net_amount"?: string,
  "currency"?: string,
  "distance_fee"?: string,
  "distance_shipping_fee"?: string,
  "line_items"?: Array<Record<string, unknown>>,
  "net_price_amount"?: string,
  "payment"?: string,
  "shipping_fee_deduction_platform"?: string,
  "shipping_fee_deduction_platform_voucher"?: string,
  "shipping_fee_deduction_seller"?: string,
  "shipping_list_price"?: string,
  "shipping_sale_price"?: string,
  "sku_gift_net_price"?: string,
  "sku_gift_original_price"?: string,
  "sku_list_price"?: string,
  "sku_sale_price"?: string,
  "subtotal"?: string,
  "subtotal_deduction_platform"?: string,
  "subtotal_deduction_seller"?: string,
  "subtotal_tax_amount"?: string,
  "tax_amount"?: string,
  "tax_rate"?: string,
  "total"?: string,
  "voucher_deduction_platform"?: string,
  "voucher_deduction_seller"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetPrivilegedOrderDetailRequest {
  /** A list of TikTok Shop order ID values. Max count : 50 */
  "ids": Array<string>,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetPrivilegedOrderDetailResponse {
  "code"?: number,
  "data"?: {
  "orders"?: Array<{
    "payment"?: {
      "currency"?: string,
      "original_shipping_fee"?: string,
      "original_total_product_price"?: string,
      "platform_discount"?: string,
      "product_tax"?: string,
      "retail_delivery_fee"?: string,
      "seller_discount"?: string,
      "shipping_fee"?: string,
      "shipping_fee_platform_discount"?: string,
      "shipping_fee_seller_discount"?: string,
      "shipping_fee_tax"?: string,
      "small_order_fee"?: string,
      "sub_total"?: string,
      "tax"?: string,
      "total_amount"?: string,
    },
    "recipient_address"?: {
      "address_detail"?: string,
      "address_line1"?: string,
      "address_line2"?: string,
      "address_line3"?: string,
      "address_line4"?: string,
      "delivery_preferences"?: {
        "drop_off_location"?: string,
      },
      "district_info"?: Array<Record<string, unknown>>,
      "email"?: string,
      "full_address"?: string,
      "name"?: string,
      "phone_number"?: string,
      "postal_code"?: string,
      "region_code"?: string,
      "tokenized_email"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface SearchOrderByExternalOrderReferenceRequest {
  /** The alias of your external order management system (OMS). Possible values: - SHOPIFY - WOOCOMMERCE - BIGCOMMERCE - MAGENTO - SALESFORCE_COMMERCE_CLOUD - CHANNEL_ADVISOR - AMAZON - ORDER_MANAGEMENT_SYSTEM - WAREHOUSE_MANAGEMENT_SYSTEM - ERP_SYSTEM */
  "platform": string,
  /** Order ID in your OMS. */
  "external_order_id": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface SearchOrderByExternalOrderReferenceResponse {
  "code"?: number,
  "data"?: {
  "orders"?: Array<{
    "external_order"?: {
      "id"?: string,
      "line_items"?: Array<Record<string, unknown>>,
      "platform"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface UpdateTheBlindBoxOpeningResultsRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface UpdateTheBlindBoxOpeningResultsBody {
  "blind_box_results"?: Array<Record<string, unknown>>,
  "main_order_id"?: string,
}

export interface UpdateTheBlindBoxOpeningResultsResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export class TikTokOrderApi {
  constructor(private client: TikTokClient) {}

  /**
   * AddExternalOrderReferences
   * /order/202406/orders/external_orders (POST)
   */
  async addExternalOrderReferences(params: AddExternalOrderReferencesRequest, body?: AddExternalOrderReferencesBody, opts?: TikTokRequestOptions): Promise<AddExternalOrderReferencesResponse> {
    return this.client.request({"method":"POST","path":"/order/202406/orders/external_orders","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":["orders"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GetExternalOrderReferences
   * /order/202406/orders/{order_id}/external_orders (GET)
   */
  async getExternalOrderReferences(params: GetExternalOrderReferencesRequest, opts?: TikTokRequestOptions): Promise<GetExternalOrderReferencesResponse> {
    return this.client.request({"method":"GET","path":"/order/202406/orders/{order_id}/external_orders","baseUrl":"https://open-api.tiktokglobalshop.com","query":["platform","shop_cipher"],"headers":[],"pathParams":["order_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetOrderDetail
   * /order/202507/orders (GET)
   */
  async getOrderDetail(params: GetOrderDetailRequest, opts?: TikTokRequestOptions): Promise<GetOrderDetailResponse> {
    return this.client.request({"method":"GET","path":"/order/202507/orders","baseUrl":"https://open-api.tiktokglobalshop.com","query":["ids","shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetOrderList
   * /order/202309/orders/search (POST)
   */
  async getOrderList(params: GetOrderListRequest, body?: GetOrderListBody, opts?: TikTokRequestOptions): Promise<GetOrderListResponse> {
    return this.client.request({"method":"POST","path":"/order/202309/orders/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":["page_size","sort_order","page_token","sort_field","shop_cipher"],"headers":[],"pathParams":[],"body":["buyer_user_id","create_time_ge","create_time_lt","is_buyer_request_cancel","order_status","shipping_type","update_time_ge","update_time_lt","warehouse_ids"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GetPriceDetail
   * /order/202407/orders/{order_id}/price_detail (GET)
   */
  async getPriceDetail(params: GetPriceDetailRequest, opts?: TikTokRequestOptions): Promise<GetPriceDetailResponse> {
    return this.client.request({"method":"GET","path":"/order/202407/orders/{order_id}/price_detail","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":["order_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetPrivilegedOrderDetail
   * /order/202309/privileged_orders (GET)
   */
  async getPrivilegedOrderDetail(params: GetPrivilegedOrderDetailRequest, opts?: TikTokRequestOptions): Promise<GetPrivilegedOrderDetailResponse> {
    return this.client.request({"method":"GET","path":"/order/202309/privileged_orders","baseUrl":"https://open-api.tiktokglobalshop.com","query":["ids","shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * SearchOrderByExternalOrderReference
   * /order/202406/orders/external_order_search (POST)
   */
  async searchOrderByExternalOrderReference(params: SearchOrderByExternalOrderReferenceRequest, opts?: TikTokRequestOptions): Promise<SearchOrderByExternalOrderReferenceResponse> {
    return this.client.request({"method":"POST","path":"/order/202406/orders/external_order_search","baseUrl":"https://open-api.tiktokglobalshop.com","query":["platform","external_order_id","shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * UpdateTheBlindBoxOpeningResults
   * /order/202511/orders/blind_box_result/callback (POST)
   */
  async updateTheBlindBoxOpeningResults(params: UpdateTheBlindBoxOpeningResultsRequest, body?: UpdateTheBlindBoxOpeningResultsBody, opts?: TikTokRequestOptions): Promise<UpdateTheBlindBoxOpeningResultsResponse> {
    return this.client.request({"method":"POST","path":"/order/202511/orders/blind_box_result/callback","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":["blind_box_results","main_order_id"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }
}
