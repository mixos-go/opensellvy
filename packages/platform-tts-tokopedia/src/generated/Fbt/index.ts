// AUTO-GENERATED from TikTok Shop reference docs (references/api/fbt).
// Do not edit by hand; run `npm run generate` in sdk/.

import { TikTokClient } from '../../tts.client'
import { TikTokRequestOptions } from '../../tts.types'

export interface CancelFBTMCFOrderRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface CancelFBTMCFOrderBody {
  "consign_orders"?: Array<Record<string, unknown>>,
  "mcf_order_id"?: string,
}

export interface CancelFBTMCFOrderResponse {
  "code"?: number,
  "data"?: {
  "mcf_order"?: {
    "consign_orders"?: Array<Record<string, unknown>>,
    "external_order_id"?: string,
    "mcf_order_id"?: string,
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export interface CreateFBTMCFOrderRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface CreateFBTMCFOrderBody {
  "consignee"?: {
  "address"?: {
    "address_line_1"?: string,
    "address_line_2"?: string,
    "city"?: string,
    "country_code"?: string,
    "district_or_county"?: string,
    "postal_code"?: string,
    "state_or_region"?: string,
  },
  "email"?: string,
  "name"?: string,
  "phone_number"?: string,
  },
  "external_order_id"?: string,
  "goods"?: Array<Record<string, unknown>>,
}

export interface CreateFBTMCFOrderResponse {
  "code"?: number,
  "data"?: {
  "mcf_order"?: {
    "create_time"?: number,
    "external_order_id"?: string,
    "mcf_order_id"?: string,
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetFBFMCFOrderStatusRequest {
  /** A unique ID that identifies different MCF orders */
  "mcf_order_id": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetFBFMCFOrderStatusResponse {
  "code"?: number,
  "data"?: {
  "mcf_order"?: {
    "consign_orders"?: Array<{
      "shipping_provider"?: {
        "id"?: string,
        "name"?: string,
      },
    }>,
    "create_time"?: number,
    "external_order_id"?: string,
    "mcf_order_id"?: string,
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetFBTMerchantOnboardedRegionsRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetFBTMerchantOnboardedRegionsResponse {
  "code"?: number,
  "data"?: {
  "onboarded_regions"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetFBTWarehouseListRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetFBTWarehouseListResponse {
  "code"?: number,
  "data"?: {
  "warehouses"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetInboundOrderRequest {
  /** A list of inbound order IDs needs to be queried. The API will return the inbound order information for these IDs. Note: The inbound ID consists of a series of numbers without the "IBR" prefix. You can get the value in data.inbound_order_id in [Inbound FBT order status change](6708f866a88d1103246fe */
  "ids": Array<string>,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetInboundOrderResponse {
  "code"?: number,
  "data"?: {
  "inbound_orders"?: Array<{
    "merchant"?: {
      "id"?: string,
      "name"?: string,
    },
    "warehouse"?: {
      "fbt_warehouse_id"?: string,
      "name"?: string,
      "type"?: string,
      "warehouse_ids"?: Array<string>,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface QueryGoodsInventoryForMCFRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface QueryGoodsInventoryForMCFBody {
  "goods"?: Array<Record<string, unknown>>,
}

export interface QueryGoodsInventoryForMCFResponse {
  "code"?: number,
  "data"?: {
  "goods_inventory_list"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface SearchFBTInventoryRequest {
  /** The number of results to be returned per page. Valid range: [1-100]. */
  "page_size": number,
  /** Pagination page token. It should be empty for the first page. */
  "page_token"?: string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface SearchFBTInventoryBody {
  "fbt_warehouse_ids"?: Array<string>,
  "goods_ids"?: Array<string>,
  "sku_ids"?: Array<string>,
}

export interface SearchFBTInventoryResponse {
  "code"?: number,
  "data"?: {
  "inventory"?: Array<{
    "goods"?: {
      "id"?: string,
      "name"?: string,
      "reference_code"?: string,
      "skus"?: Array<{
        "on_hand_detail"?: {
          "available_quantity"?: number,
          "reserved_quantity"?: number,
          "total_quantity"?: number,
        },
      }>,
    },
    "on_hand_detail"?: {
      "available_quantity"?: number,
      "reserved_quantity"?: number,
      "total_quantity"?: number,
      "unfulfillable_quantity"?: number,
    },
  }>,
  "next_page_token"?: string,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface SearchFBTInventoryRecordRequest {
  /** The number of results to be returned per page. Valid range: [1-100]. */
  "page_size": number,
  /** Pagination page token. It should be empty for the first page. */
  "page_token"?: string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface SearchFBTInventoryRecordBody {
  "create_time_ge"?: number,
  "create_time_le"?: number,
  "fbt_warehouse_ids"?: Array<string>,
  "goods_ids"?: Array<string>,
}

export interface SearchFBTInventoryRecordResponse {
  "code"?: number,
  "data"?: {
  "inventory_records"?: Array<{
    "goods"?: {
      "id"?: string,
      "name"?: string,
      "reference_code"?: string,
    },
    "order"?: {
      "id"?: string,
      "type"?: string,
    },
  }>,
  "next_page_token"?: string,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface SearchGoodsInfoRequest {
  /** The number of results to be returned per page. Valid range: [1-100]. */
  "page_size": number,
  /** An opaque token used to retrieve the next page of a paginated result set. Retrieve this value from the result of the next_page_token from a previous response. It is not needed for the first page. */
  "page_token"?: string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface SearchGoodsInfoBody {
  "goods_ids"?: Array<string>,
  "product_ids"?: Array<string>,
  "reference_codes"?: Array<string>,
  "sku_ids"?: Array<string>,
}

export interface SearchGoodsInfoResponse {
  "code"?: number,
  "data"?: {
  "goods"?: Array<{
    "lot_expiration_info"?: {
      "addresses"?: {
        "address_line_1"?: string,
        "address_line_2"?: string,
        "address_line_3"?: string,
        "city"?: string,
        "district"?: string,
        "name"?: string,
        "phone_number"?: string,
        "postal_code"?: string,
        "region_code"?: string,
        "state"?: string,
      },
      "expiration_alert_days"?: number,
      "handling_method"?: string,
      "inbound_cutoff_days"?: number,
      "is_expiration_management"?: boolean,
      "is_lot_control"?: boolean,
      "return_cycle"?: string,
      "sales_cutoff_days"?: number,
      "shelf_life_days"?: number,
    },
    "merchant_declaration_info"?: {
      "dimension"?: {
        "height"?: string,
        "length"?: string,
        "unit"?: string,
        "width"?: string,
      },
      "weight"?: {
        "unit"?: string,
        "value"?: string,
      },
    },
    "skus"?: {
      "product"?: {
        "id"?: string,
        "image_url"?: string,
        "name"?: string,
      },
    },
    "warehouse_confirmation_info"?: {
      "dimension"?: {
        "height"?: string,
        "length"?: string,
        "unit"?: string,
        "width"?: string,
      },
      "weight"?: {
        "unit"?: string,
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

export interface GetfbtmerchantmcfstatusRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetfbtmerchantmcfstatusResponse {
  "code"?: number,
  "data"?: {
  "mcf_status"?: {
    "is_mcf"?: number,
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export class TikTokFbtApi {
  constructor(private client: TikTokClient) {}

  /**
   * CancelFBTMCFOrder
   * /fbt/202601/mcf_outbound_orders/cancel (POST)
   */
  async cancelFBTMCFOrder(params: CancelFBTMCFOrderRequest, body?: CancelFBTMCFOrderBody, opts?: TikTokRequestOptions): Promise<CancelFBTMCFOrderResponse> {
    return this.client.request({"method":"POST","path":"/fbt/202601/mcf_outbound_orders/cancel","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":["consign_orders","mcf_order_id"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * CreateFBTMCFOrder
   * /fbt/202601/mcf_outbound_orders (POST)
   */
  async createFBTMCFOrder(params: CreateFBTMCFOrderRequest, body?: CreateFBTMCFOrderBody, opts?: TikTokRequestOptions): Promise<CreateFBTMCFOrderResponse> {
    return this.client.request({"method":"POST","path":"/fbt/202601/mcf_outbound_orders","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":["consignee","external_order_id","goods"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GetFBFMCFOrderStatus
   * /fbt/202601/mcf_outbound_orders (GET)
   */
  async getFBFMCFOrderStatus(params: GetFBFMCFOrderStatusRequest, opts?: TikTokRequestOptions): Promise<GetFBFMCFOrderStatusResponse> {
    return this.client.request({"method":"GET","path":"/fbt/202601/mcf_outbound_orders","baseUrl":"https://open-api.tiktokglobalshop.com","query":["mcf_order_id","shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetFBTMerchantOnboardedRegions
   * /fbt/202409/merchants/onboarded_regions (GET)
   */
  async getFBTMerchantOnboardedRegions(params: GetFBTMerchantOnboardedRegionsRequest, opts?: TikTokRequestOptions): Promise<GetFBTMerchantOnboardedRegionsResponse> {
    return this.client.request({"method":"GET","path":"/fbt/202409/merchants/onboarded_regions","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetFBTWarehouseList
   * /fbt/202408/warehouses (GET)
   */
  async getFBTWarehouseList(params: GetFBTWarehouseListRequest, opts?: TikTokRequestOptions): Promise<GetFBTWarehouseListResponse> {
    return this.client.request({"method":"GET","path":"/fbt/202408/warehouses","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetInboundOrder
   * /fbt/202409/inbound_orders (GET)
   */
  async getInboundOrder(params: GetInboundOrderRequest, opts?: TikTokRequestOptions): Promise<GetInboundOrderResponse> {
    return this.client.request({"method":"GET","path":"/fbt/202409/inbound_orders","baseUrl":"https://open-api.tiktokglobalshop.com","query":["ids","shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * QueryGoodsInventoryForMCF
   * /fbt/202601/mcf/goods/inventory/search (POST)
   */
  async queryGoodsInventoryForMCF(params: QueryGoodsInventoryForMCFRequest, body?: QueryGoodsInventoryForMCFBody, opts?: TikTokRequestOptions): Promise<QueryGoodsInventoryForMCFResponse> {
    return this.client.request({"method":"POST","path":"/fbt/202601/mcf/goods/inventory/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":["goods"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * SearchFBTInventory
   * /fbt/202408/inventory/search (POST)
   */
  async searchFBTInventory(params: SearchFBTInventoryRequest, body?: SearchFBTInventoryBody, opts?: TikTokRequestOptions): Promise<SearchFBTInventoryResponse> {
    return this.client.request({"method":"POST","path":"/fbt/202408/inventory/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":["page_size","page_token","shop_cipher"],"headers":[],"pathParams":[],"body":["fbt_warehouse_ids","goods_ids","sku_ids"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * SearchFBTInventoryRecord
   * /fbt/202410/inventory_records/search (POST)
   */
  async searchFBTInventoryRecord(params: SearchFBTInventoryRecordRequest, body?: SearchFBTInventoryRecordBody, opts?: TikTokRequestOptions): Promise<SearchFBTInventoryRecordResponse> {
    return this.client.request({"method":"POST","path":"/fbt/202410/inventory_records/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":["page_size","page_token","shop_cipher"],"headers":[],"pathParams":[],"body":["create_time_ge","create_time_le","fbt_warehouse_ids","goods_ids"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * SearchGoodsInfo
   * /fbt/202409/goods/search (POST)
   */
  async searchGoodsInfo(params: SearchGoodsInfoRequest, body?: SearchGoodsInfoBody, opts?: TikTokRequestOptions): Promise<SearchGoodsInfoResponse> {
    return this.client.request({"method":"POST","path":"/fbt/202409/goods/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":["page_size","page_token","shop_cipher"],"headers":[],"pathParams":[],"body":["goods_ids","product_ids","reference_codes","sku_ids"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * getfbtmerchantmcfstatus
   * /fbt/202601/merchants/mcf_status (GET)
   */
  async getfbtmerchantmcfstatus(params: GetfbtmerchantmcfstatusRequest, opts?: TikTokRequestOptions): Promise<GetfbtmerchantmcfstatusResponse> {
    return this.client.request({"method":"GET","path":"/fbt/202601/merchants/mcf_status","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }
}
