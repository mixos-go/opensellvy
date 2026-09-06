// AUTO-GENERATED from TikTok Shop reference docs (references/api/gs_full_service_shipment).
// Do not edit by hand; run `npm run generate` in sdk/.

import { TikTokClient } from '../../tts.client'
import { TikTokRequestOptions } from '../../tts.types'

export interface ConfirmDeliveryRequest {
  /** The platform-defined ID for supplier. */
  "supplier_id": string,
}

export interface ConfirmDeliveryBody {
  "delivery_order_code"?: string,
}

export interface ConfirmDeliveryResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export interface CreateDeliveryOrderRequest {
  /** Platform-defined ID of supplier */
  "supplier_id": string,
}

export interface CreateDeliveryOrderBody {
  "delivery_order"?: {
  "delivery_items"?: Array<Record<string, unknown>>,
  "package_quantity"?: number,
  "packages"?: Array<Record<string, unknown>>,
  "stockup_order_code"?: string,
  },
}

export interface CreateDeliveryOrderResponse {
  "code"?: number,
  "data"?: {
  "delivery_order_code"?: string,
  "stockup_order_code"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSConfirmDeliveryRequest {}


export interface GSConfirmDeliveryBody {
  "delivery_order_code"?: string,
}

export interface GSConfirmDeliveryResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export interface GSCreateDeliveryOrderRequest {}


export interface GSCreateDeliveryOrderBody {
  "delivery_order"?: {
  "package_quantity"?: number,
  "packages"?: Array<Record<string, unknown>>,
  "stockup_order_code"?: string,
  },
}

export interface GSCreateDeliveryOrderResponse {
  "code"?: number,
  "data"?: {
  "delivery_order_code"?: string,
  "stockup_order_code"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSGetDeliveryOrderPrintDocumentRequest {
  /** The list of delivery order code. Up to 50. */
  "delivery_order_codes": Array<string>,
}

export interface GSGetDeliveryOrderPrintDocumentResponse {
  "code"?: number,
  "data"?: {
  "document_url"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSGetLogisticsWaybillsPrintDocumentRequest {
  /** The list of logistics order code. Up to 50. */
  "logistics_codes": Array<string>,
}

export interface GSGetLogisticsWaybillsPrintDocumentResponse {
  "code"?: number,
  "data"?: {
  "document_url"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSGetSKUPrintDocumentRequest {}


export interface GSGetSKUPrintDocumentBody {
  "dimension"?: {
  "height"?: string,
  "unit"?: string,
  "width"?: string,
  },
  "platform_sku_items"?: Array<Record<string, unknown>>,
  "print_sku_code"?: boolean,
  "stockup_order_code"?: string,
}

export interface GSGetSKUPrintDocumentResponse {
  "code"?: number,
  "data"?: {
  "document_url"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSQueryDeliveryBatchsRequest {
  /** A delivery batch code will be generated for logistics tracking when delivery-order is operated ship by logistics. Up to 50 */
  "delivery_batch_codes": Array<string>,
}

export interface GSQueryDeliveryBatchsResponse {
  "code"?: number,
  "data"?: {
  "delivery_batchs"?: Array<{
    "logistics"?: {
      "delivery_option"?: string,
      "shipping_provider_code"?: string,
      "shipping_provider_name"?: string,
    },
    "logistics_orders"?: {
      "package_weight"?: {
        "unit"?: string,
        "value"?: string,
      },
    },
    "predicted_pick_info"?: {
      "end_time"?: number,
      "start_time"?: number,
    },
    "receiver_contact"?: {
      "address_detail"?: {
        "city_id"?: number,
        "city_name"?: string,
        "country_id"?: number,
        "country_name"?: string,
        "detail"?: string,
        "district_id"?: number,
        "district_name"?: string,
        "province_id"?: number,
        "province_name"?: string,
        "town_id"?: number,
        "town_name"?: string,
      },
      "contact_name"?: string,
      "email"?: string,
      "full_address"?: string,
      "phone_number"?: string,
      "postal_code"?: string,
    },
    "sender_contact"?: {
      "address_detail"?: {
        "city_id"?: number,
        "city_name"?: string,
        "country_id"?: number,
        "country_name"?: string,
        "detail"?: string,
        "district_id"?: number,
        "district_name"?: string,
        "province_id"?: number,
        "province_name"?: string,
        "town_id"?: number,
        "town_name"?: string,
      },
      "contact_name"?: string,
      "email"?: string,
      "full_address"?: string,
      "phone_number"?: string,
      "postal_code"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSReserveShippingRequest {}


export interface GSReserveShippingBody {
  "delivery_mode"?: string,
  "delivery_order_codes"?: Array<string>,
  "logistics"?: {
  "delivery_option"?: string,
  "shipping_provider_code"?: string,
  "shipping_provider_name"?: string,
  },
  "reserve"?: {
  "predicted_arrived_time"?: number,
  "predicted_pickup_ge"?: number,
  "predicted_pickup_lt"?: number,
  "predicted_pickup_time"?: number,
  "predicted_ship_time"?: number,
  },
  "sender_contact"?: {
  "address_detail"?: {
    "city_id"?: number,
    "city_name"?: string,
    "country_id"?: number,
    "country_name"?: string,
    "detail"?: string,
    "district_id"?: number,
    "district_name"?: string,
    "province_id"?: number,
    "province_name"?: string,
    "town_id"?: number,
    "town_name"?: string,
  },
  "contact_name"?: string,
  "email"?: string,
  "full_address"?: string,
  "phone_number"?: string,
  "postal_code"?: string,
  },
  "shipping_box_quantity"?: number,
  "total_weight"?: {
  "unit"?: string,
  "value"?: string,
  },
  "warehouse_code"?: string,
}

export interface GSReserveShippingResponse {
  "code"?: number,
  "data"?: {
  "delivery_batch_code"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSSearchAvailableShippingProvidersRequest {}


export interface GSSearchAvailableShippingProvidersBody {
  "delivery_mode"?: string,
  "delivery_option"?: string,
  "delivery_order_codes"?: Array<string>,
  "sender_contact"?: {
  "address_detail"?: {
    "city_id"?: number,
    "city_name"?: string,
    "country_id"?: number,
    "country_name"?: string,
    "detail"?: string,
    "district_id"?: number,
    "district_name"?: string,
    "province_id"?: number,
    "province_name"?: string,
    "town_id"?: number,
    "town_name"?: string,
  },
  "contact_name"?: string,
  "email"?: string,
  "full_address"?: string,
  "phone_number"?: string,
  "postal_code"?: string,
  },
  "total_weight"?: {
  "unit"?: string,
  "value"?: string,
  },
  "warehouse_code"?: string,
}

export interface GSSearchAvailableShippingProvidersResponse {
  "code"?: number,
  "data"?: {
  "reserve_arrived_times"?: Array<Record<string, unknown>>,
  "shipping_providers"?: Array<{
    "max_charge_fee"?: {
      "amount"?: string,
      "currency"?: string,
    },
    "min_charge_fee"?: {
      "amount"?: string,
      "currency"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSSearchDeliveryOrdersRequest {}


export interface GSSearchDeliveryOrdersBody {
  "arrived_time_ge"?: number,
  "arrived_time_lt"?: number,
  "delivery_batch_codes"?: Array<string>,
  "delivery_order_codes"?: Array<string>,
  "delivery_types"?: Array<string>,
  "emergency_levels"?: Array<string>,
  "external_skc_codes"?: Array<string>,
  "external_sku_codes"?: Array<string>,
  "is_sample_included"?: boolean,
  "latest_status_update_ge"?: number,
  "latest_status_update_lt"?: number,
  "order_types"?: Array<string>,
  "page_size"?: number,
  "page_token"?: string,
  "platform_spu_codes"?: Array<string>,
  "relative_codes"?: Array<string>,
  "require_arrived_time_ge"?: number,
  "require_arrived_time_lt"?: number,
  "ship_time_ge"?: number,
  "ship_time_lt"?: number,
  "warehouse_codes"?: Array<string>,
}

export interface GSSearchDeliveryOrdersResponse {
  "code"?: number,
  "data"?: {
  "delivery_orders"?: Array<{
    "logistics"?: {
      "delivery_option"?: string,
      "shipping_provider_code"?: string,
    },
    "skc"?: {
      "external_skc_code"?: string,
      "first_key_attribute_name_en"?: string,
      "first_key_attribute_name_zh"?: string,
      "first_key_attribute_value_en"?: string,
      "first_key_attribute_value_zh"?: string,
      "platform_skc_code"?: string,
    },
    "warehouse_contact"?: {
      "address_detail"?: {
        "city_id"?: number,
        "city_name"?: string,
        "country_id"?: number,
        "country_name"?: string,
        "detail"?: string,
        "district_id"?: number,
        "district_name"?: string,
        "province_id"?: number,
        "province_name"?: string,
        "town_id"?: number,
        "town_name"?: string,
      },
      "contact_name"?: string,
      "email"?: string,
      "full_address"?: string,
      "phone_number"?: string,
      "postal_code"?: string,
    },
  }>,
  "next_page_token"?: string,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSSearchStockupOrdersRequest {}


export interface GSSearchStockupOrdersBody {
  "can_deliver"?: boolean,
  "emergency_levels"?: Array<string>,
  "external_skc_codes"?: Array<string>,
  "external_sku_codes"?: Array<string>,
  "is_delivery_completed"?: boolean,
  "is_first_order"?: boolean,
  "is_normal"?: boolean,
  "latest_status_update_ge"?: number,
  "latest_status_update_lt"?: number,
  "order_create_time_ge"?: number,
  "order_create_time_lt"?: number,
  "order_sources"?: Array<string>,
  "order_status"?: Array<string>,
  "order_types"?: Array<string>,
  "page_size"?: number,
  "page_token"?: string,
  "platform_sku_codes"?: Array<string>,
  "platform_spu_codes"?: Array<string>,
  "require_arrived_time_ge"?: number,
  "require_arrived_time_lt"?: number,
  "require_ship_time_ge"?: number,
  "require_ship_time_lt"?: number,
  "stockup_order_codes"?: Array<string>,
}

export interface GSSearchStockupOrdersResponse {
  "code"?: number,
  "data"?: {
  "next_page_token"?: string,
  "stockup_orders"?: Array<{
    "skc"?: {
      "external_skc_code"?: string,
      "first_key_attribute_name_en"?: string,
      "first_key_attribute_name_zh"?: string,
      "first_key_attribute_value_en"?: string,
      "first_key_attribute_value_zh"?: string,
      "platform_skc_code"?: string,
    },
  }>,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetDeliveryOrderPrintDocumentRequest {
  /** Platform-defined ID of supplier */
  "supplier_id": string,
  /** The list of delivery order code Up to 50 */
  "delivery_order_codes": Array<string>,
}

export interface GetDeliveryOrderPrintDocumentResponse {
  "code"?: number,
  "data"?: {
  "document_url"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetLogisticsWaybillsPrintDocurementRequest {
  /** The platform-defined ID for supplier. */
  "supplier_id": string,
  /** The list of logistics order codes. Up to 50 */
  "logistics_codes": Array<string>,
}

export interface GetLogisticsWaybillsPrintDocurementResponse {
  "code"?: number,
  "data"?: {
  "document_url"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GlobalSellingCancelShipmentRequest {}


export interface GlobalSellingCancelShipmentBody {
  "logistics_order"?: string,
}

export interface GlobalSellingCancelShipmentResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export interface GlobalSellingConfirmStockupOrderRequest {}


export interface GlobalSellingConfirmStockupOrderBody {
  "is_order_confirmed"?: boolean,
  "reject_note"?: string,
  "reject_reason"?: string,
  "skus"?: Array<Record<string, unknown>>,
  "stockup_order_code"?: string,
}

export interface GlobalSellingConfirmStockupOrderResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export interface GlobalSellingGetQualityDocumentsRequest {
  /** The code of order. */
  "order_code": string,
  /** The type of order. Possible enumerations are: - "DELIVERY_ORDER" - "INSPECT_ORDER" */
  "order_type": string,
}

export interface GlobalSellingGetQualityDocumentsResponse {
  "code"?: number,
  "data"?: {
  "document_url"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GlobalSellingGetSKUPrintDocumentRequest {}


export interface GlobalSellingGetSKUPrintDocumentBody {
  "need_separator"?: boolean,
  "platform_sku_items"?: Array<Record<string, unknown>>,
  "size"?: {
  "height"?: string,
  "unit"?: string,
  "width"?: string,
  },
  "stockup_order_code"?: string,
}

export interface GlobalSellingGetSKUPrintDocumentResponse {
  "code"?: number,
  "data"?: {
  "document_url"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GlobalSellingQueryLogisticsOrdersRequest {
  /** A delivery batch code will be generated for logistics tracking when delivery-order is operated ship by logistics. less or equal to 50. */
  "logistics_orders": Array<string>,
}

export interface GlobalSellingQueryLogisticsOrdersResponse {
  "code"?: number,
  "data"?: {
  "logistics_orders"?: Array<{
    "logistics"?: {
      "delivery_option"?: string,
      "shipping_provider_code"?: string,
      "shipping_provider_name"?: string,
    },
    "logistics_sub_orders"?: {
      "package_weight"?: {
        "unit"?: string,
        "value"?: string,
      },
    },
    "predicted_pick_info"?: {
      "end_time"?: number,
      "start_time"?: number,
    },
    "receiver_contact"?: {
      "address_detail"?: {
        "city_name"?: string,
        "country_name"?: string,
        "detail"?: string,
        "district_name"?: string,
        "province_name"?: string,
        "town_name"?: string,
      },
      "contact_name"?: string,
      "email"?: string,
      "full_address"?: string,
      "phone_number"?: string,
      "postal_code"?: string,
    },
    "sender_contact"?: {
      "address_detail"?: {
        "city_name"?: string,
        "country_name"?: string,
        "detail"?: string,
        "district_name"?: string,
        "province_name"?: string,
        "town_name"?: string,
      },
      "contact_name"?: string,
      "email"?: string,
      "full_address"?: string,
      "phone_number"?: string,
      "postal_code"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GlobalSellingReserveShipmentRequest {}


export interface GlobalSellingReserveShipmentBody {
  "delivery_mode"?: string,
  "delivery_order_codes"?: Array<string>,
  "logistics"?: {
  "delivery_option"?: string,
  "shipping_provider_code"?: string,
  "shipping_provider_name"?: string,
  },
  "reserve"?: {
  "predicted_arrived_time"?: number,
  "predicted_pickup_ge"?: number,
  "predicted_pickup_lt"?: number,
  "predicted_pickup_time"?: number,
  "predicted_ship_time"?: number,
  },
  "sender_contact_id"?: string,
  "shipping_box_quantity"?: number,
  "total_weight"?: {
  "unit"?: string,
  "value"?: string,
  },
  "warehouse_code"?: string,
}

export interface GlobalSellingReserveShipmentResponse {
  "code"?: number,
  "data"?: {
  "logistics_order"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GlobalSellingSearchAbnormalOrdersRequest {}


export interface GlobalSellingSearchAbnormalOrdersBody {
  "abnormal_order_codes"?: Array<string>,
  "abnormal_types"?: Array<string>,
  "delivery_order_codes"?: Array<string>,
  "external_skc_codes"?: Array<string>,
  "external_sku_codes"?: Array<string>,
  "latest_update_time_ge"?: number,
  "latest_update_time_lt"?: number,
  "order_create_time_ge"?: number,
  "order_create_time_lt"?: number,
  "page_size"?: number,
  "page_token"?: string,
  "platform_sku_codes"?: Array<string>,
  "platform_spu_codes"?: Array<string>,
  "relative_return_status"?: Array<string>,
  "stockup_order_codes"?: Array<string>,
}

export interface GlobalSellingSearchAbnormalOrdersResponse {
  "code"?: number,
  "data"?: {
  "abnormal_orders"?: Array<{
    "skc"?: {
      "external_skc_code"?: string,
      "first_key_attribute_name_en"?: string,
      "first_key_attribute_name_zh"?: string,
      "first_key_attribute_value_en"?: string,
      "first_key_attribute_value_zh"?: string,
      "image_url"?: string,
      "platform_skc_code"?: string,
    },
  }>,
  "next_page_token"?: string,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GlobalSellingSearchAvailableShippingProvidersRequest {}


export interface GlobalSellingSearchAvailableShippingProvidersBody {
  "delivery_mode"?: string,
  "delivery_option"?: string,
  "delivery_order_codes"?: Array<string>,
  "sender_contact_id"?: string,
  "shipping_box_quantity"?: number,
  "total_weight"?: {
  "unit"?: string,
  "value"?: string,
  },
  "warehouse_code"?: string,
}

export interface GlobalSellingSearchAvailableShippingProvidersResponse {
  "code"?: number,
  "data"?: {
  "reserve_arrived_times"?: Array<{
    "max_charge_fee"?: {
      "amount"?: string,
      "currency"?: string,
    },
    "min_charge_fee"?: {
      "amount"?: string,
      "currency"?: string,
    },
  }>,
  "shipping_providers"?: Array<{
    "max_charge_fee"?: {
      "amount"?: string,
      "currency"?: string,
    },
    "min_charge_fee"?: {
      "amount"?: string,
      "currency"?: string,
    },
  }>,
  "warehouse_list"?: Array<{
    "warehouse_contact"?: {
      "address_detail"?: {
        "city_name"?: string,
        "country_name"?: string,
        "detail"?: string,
        "district_name"?: string,
        "province_name"?: string,
        "town_name"?: string,
      },
      "contact_name"?: string,
      "email"?: string,
      "full_address"?: string,
      "phone_number"?: string,
      "postal_code"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GlobalSellingSearchDeliveryOrdersRequest {}


export interface GlobalSellingSearchDeliveryOrdersBody {
  "arrived_time_ge"?: number,
  "arrived_time_lt"?: number,
  "delivery_order_codes"?: Array<string>,
  "delivery_types"?: Array<string>,
  "emergency_levels"?: Array<string>,
  "external_skc_codes"?: Array<string>,
  "external_sku_codes"?: Array<string>,
  "is_sample_included"?: boolean,
  "latest_status_update_ge"?: number,
  "latest_status_update_lt"?: number,
  "logistics_orders"?: Array<string>,
  "order_types"?: Array<string>,
  "page_size"?: number,
  "page_token"?: string,
  "platform_spu_codes"?: Array<string>,
  "relative_codes"?: Array<string>,
  "require_arrived_time_ge"?: number,
  "require_arrived_time_lt"?: number,
  "ship_time_ge"?: number,
  "ship_time_lt"?: number,
  "warehouse_codes"?: Array<string>,
}

export interface GlobalSellingSearchDeliveryOrdersResponse {
  "code"?: number,
  "data"?: {
  "delivery_orders"?: Array<{
    "logistics"?: {
      "delivery_option"?: string,
      "logistics_order"?: string,
      "shipping_provider_code"?: string,
    },
    "skc"?: {
      "external_skc_code"?: string,
      "first_key_attribute_name_en"?: string,
      "first_key_attribute_name_zh"?: string,
      "first_key_attribute_value_en"?: string,
      "first_key_attribute_value_zh"?: string,
      "image_url"?: string,
      "platform_skc_code"?: string,
    },
    "warehouse_contact"?: {
      "address_detail"?: {
        "city_name"?: string,
        "country_name"?: string,
        "detail"?: string,
        "district_name"?: string,
        "province_name"?: string,
        "town_name"?: string,
      },
      "contact_name"?: string,
      "email"?: string,
      "full_address"?: string,
      "phone_number"?: string,
      "postal_code"?: string,
    },
  }>,
  "next_page_token"?: string,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GlobalSellingSearchReturnOrdersRequest {}


export interface GlobalSellingSearchReturnOrdersBody {
  "external_skc_codes"?: Array<string>,
  "external_sku_codes"?: Array<string>,
  "order_create_time_ge"?: number,
  "order_create_time_lt"?: number,
  "page_size"?: number,
  "page_token"?: string,
  "platform_sku_codes"?: Array<string>,
  "platform_spu_codes"?: Array<string>,
  "return_methods"?: Array<string>,
  "return_order_codes"?: Array<string>,
  "return_source"?: string,
  "return_status"?: Array<string>,
  "return_types"?: Array<string>,
}

export interface GlobalSellingSearchReturnOrdersResponse {
  "code"?: number,
  "data"?: {
  "next_page_token"?: string,
  "return_orders"?: Array<{
    "logistics"?: {
      "actual_quantity"?: number,
      "category_id"?: string,
      "confirm_quantity"?: number,
      "logistics_order"?: string,
      "platform_spu_code"?: string,
      "request_quantity"?: number,
      "shipping_provider_code"?: string,
      "skus"?: Array<Record<string, unknown>>,
    },
  }>,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GlobalSellingSearchStockupOrdersRequest {}


export interface GlobalSellingSearchStockupOrdersBody {
  "can_deliver"?: boolean,
  "emergency_levels"?: Array<string>,
  "external_skc_codes"?: Array<string>,
  "external_sku_codes"?: Array<string>,
  "is_delivery_completed"?: boolean,
  "is_first_order"?: boolean,
  "is_normal"?: boolean,
  "latest_status_update_ge"?: number,
  "latest_status_update_lt"?: number,
  "order_create_time_ge"?: number,
  "order_create_time_lt"?: number,
  "order_sources"?: Array<string>,
  "order_status"?: Array<string>,
  "order_types"?: Array<string>,
  "page_size"?: number,
  "page_token"?: string,
  "platform_sku_codes"?: Array<string>,
  "platform_spu_codes"?: Array<string>,
  "require_arrived_time_ge"?: number,
  "require_arrived_time_lt"?: number,
  "require_ship_time_ge"?: number,
  "require_ship_time_lt"?: number,
  "stockup_order_codes"?: Array<string>,
}

export interface GlobalSellingSearchStockupOrdersResponse {
  "code"?: number,
  "data"?: {
  "next_page_token"?: string,
  "stockup_orders"?: Array<{
    "skc"?: {
      "external_skc_code"?: string,
      "first_key_attribute_name_en"?: string,
      "first_key_attribute_name_zh"?: string,
      "first_key_attribute_value_en"?: string,
      "first_key_attribute_value_zh"?: string,
      "image_url"?: string,
      "platform_skc_code"?: string,
    },
  }>,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface QueryDeliveryBatchsRequest {
  /** The platform-defined ID for supplier. */
  "supplier_id": string,
  /** The list of logistics order codes. Up to 50 */
  "delivery_batch_codes": Array<string>,
}

export interface QueryDeliveryBatchsResponse {
  "code"?: number,
  "data"?: {
  "delivery_batchs"?: Array<{
    "logistics"?: {
      "delivery_option"?: string,
      "shipping_provider_code"?: string,
      "shipping_provider_name"?: string,
    },
    "logistics_orders"?: {
      "package_weight"?: {
        "unit"?: string,
        "value"?: number,
      },
    },
    "predicted_pick_info"?: {
      "end_time"?: number,
      "start_time"?: number,
    },
    "receiver_contact"?: {
      "address_detail"?: {
        "city_id"?: number,
        "city_name"?: string,
        "country_id"?: number,
        "country_name"?: string,
        "detail"?: string,
        "district_id"?: number,
        "district_name"?: string,
        "province_id"?: number,
        "province_name"?: string,
        "town_id"?: number,
        "town_name"?: string,
      },
      "contact_name"?: string,
      "email"?: string,
      "full_address"?: string,
      "phone_number"?: string,
      "postal_code"?: string,
    },
    "sender_contact"?: {
      "address_detail"?: {
        "city_id"?: number,
        "city_name"?: string,
        "country_id"?: number,
        "country_name"?: string,
        "detail"?: string,
        "district_id"?: number,
        "district_name"?: string,
        "province_id"?: number,
        "province_name"?: string,
        "town_id"?: number,
        "town_name"?: string,
      },
      "contact_name"?: string,
      "email"?: string,
      "full_address"?: string,
      "phone_number"?: string,
      "postal_code"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface ReserveShippingRequest {
  /** Platform-defined ID of supplier */
  "supplier_id": string,
}

export interface ReserveShippingBody {
  "delivery_mode"?: string,
  "delivery_order_codes"?: Array<string>,
  "logistics"?: {
  "delivery_option"?: string,
  "shipping_provider_code"?: string,
  "shipping_provider_name"?: string,
  },
  "reserve"?: {
  "predicted_arrived_time"?: number,
  "predicted_pickup_ge"?: number,
  "predicted_pickup_lt"?: number,
  "predicted_pickup_time"?: number,
  "predicted_ship_time"?: number,
  },
  "sender_contact"?: {
  "address_detail"?: {
    "city_id"?: number,
    "city_name"?: string,
    "country_id"?: number,
    "country_name"?: string,
    "detail"?: string,
    "district_id"?: number,
    "district_name"?: string,
    "province_id"?: number,
    "province_name"?: string,
    "town_id"?: number,
    "town_name"?: string,
  },
  "contact_name"?: string,
  "email"?: string,
  "full_address"?: string,
  "phone_number"?: string,
  "postal_code"?: string,
  },
  "total_weight"?: {
  "unit"?: string,
  "value"?: string,
  },
  "warehouse_code"?: string,
}

export interface ReserveShippingResponse {
  "code"?: number,
  "data"?: {
  "delivery_batch_code"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface SearchAvailableShippingProvidersRequest {
  /** Platform-defined ID of supplier. */
  "supplier_id": string,
}

export interface SearchAvailableShippingProvidersBody {
  "delivery_mode"?: string,
  "delivery_option"?: string,
  "delivery_order_codes"?: Array<string>,
  "sender_contact"?: {
  "address_detail"?: {
    "city_id"?: number,
    "city_name"?: string,
    "country_id"?: number,
    "country_name"?: string,
    "detail"?: string,
    "district_id"?: number,
    "district_name"?: string,
    "province_id"?: number,
    "province_name"?: string,
    "town_id"?: number,
    "town_name"?: string,
  },
  "contact_name"?: string,
  "email"?: string,
  "full_address"?: string,
  "phone_number"?: string,
  "postal_code"?: string,
  },
  "total_weight"?: {
  "unit"?: string,
  "value"?: string,
  },
  "warehouse_code"?: string,
}

export interface SearchAvailableShippingProvidersResponse {
  "code"?: number,
  "data"?: {
  "reserve_arrived_times"?: Array<Record<string, unknown>>,
  "shipping_providers"?: Array<{
    "max_charge_fee"?: {
      "amount"?: string,
      "currency"?: string,
    },
    "min_charge_fee"?: {
      "amount"?: string,
      "currency"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface SearchDeliveryOrdersRequest {
  /** Platform-defined ID of merchant */
  "supplier_id": string,
}

export interface SearchDeliveryOrdersBody {
  "arrived_time_ge"?: number,
  "arrived_time_lt"?: number,
  "delivery_batch_codes"?: Array<string>,
  "delivery_order_codes"?: Array<string>,
  "delivery_types"?: Array<string>,
  "emergency_levels"?: Array<string>,
  "external_skc_codes"?: Array<string>,
  "external_sku_codes"?: Array<string>,
  "is_sample_included"?: boolean,
  "order_types"?: Array<string>,
  "page_size"?: number,
  "page_token"?: string,
  "platform_spu_codes"?: Array<string>,
  "relative_codes"?: Array<string>,
  "require_arrived_time_ge"?: number,
  "require_arrived_time_lt"?: number,
  "ship_time_ge"?: number,
  "ship_time_lt"?: number,
  "warehouse_codes"?: Array<string>,
}

export interface SearchDeliveryOrdersResponse {
  "code"?: number,
  "data"?: {
  "delivery_orders"?: Array<{
    "logistics"?: {
      "delivery_option"?: string,
      "shipping_provider_code"?: string,
    },
    "skc"?: {
      "external_skc_code"?: string,
      "first_key_attribute_name_en"?: string,
      "first_key_attribute_name_zh"?: string,
      "first_key_attribute_value_en"?: string,
      "first_key_attribute_value_zh"?: string,
      "platform_skc_code"?: string,
    },
    "warehouse_contact"?: {
      "address_detail"?: {
        "city_id"?: number,
        "city_name"?: string,
        "country_id"?: number,
        "country_name"?: string,
        "detail"?: string,
        "district_id"?: number,
        "district_name"?: string,
        "province_id"?: number,
        "province_name"?: string,
        "town_id"?: number,
        "town_name"?: string,
      },
      "contact_name"?: string,
      "email"?: string,
      "full_address"?: string,
      "phone_number"?: string,
      "postal_code"?: string,
    },
  }>,
  "next_page_token"?: string,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface SearchStockupOrdersRequest {
  /** Platform-defined ID for supplier. */
  "supplier_id": string,
}

export interface SearchStockupOrdersBody {
  "can_deliver"?: boolean,
  "emergency_levels"?: Array<string>,
  "external_skc_codes"?: Array<string>,
  "external_sku_codes"?: Array<string>,
  "is_delivery_completed"?: boolean,
  "is_first_order"?: boolean,
  "is_normal"?: boolean,
  "order_create_time_ge"?: number,
  "order_create_time_lt"?: number,
  "order_sources"?: Array<string>,
  "order_status"?: Array<string>,
  "order_types"?: Array<string>,
  "page_size"?: number,
  "page_token"?: string,
  "platform_sku_codes"?: Array<string>,
  "platform_spu_codes"?: Array<string>,
  "require_arrived_time_ge"?: number,
  "require_arrived_time_lt"?: number,
  "require_ship_time_ge"?: number,
  "require_ship_time_lt"?: number,
  "stockup_order_codes"?: Array<string>,
}

export interface SearchStockupOrdersResponse {
  "code"?: number,
  "data"?: {
  "next_page_token"?: string,
  "stockup_orders"?: Array<{
    "skc"?: {
      "external_skc_code"?: string,
      "first_key_attribute_name_en"?: string,
      "first_key_attribute_name_zh"?: string,
      "first_key_attribute_value_en"?: string,
      "first_key_attribute_value_zh"?: string,
      "platform_skc_code"?: string,
    },
  }>,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export class TikTokGsFullServiceShipmentApi {
  constructor(private client: TikTokClient) {}

  /**
   * ConfirmDelivery
   * /gs_full_service_shipment/202405/preview/delivery_orders/confirm (POST)
   */
  async confirmDelivery(params: ConfirmDeliveryRequest, body?: ConfirmDeliveryBody, opts?: TikTokRequestOptions): Promise<ConfirmDeliveryResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_shipment/202405/preview/delivery_orders/confirm","baseUrl":"https://open-api.tiktokglobalshop.com","query":["supplier_id"],"headers":[],"pathParams":[],"body":["delivery_order_code"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * CreateDeliveryOrder
   * /gs_full_service_shipment/202405/preview/delivery_orders (POST)
   */
  async createDeliveryOrder(params: CreateDeliveryOrderRequest, body?: CreateDeliveryOrderBody, opts?: TikTokRequestOptions): Promise<CreateDeliveryOrderResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_shipment/202405/preview/delivery_orders","baseUrl":"https://open-api.tiktokglobalshop.com","query":["supplier_id"],"headers":[],"pathParams":[],"body":["delivery_order"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GSConfirmDelivery
   * /gs_full_service_shipment/202405/beta/delivery_orders/confirm (POST)
   */
  async gSConfirmDelivery(params: GSConfirmDeliveryRequest, body?: GSConfirmDeliveryBody, opts?: TikTokRequestOptions): Promise<GSConfirmDeliveryResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_shipment/202405/beta/delivery_orders/confirm","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["delivery_order_code"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GSCreateDeliveryOrder
   * /gs_full_service_shipment/202405/beta/delivery_orders (POST)
   */
  async gSCreateDeliveryOrder(params: GSCreateDeliveryOrderRequest, body?: GSCreateDeliveryOrderBody, opts?: TikTokRequestOptions): Promise<GSCreateDeliveryOrderResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_shipment/202405/beta/delivery_orders","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["delivery_order"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GSGetDelivery-OrderPrintDocument
   * /gs_full_service_shipment/202405/beta/delivery_orders/documents (GET)
   */
  async gSGetDeliveryOrderPrintDocument(params: GSGetDeliveryOrderPrintDocumentRequest, opts?: TikTokRequestOptions): Promise<GSGetDeliveryOrderPrintDocumentResponse> {
    return this.client.request({"method":"GET","path":"/gs_full_service_shipment/202405/beta/delivery_orders/documents","baseUrl":"https://open-api.tiktokglobalshop.com","query":["delivery_order_codes"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GSGetLogisticsWaybillsPrintDocument
   * /gs_full_service_shipment/202405/beta/waybills (GET)
   */
  async gSGetLogisticsWaybillsPrintDocument(params: GSGetLogisticsWaybillsPrintDocumentRequest, opts?: TikTokRequestOptions): Promise<GSGetLogisticsWaybillsPrintDocumentResponse> {
    return this.client.request({"method":"GET","path":"/gs_full_service_shipment/202405/beta/waybills","baseUrl":"https://open-api.tiktokglobalshop.com","query":["logistics_codes"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GSGetSKUPrintDocument
   * /gs_full_service_shipment/202405/beta/delivery_orders/sku_documents/generate (POST)
   */
  async gSGetSKUPrintDocument(params: GSGetSKUPrintDocumentRequest, body?: GSGetSKUPrintDocumentBody, opts?: TikTokRequestOptions): Promise<GSGetSKUPrintDocumentResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_shipment/202405/beta/delivery_orders/sku_documents/generate","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["dimension","platform_sku_items","print_sku_code","stockup_order_code"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GSQueryDeliveryBatchs
   * /gs_full_service_shipment/202405/beta/delivery_orders/delivery_batchs (GET)
   */
  async gSQueryDeliveryBatchs(params: GSQueryDeliveryBatchsRequest, opts?: TikTokRequestOptions): Promise<GSQueryDeliveryBatchsResponse> {
    return this.client.request({"method":"GET","path":"/gs_full_service_shipment/202405/beta/delivery_orders/delivery_batchs","baseUrl":"https://open-api.tiktokglobalshop.com","query":["delivery_batch_codes"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GSReserveShipping
   * /gs_full_service_shipment/202405/beta/delivery_orders/reserve_ship (POST)
   */
  async gSReserveShipping(params: GSReserveShippingRequest, body?: GSReserveShippingBody, opts?: TikTokRequestOptions): Promise<GSReserveShippingResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_shipment/202405/beta/delivery_orders/reserve_ship","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["delivery_mode","delivery_order_codes","logistics","reserve","sender_contact","shipping_box_quantity","total_weight","warehouse_code"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GSSearchAvailableShippingProviders
   * /gs_full_service_shipment/202405/beta/shipping_providers/search (POST)
   */
  async gSSearchAvailableShippingProviders(params: GSSearchAvailableShippingProvidersRequest, body?: GSSearchAvailableShippingProvidersBody, opts?: TikTokRequestOptions): Promise<GSSearchAvailableShippingProvidersResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_shipment/202405/beta/shipping_providers/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["delivery_mode","delivery_option","delivery_order_codes","sender_contact","total_weight","warehouse_code"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GSSearchDeliveryOrders
   * /gs_full_service_shipment/202405/beta/delivery_orders/search (POST)
   */
  async gSSearchDeliveryOrders(params: GSSearchDeliveryOrdersRequest, body?: GSSearchDeliveryOrdersBody, opts?: TikTokRequestOptions): Promise<GSSearchDeliveryOrdersResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_shipment/202405/beta/delivery_orders/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["arrived_time_ge","arrived_time_lt","delivery_batch_codes","delivery_order_codes","delivery_types","emergency_levels","external_skc_codes","external_sku_codes","is_sample_included","latest_status_update_ge","latest_status_update_lt","order_types","page_size","page_token","platform_spu_codes","relative_codes","require_arrived_time_ge","require_arrived_time_lt","ship_time_ge","ship_time_lt","warehouse_codes"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GSSearchStockupOrders
   * /gs_full_service_shipment/202405/beta/stockup_orders/search (POST)
   */
  async gSSearchStockupOrders(params: GSSearchStockupOrdersRequest, body?: GSSearchStockupOrdersBody, opts?: TikTokRequestOptions): Promise<GSSearchStockupOrdersResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_shipment/202405/beta/stockup_orders/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["can_deliver","emergency_levels","external_skc_codes","external_sku_codes","is_delivery_completed","is_first_order","is_normal","latest_status_update_ge","latest_status_update_lt","order_create_time_ge","order_create_time_lt","order_sources","order_status","order_types","page_size","page_token","platform_sku_codes","platform_spu_codes","require_arrived_time_ge","require_arrived_time_lt","require_ship_time_ge","require_ship_time_lt","stockup_order_codes"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GetDelivery-OrderPrintDocument
   * /gs_full_service_shipment/202405/preview/delivery_orders/documents (GET)
   */
  async getDeliveryOrderPrintDocument(params: GetDeliveryOrderPrintDocumentRequest, opts?: TikTokRequestOptions): Promise<GetDeliveryOrderPrintDocumentResponse> {
    return this.client.request({"method":"GET","path":"/gs_full_service_shipment/202405/preview/delivery_orders/documents","baseUrl":"https://open-api.tiktokglobalshop.com","query":["supplier_id","delivery_order_codes"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetLogisticsWaybillsPrintDocurement
   * /gs_full_service_shipment/202405/preview/waybills (GET)
   */
  async getLogisticsWaybillsPrintDocurement(params: GetLogisticsWaybillsPrintDocurementRequest, opts?: TikTokRequestOptions): Promise<GetLogisticsWaybillsPrintDocurementResponse> {
    return this.client.request({"method":"GET","path":"/gs_full_service_shipment/202405/preview/waybills","baseUrl":"https://open-api.tiktokglobalshop.com","query":["supplier_id","logistics_codes"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GlobalSellingCancelShipment
   * /gs_full_service_shipment/202407/logistics_orders/cancel_ship (POST)
   */
  async globalSellingCancelShipment(params: GlobalSellingCancelShipmentRequest, body?: GlobalSellingCancelShipmentBody, opts?: TikTokRequestOptions): Promise<GlobalSellingCancelShipmentResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_shipment/202407/logistics_orders/cancel_ship","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["logistics_order"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GlobalSellingConfirmStockupOrder
   * /gs_full_service_shipment/202409/stockup_orders/confirm (POST)
   */
  async globalSellingConfirmStockupOrder(params: GlobalSellingConfirmStockupOrderRequest, body?: GlobalSellingConfirmStockupOrderBody, opts?: TikTokRequestOptions): Promise<GlobalSellingConfirmStockupOrderResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_shipment/202409/stockup_orders/confirm","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["is_order_confirmed","reject_note","reject_reason","skus","stockup_order_code"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GlobalSellingGetQualityDocuments
   * /gs_full_service_shipment/202407/quality_documents (GET)
   */
  async globalSellingGetQualityDocuments(params: GlobalSellingGetQualityDocumentsRequest, opts?: TikTokRequestOptions): Promise<GlobalSellingGetQualityDocumentsResponse> {
    return this.client.request({"method":"GET","path":"/gs_full_service_shipment/202407/quality_documents","baseUrl":"https://open-api.tiktokglobalshop.com","query":["order_code","order_type"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GlobalSellingGetSKUPrintDocument
   * /gs_full_service_shipment/202503/delivery_orders/sku_documents/generate (POST)
   */
  async globalSellingGetSKUPrintDocument(params: GlobalSellingGetSKUPrintDocumentRequest, body?: GlobalSellingGetSKUPrintDocumentBody, opts?: TikTokRequestOptions): Promise<GlobalSellingGetSKUPrintDocumentResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_shipment/202503/delivery_orders/sku_documents/generate","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["need_separator","platform_sku_items","size","stockup_order_code"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GlobalSellingQueryLogisticsOrders
   * /gs_full_service_shipment/202407/logistics_orders (GET)
   */
  async globalSellingQueryLogisticsOrders(params: GlobalSellingQueryLogisticsOrdersRequest, opts?: TikTokRequestOptions): Promise<GlobalSellingQueryLogisticsOrdersResponse> {
    return this.client.request({"method":"GET","path":"/gs_full_service_shipment/202407/logistics_orders","baseUrl":"https://open-api.tiktokglobalshop.com","query":["logistics_orders"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GlobalSellingReserveShipment
   * /gs_full_service_shipment/202410/delivery_orders/reserve_ship (POST)
   */
  async globalSellingReserveShipment(params: GlobalSellingReserveShipmentRequest, body?: GlobalSellingReserveShipmentBody, opts?: TikTokRequestOptions): Promise<GlobalSellingReserveShipmentResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_shipment/202410/delivery_orders/reserve_ship","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["delivery_mode","delivery_order_codes","logistics","reserve","sender_contact_id","shipping_box_quantity","total_weight","warehouse_code"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GlobalSellingSearchAbnormalOrders
   * /gs_full_service_shipment/202407/abnormal_orders/search (POST)
   */
  async globalSellingSearchAbnormalOrders(params: GlobalSellingSearchAbnormalOrdersRequest, body?: GlobalSellingSearchAbnormalOrdersBody, opts?: TikTokRequestOptions): Promise<GlobalSellingSearchAbnormalOrdersResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_shipment/202407/abnormal_orders/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["abnormal_order_codes","abnormal_types","delivery_order_codes","external_skc_codes","external_sku_codes","latest_update_time_ge","latest_update_time_lt","order_create_time_ge","order_create_time_lt","page_size","page_token","platform_sku_codes","platform_spu_codes","relative_return_status","stockup_order_codes"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GlobalSellingSearchAvailableShippingProviders
   * /gs_full_service_shipment/202410/shipping_providers/search (POST)
   */
  async globalSellingSearchAvailableShippingProviders(params: GlobalSellingSearchAvailableShippingProvidersRequest, body?: GlobalSellingSearchAvailableShippingProvidersBody, opts?: TikTokRequestOptions): Promise<GlobalSellingSearchAvailableShippingProvidersResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_shipment/202410/shipping_providers/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["delivery_mode","delivery_option","delivery_order_codes","sender_contact_id","shipping_box_quantity","total_weight","warehouse_code"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GlobalSellingSearchDeliveryOrders
   * /gs_full_service_shipment/202407/delivery_orders/search (POST)
   */
  async globalSellingSearchDeliveryOrders(params: GlobalSellingSearchDeliveryOrdersRequest, body?: GlobalSellingSearchDeliveryOrdersBody, opts?: TikTokRequestOptions): Promise<GlobalSellingSearchDeliveryOrdersResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_shipment/202407/delivery_orders/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["arrived_time_ge","arrived_time_lt","delivery_order_codes","delivery_types","emergency_levels","external_skc_codes","external_sku_codes","is_sample_included","latest_status_update_ge","latest_status_update_lt","logistics_orders","order_types","page_size","page_token","platform_spu_codes","relative_codes","require_arrived_time_ge","require_arrived_time_lt","ship_time_ge","ship_time_lt","warehouse_codes"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GlobalSellingSearchReturnOrders
   * /gs_full_service_shipment/202407/return_orders/search (POST)
   */
  async globalSellingSearchReturnOrders(params: GlobalSellingSearchReturnOrdersRequest, body?: GlobalSellingSearchReturnOrdersBody, opts?: TikTokRequestOptions): Promise<GlobalSellingSearchReturnOrdersResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_shipment/202407/return_orders/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["external_skc_codes","external_sku_codes","order_create_time_ge","order_create_time_lt","page_size","page_token","platform_sku_codes","platform_spu_codes","return_methods","return_order_codes","return_source","return_status","return_types"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GlobalSellingSearchStockupOrders
   * /gs_full_service_shipment/202407/stockup_orders/search (POST)
   */
  async globalSellingSearchStockupOrders(params: GlobalSellingSearchStockupOrdersRequest, body?: GlobalSellingSearchStockupOrdersBody, opts?: TikTokRequestOptions): Promise<GlobalSellingSearchStockupOrdersResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_shipment/202407/stockup_orders/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["can_deliver","emergency_levels","external_skc_codes","external_sku_codes","is_delivery_completed","is_first_order","is_normal","latest_status_update_ge","latest_status_update_lt","order_create_time_ge","order_create_time_lt","order_sources","order_status","order_types","page_size","page_token","platform_sku_codes","platform_spu_codes","require_arrived_time_ge","require_arrived_time_lt","require_ship_time_ge","require_ship_time_lt","stockup_order_codes"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * QueryDeliveryBatchs
   * /gs_full_service_shipment/202405/preview/delivery_orders/delivery_batchs (GET)
   */
  async queryDeliveryBatchs(params: QueryDeliveryBatchsRequest, opts?: TikTokRequestOptions): Promise<QueryDeliveryBatchsResponse> {
    return this.client.request({"method":"GET","path":"/gs_full_service_shipment/202405/preview/delivery_orders/delivery_batchs","baseUrl":"https://open-api.tiktokglobalshop.com","query":["supplier_id","delivery_batch_codes"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * ReserveShipping
   * /gs_full_service_shipment/202405/preview/delivery_orders/reserve_ship (POST)
   */
  async reserveShipping(params: ReserveShippingRequest, body?: ReserveShippingBody, opts?: TikTokRequestOptions): Promise<ReserveShippingResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_shipment/202405/preview/delivery_orders/reserve_ship","baseUrl":"https://open-api.tiktokglobalshop.com","query":["supplier_id"],"headers":[],"pathParams":[],"body":["delivery_mode","delivery_order_codes","logistics","reserve","sender_contact","total_weight","warehouse_code"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * SearchAvailableShippingProviders
   * /gs_full_service_shipment/202405/preview/shipping_providers/search (POST)
   */
  async searchAvailableShippingProviders(params: SearchAvailableShippingProvidersRequest, body?: SearchAvailableShippingProvidersBody, opts?: TikTokRequestOptions): Promise<SearchAvailableShippingProvidersResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_shipment/202405/preview/shipping_providers/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":["supplier_id"],"headers":[],"pathParams":[],"body":["delivery_mode","delivery_option","delivery_order_codes","sender_contact","total_weight","warehouse_code"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * SearchDeliveryOrders
   * /gs_full_service_shipment/202405/preview/delivery_orders/search (POST)
   */
  async searchDeliveryOrders(params: SearchDeliveryOrdersRequest, body?: SearchDeliveryOrdersBody, opts?: TikTokRequestOptions): Promise<SearchDeliveryOrdersResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_shipment/202405/preview/delivery_orders/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":["supplier_id"],"headers":[],"pathParams":[],"body":["arrived_time_ge","arrived_time_lt","delivery_batch_codes","delivery_order_codes","delivery_types","emergency_levels","external_skc_codes","external_sku_codes","is_sample_included","order_types","page_size","page_token","platform_spu_codes","relative_codes","require_arrived_time_ge","require_arrived_time_lt","ship_time_ge","ship_time_lt","warehouse_codes"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * SearchStockupOrders
   * /gs_full_service_shipment/202405/preview/stockup_orders/search (POST)
   */
  async searchStockupOrders(params: SearchStockupOrdersRequest, body?: SearchStockupOrdersBody, opts?: TikTokRequestOptions): Promise<SearchStockupOrdersResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_shipment/202405/preview/stockup_orders/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":["supplier_id"],"headers":[],"pathParams":[],"body":["can_deliver","emergency_levels","external_skc_codes","external_sku_codes","is_delivery_completed","is_first_order","is_normal","order_create_time_ge","order_create_time_lt","order_sources","order_status","order_types","page_size","page_token","platform_sku_codes","platform_spu_codes","require_arrived_time_ge","require_arrived_time_lt","require_ship_time_ge","require_ship_time_lt","stockup_order_codes"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }
}
