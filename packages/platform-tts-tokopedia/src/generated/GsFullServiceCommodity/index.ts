// AUTO-GENERATED from TikTok Shop reference docs (references/api/gs_full_service_commodity).
// Do not edit by hand; run `npm run generate` in sdk/.

import { TikTokClient } from '../../tts.client'
import { TikTokRequestOptions } from '../../tts.types'

export interface GSCalculateProductAuditInfoRequest {}


export interface GSCalculateProductAuditInfoBody {
  "spu"?: {
  "attributes"?: Array<Record<string, unknown>>,
  "brand_id"?: string,
  "category_id"?: string,
  "certifications"?: Array<Record<string, unknown>>,
  "description"?: {
    "items"?: Array<Record<string, unknown>>,
  },
  "first_key_attribute_id"?: string,
  "grading_template_id"?: string,
  "ingredient"?: {
    "multi_material_composition"?: Array<{
      "component"?: {
        "property_value_id"?: string,
      },
    }>,
    "single_material_composition"?: Array<Record<string, unknown>>,
    "type"?: string,
  },
  "key_attribute"?: Array<Record<string, unknown>>,
  "manufacture_ids"?: Array<string>,
  "media"?: {
    "pic_set_type"?: string,
    "pic_type"?: string,
    "pictures"?: Array<Record<string, unknown>>,
    "videos"?: Array<Record<string, unknown>>,
  },
  "product_name_en"?: string,
  "product_name_zh"?: string,
  "rp_ids"?: Array<string>,
  "second_key_attribute_id"?: string,
  "size_group_id"?: string,
  "skcs"?: Array<{
    "skus"?: {
      "dimensions"?: {
        "height"?: string,
        "length"?: string,
        "unit"?: string,
        "width"?: string,
      },
      "price"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "reference_sale_price"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "weight"?: {
        "unit"?: string,
        "value"?: string,
      },
    },
  }>,
  },
}

export interface GSCalculateProductAuditInfoResponse {
  "code"?: number,
  "data"?: {
  "product_publish_detail"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSCreateProductRequest {
  /** ID of seller */
  "supplier_id": string,
}

export interface GSCreateProductBody {
  "spu"?: {
  "attributes"?: Array<Record<string, unknown>>,
  "brand_id"?: string,
  "category_id"?: string,
  "certifications"?: Array<Record<string, unknown>>,
  "first_key_attribute_id"?: string,
  "grading_template_id"?: string,
  "ingredient"?: {
    "multi_material_composition"?: Array<{
      "component"?: {
        "property_value_id"?: string,
      },
    }>,
    "single_material_composition"?: Array<Record<string, unknown>>,
    "type"?: string,
  },
  "media"?: {
    "pic_set_type"?: string,
    "pic_type"?: string,
    "pictures"?: Array<Record<string, unknown>>,
    "videos"?: Array<Record<string, unknown>>,
  },
  "product_name_en"?: string,
  "product_name_zh"?: string,
  "second_key_attribute_id"?: string,
  "size_group_id"?: string,
  "skcs"?: Array<{
    "skus"?: {
      "dimensions"?: {
        "height"?: string,
        "length"?: string,
        "unit"?: string,
        "width"?: string,
      },
      "price"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "weight"?: {
        "unit"?: string,
        "value"?: string,
      },
    },
  }>,
  },
}

export interface GSCreateProductResponse {
  "code"?: number,
  "data"?: {
  "spu_code"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSCreateProductv2Request {}


export interface GSCreateProductv2Body {
  "idempotent_key"?: string,
  "spu"?: {
  "attributes"?: Array<Record<string, unknown>>,
  "brand_id"?: string,
  "category_id"?: string,
  "certifications"?: Array<Record<string, unknown>>,
  "description"?: {
    "items"?: Array<Record<string, unknown>>,
  },
  "first_key_attribute_id"?: string,
  "grading_template_id"?: string,
  "ingredient"?: {
    "multi_material_composition"?: Array<{
      "component"?: {
        "property_value_id"?: string,
      },
    }>,
    "single_material_composition"?: Array<Record<string, unknown>>,
    "type"?: string,
  },
  "key_attribute"?: Array<Record<string, unknown>>,
  "manufacture_ids"?: Array<string>,
  "media"?: {
    "pic_set_type"?: string,
    "pic_type"?: string,
    "pictures"?: Array<Record<string, unknown>>,
    "videos"?: Array<Record<string, unknown>>,
  },
  "product_name_en"?: string,
  "product_name_zh"?: string,
  "rp_ids"?: Array<string>,
  "second_key_attribute_id"?: string,
  "size_group_id"?: string,
  "skcs"?: Array<{
    "skus"?: {
      "dimensions"?: {
        "height"?: string,
        "length"?: string,
        "unit"?: string,
        "width"?: string,
      },
      "price"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "reference_sale_price"?: {
        "amount"?: string,
        "currency"?: string,
      },
      "weight"?: {
        "unit"?: string,
        "value"?: string,
      },
    },
  }>,
  },
}

export interface GSCreateProductv2Response {
  "code"?: number,
  "data"?: {
  "spu_code"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSFullServiceGetBrandsRequest {}


export interface GSFullServiceGetBrandsResponse {
  "code"?: number,
  "data"?: {
  "brands"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSFullServiceGetCategoryinformationRequest {
  /** (path) */
  "category_id": string,
}

export interface GSFullServiceGetCategoryinformationResponse {
  "code"?: number,
  "data"?: {
  "first_key_attribute_id"?: string,
  "id"?: string,
  "is_allowed_jit"?: boolean,
  "is_custom_key_attribute"?: boolean,
  "is_enabled"?: boolean,
  "is_garment"?: boolean,
  "is_leaf"?: boolean,
  "level"?: number,
  "name_en"?: string,
  "name_zh"?: string,
  "parent_id"?: string,
  "second_key_attribute_id"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSFullServiceGetCertificationsRequest {
  /** Category id of Global Sellling. (path) */
  "category_id": string,
}

export interface GSFullServiceGetCertificationsResponse {
  "code"?: number,
  "data"?: {
  "certifications"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSFullServiceGetattributesRequest {
  /** ID of the category (path) */
  "category_id": string,
}

export interface GSFullServiceGetattributesResponse {
  "code"?: number,
  "data"?: {
  "attributes"?: Array<Record<string, unknown>>,
  "region_attributes"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSFullServicePreviewGetBrandsRequest {
  /** Supplier ID */
  "supplier_id"?: string,
}

export interface GSFullServicePreviewGetBrandsResponse {
  "code"?: number,
  "data"?: {
  "brands"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSFullServicePreviewGetattributesRequest {
  /** ID of the category (path) */
  "category_id": string,
}

export interface GSFullServicePreviewGetattributesResponse {
  "code"?: number,
  "data"?: {
  "attributes"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSFullServicePreviewGetcategoryinformationRequest {
  /** ID of the category (path) */
  "category_id": string,
}

export interface GSFullServicePreviewGetcategoryinformationResponse {
  "code"?: number,
  "data"?: {
  "first_key_attribute_id"?: string,
  "id"?: string,
  "is_allowed_jit"?: boolean,
  "is_custom_key_attribute"?: boolean,
  "is_enabled"?: boolean,
  "is_garment"?: boolean,
  "is_leaf"?: boolean,
  "level"?: number,
  "name_en"?: string,
  "name_zh"?: string,
  "parent_id"?: string,
  "second_key_attribute_id"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSFullServiceSearchCategoriesRequest {}


export interface GSFullServiceSearchCategoriesBody {
  "page_offset"?: number,
  "page_size"?: number,
}

export interface GSFullServiceSearchCategoriesResponse {
  "code"?: number,
  "data"?: {
  "categories"?: Array<Record<string, unknown>>,
  "page_offset"?: number,
  "page_size"?: number,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSGetSupplierRPRequest {
  /** It is an identifier used to retrieve the next page of data, and there is no need to pass it when requesting the first page. */
  "page_token"?: string,
  /** Indicates the number of data entries displayed per page, used to control the number of records returned in a single query. The default value is 10, and the page size must be less than or equal to 30. */
  "page_size"?: number,
}

export interface GSGetSupplierRPResponse {
  "code"?: number,
  "data"?: {
  "next_page_token"?: string,
  "rp_infos"?: Array<{
    "address"?: {
      "city"?: string,
      "country"?: string,
      "province"?: string,
      "street"?: string,
      "street2"?: string,
    },
    "name"?: {
      "first_name"?: string,
      "last_name"?: string,
      "middle_name"?: string,
    },
    "phone_number"?: {
      "phone_number"?: string,
      "phone_number_region"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSGetgradingtemplatesconfigV2Request {}


export interface GSGetgradingtemplatesconfigV2Response {
  "code"?: number,
  "data"?: {
  "grading_templates"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSGetsizegroupsconfigV2Request {
  "category_id": string,
}

export interface GSGetsizegroupsconfigV2Response {
  "code"?: number,
  "data"?: {
  "size_grading_required"?: boolean,
  "size_groups"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSImageUploadV2Request {}


export interface GSImageUploadV2Response {
  "code"?: number,
  "data"?: {
  "length"?: number,
  "uri"?: string,
  "url"?: string,
  "width"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSListSupplierManufacturerRequest {
  /** It is an identifier used to retrieve the next page of data, and there is no need to pass it when requesting the first page. */
  "page_token"?: string,
  /** Indicates the number of data entries displayed per page, used to control the number of records returned in a single query. The default value is 10, and the page size must be less than or equal to 30. */
  "page_size"?: number,
}

export interface GSListSupplierManufacturerResponse {
  "code"?: number,
  "data"?: {
  "manufacturer_list"?: Array<{
    "phone_number"?: {
      "phone_number"?: string,
      "phone_number_region"?: string,
    },
  }>,
  "next_page_token"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSProductimageuploadrequirementsqueryRequest {
  /** (path) */
  "category_id": string,
}

export interface GSProductimageuploadrequirementsqueryResponse {
  "code"?: number,
  "data"?: {
  "image_upload_requirements"?: Array<Record<string, unknown>>,
  "pic_upload_way_configs"?: Array<string>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSQualificationfileuploadRequest {}


export interface GSQualificationfileuploadResponse {
  "code"?: number,
  "data"?: {
  "uri"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSQuerySKUsandtheapprovalstatusofSKUsV2Request {}


export interface GSQuerySKUsandtheapprovalstatusofSKUsV2Body {
  "external_sku_codes"?: Array<string>,
  "page_size"?: number,
  "page_token"?: string,
  "platform_sku_codes"?: Array<string>,
  "platform_spu_codes"?: Array<string>,
  "push_time_ge"?: number,
  "push_time_lt"?: number,
  "sku_status"?: string,
}

export interface GSQuerySKUsandtheapprovalstatusofSKUsV2Response {
  "code"?: number,
  "data"?: {
  "next_page_token"?: string,
  "spus"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSVideoUploadRequest {}


export interface GSVideoUploadResponse {
  "code"?: number,
  "data"?: {
  "uri"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetGlobalSellingFullServiceCategoriesRequest {}


export interface GetGlobalSellingFullServiceCategoriesBody {
  "page_offset"?: number,
  "page_size"?: number,
}

export interface GetGlobalSellingFullServiceCategoriesResponse {
  "code"?: number,
  "data"?: {
  "categories"?: Array<Record<string, unknown>>,
  "page_offset"?: number,
  "page_size"?: number,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetSizeGroupsRequest {
  /** leaf category id */
  "category_id": string,
}

export interface GetSizeGroupsResponse {
  "code"?: number,
  "data"?: {
  "size_grading_data"?: {
    "size_grading_required"?: boolean,
    "size_groups"?: Array<Record<string, unknown>>,
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetgradingtemplatesconfigRequest {
  /** identity ID of supplier */
  "supplier_id": string,
}

export interface GetgradingtemplatesconfigResponse {
  "code"?: number,
  "data"?: {
  "grading_templates"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetsizegroupsconfigRequest {
  /** leaf category id */
  "category_id": string,
}

export interface GetsizegroupsconfigResponse {
  "code"?: number,
  "data"?: {
  "size_grading_required"?: boolean,
  "size_groups"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GlobalSellingGetSupplierAddressesRequest {
  /** Page offset */
  "page_token"?: string,
  /** Page size, default 10, less or equal to 50 */
  "page_size"?: number,
}

export interface GlobalSellingGetSupplierAddressesResponse {
  "code"?: number,
  "data"?: {
  "addresses"?: Array<{
    "detail"?: {
      "building"?: string,
      "city_name"?: string,
      "country_name"?: string,
      "district_name"?: string,
      "province_name"?: string,
      "town_name"?: string,
    },
  }>,
  "next_page_token"?: string,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface QuerySKUsandtheapprovalstatusofSKUsRequest {
  /** identity ID of supplier */
  "supplier_id": string,
}

export interface QuerySKUsandtheapprovalstatusofSKUsBody {
  "external_sku_codes"?: Array<string>,
  "page_size"?: number,
  "page_token"?: string,
  "platform_sku_codes"?: Array<string>,
  "platform_spu_codes"?: Array<string>,
  "push_time_ge"?: number,
  "push_time_lt"?: number,
  "sku_status"?: string,
}

export interface QuerySKUsandtheapprovalstatusofSKUsResponse {
  "code"?: number,
  "data"?: {
  "next_page_token"?: string,
  "spus"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface ImageuploadRequest {
  /** identity ID of supplier */
  "supplier_id": string,
}

export interface ImageuploadResponse {
  "code"?: number,
  "data"?: {
  "height"?: number,
  "uri"?: string,
  "url"?: string,
  "width"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export class TikTokGsFullServiceCommodityApi {
  constructor(private client: TikTokClient) {}

  /**
   * GSCalculateProductAuditInfo
   * /gs_full_service_commodity/202509/calculate_audit_info (POST)
   */
  async gSCalculateProductAuditInfo(params: GSCalculateProductAuditInfoRequest, body?: GSCalculateProductAuditInfoBody, opts?: TikTokRequestOptions): Promise<GSCalculateProductAuditInfoResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_commodity/202509/calculate_audit_info","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["spu"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GSCreateProduct
   * /gs_full_service_commodity/202405/preview/products (POST)
   */
  async gSCreateProduct(params: GSCreateProductRequest, body?: GSCreateProductBody, opts?: TikTokRequestOptions): Promise<GSCreateProductResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_commodity/202405/preview/products","baseUrl":"https://open-api.tiktokglobalshop.com","query":["supplier_id"],"headers":[],"pathParams":[],"body":["spu"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GSCreateProductv2
   * /gs_full_service_commodity/202509/beta/products (POST)
   */
  async gSCreateProductv2(params: GSCreateProductv2Request, body?: GSCreateProductv2Body, opts?: TikTokRequestOptions): Promise<GSCreateProductv2Response> {
    return this.client.request({"method":"POST","path":"/gs_full_service_commodity/202509/beta/products","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["idempotent_key","spu"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GSFullServiceGetBrands
   * /gs_full_service_commodity/202405/beta/brands (GET)
   */
  async gSFullServiceGetBrands(params: GSFullServiceGetBrandsRequest, opts?: TikTokRequestOptions): Promise<GSFullServiceGetBrandsResponse> {
    return this.client.request({"method":"GET","path":"/gs_full_service_commodity/202405/beta/brands","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GSFullServiceGetCategoryinformation
   * /gs_full_service_commodity/202405/beta/categories/{category_id} (GET)
   */
  async gSFullServiceGetCategoryinformation(params: GSFullServiceGetCategoryinformationRequest, opts?: TikTokRequestOptions): Promise<GSFullServiceGetCategoryinformationResponse> {
    return this.client.request({"method":"GET","path":"/gs_full_service_commodity/202405/beta/categories/{category_id}","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":["category_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GSFullServiceGetCertifications
   * /gs_full_service_commodity/202507/beta/categories/{category_id}/certifications (GET)
   */
  async gSFullServiceGetCertifications(params: GSFullServiceGetCertificationsRequest, opts?: TikTokRequestOptions): Promise<GSFullServiceGetCertificationsResponse> {
    return this.client.request({"method":"GET","path":"/gs_full_service_commodity/202507/beta/categories/{category_id}/certifications","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":["category_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GSFullServiceGetattributes
   * /gs_full_service_commodity/202507/beta/categories/{category_id}/attributes (GET)
   */
  async gSFullServiceGetattributes(params: GSFullServiceGetattributesRequest, opts?: TikTokRequestOptions): Promise<GSFullServiceGetattributesResponse> {
    return this.client.request({"method":"GET","path":"/gs_full_service_commodity/202507/beta/categories/{category_id}/attributes","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":["category_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GSFullServicePreviewGetBrands
   * /gs_full_service_commodity/202404/preview/brands (GET)
   */
  async gSFullServicePreviewGetBrands(params: GSFullServicePreviewGetBrandsRequest, opts?: TikTokRequestOptions): Promise<GSFullServicePreviewGetBrandsResponse> {
    return this.client.request({"method":"GET","path":"/gs_full_service_commodity/202404/preview/brands","baseUrl":"https://open-api.tiktokglobalshop.com","query":["supplier_id"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GSFullServicePreviewGetattributes
   * /gs_full_service_commodity/202404/preview/categories/{category_id}/attributes (GET)
   */
  async gSFullServicePreviewGetattributes(params: GSFullServicePreviewGetattributesRequest, opts?: TikTokRequestOptions): Promise<GSFullServicePreviewGetattributesResponse> {
    return this.client.request({"method":"GET","path":"/gs_full_service_commodity/202404/preview/categories/{category_id}/attributes","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":["category_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GSFullServicePreviewGetcategoryinformation
   * /gs_full_service_commodity/202404/preview/categories/{category_id} (GET)
   */
  async gSFullServicePreviewGetcategoryinformation(params: GSFullServicePreviewGetcategoryinformationRequest, opts?: TikTokRequestOptions): Promise<GSFullServicePreviewGetcategoryinformationResponse> {
    return this.client.request({"method":"GET","path":"/gs_full_service_commodity/202404/preview/categories/{category_id}","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":["category_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GSFullServiceSearchCategories
   * /gs_full_service_commodity/202405/beta/categories/search (POST)
   */
  async gSFullServiceSearchCategories(params: GSFullServiceSearchCategoriesRequest, body?: GSFullServiceSearchCategoriesBody, opts?: TikTokRequestOptions): Promise<GSFullServiceSearchCategoriesResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_commodity/202405/beta/categories/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["page_offset","page_size"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GSGetSupplierRP
   * /gs_full_service_commodity/202508/supplier_rps (GET)
   */
  async gSGetSupplierRP(params: GSGetSupplierRPRequest, opts?: TikTokRequestOptions): Promise<GSGetSupplierRPResponse> {
    return this.client.request({"method":"GET","path":"/gs_full_service_commodity/202508/supplier_rps","baseUrl":"https://open-api.tiktokglobalshop.com","query":["page_token","page_size"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GSGetgradingtemplatesconfigV2
   * /gs_full_service_commodity/202406/beta/grading_templates (GET)
   */
  async gSGetgradingtemplatesconfigV2(params: GSGetgradingtemplatesconfigV2Request, opts?: TikTokRequestOptions): Promise<GSGetgradingtemplatesconfigV2Response> {
    return this.client.request({"method":"GET","path":"/gs_full_service_commodity/202406/beta/grading_templates","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GSGetsizegroupsconfigV2
   * /gs_full_service_commodity/202406/beta/size_groups (GET)
   */
  async gSGetsizegroupsconfigV2(params: GSGetsizegroupsconfigV2Request, opts?: TikTokRequestOptions): Promise<GSGetsizegroupsconfigV2Response> {
    return this.client.request({"method":"GET","path":"/gs_full_service_commodity/202406/beta/size_groups","baseUrl":"https://open-api.tiktokglobalshop.com","query":["category_id"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GSImageUploadV2
   * /gs_full_service_commodity/202406/beta/images/upload (POST)
   */
  async gSImageUploadV2(params: GSImageUploadV2Request, opts?: TikTokRequestOptions): Promise<GSImageUploadV2Response> {
    return this.client.request({"method":"POST","path":"/gs_full_service_commodity/202406/beta/images/upload","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GSListSupplierManufacturer
   * /gs_full_service_commodity/202508/supplier_manufacturers (GET)
   */
  async gSListSupplierManufacturer(params: GSListSupplierManufacturerRequest, opts?: TikTokRequestOptions): Promise<GSListSupplierManufacturerResponse> {
    return this.client.request({"method":"GET","path":"/gs_full_service_commodity/202508/supplier_manufacturers","baseUrl":"https://open-api.tiktokglobalshop.com","query":["page_token","page_size"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GSProductimageuploadrequirementsquery
   * /gs_full_service_commodity/202405/beta/categories/{category_id}/image_upload_requirements (GET)
   */
  async gSProductimageuploadrequirementsquery(params: GSProductimageuploadrequirementsqueryRequest, opts?: TikTokRequestOptions): Promise<GSProductimageuploadrequirementsqueryResponse> {
    return this.client.request({"method":"GET","path":"/gs_full_service_commodity/202405/beta/categories/{category_id}/image_upload_requirements","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":["category_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GSQualificationfileupload
   * /gs_full_service_commodity/202405/beta/certification_files/upload (POST)
   */
  async gSQualificationfileupload(params: GSQualificationfileuploadRequest, opts?: TikTokRequestOptions): Promise<GSQualificationfileuploadResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_commodity/202405/beta/certification_files/upload","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GSQuerySKUsandtheapprovalstatusofSKUsV2
   * /gs_full_service_commodity/202504/beta/products/search (POST)
   */
  async gSQuerySKUsandtheapprovalstatusofSKUsV2(params: GSQuerySKUsandtheapprovalstatusofSKUsV2Request, body?: GSQuerySKUsandtheapprovalstatusofSKUsV2Body, opts?: TikTokRequestOptions): Promise<GSQuerySKUsandtheapprovalstatusofSKUsV2Response> {
    return this.client.request({"method":"POST","path":"/gs_full_service_commodity/202504/beta/products/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["external_sku_codes","page_size","page_token","platform_sku_codes","platform_spu_codes","push_time_ge","push_time_lt","sku_status"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GSVideoUpload
   * /gs_full_service_commodity/202405/beta/videos/upload (POST)
   */
  async gSVideoUpload(params: GSVideoUploadRequest, opts?: TikTokRequestOptions): Promise<GSVideoUploadResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_commodity/202405/beta/videos/upload","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetGlobalSellingFullServiceCategories
   * /gs_full_service_commodity/202404/preview/categories/search (POST)
   */
  async getGlobalSellingFullServiceCategories(params: GetGlobalSellingFullServiceCategoriesRequest, body?: GetGlobalSellingFullServiceCategoriesBody, opts?: TikTokRequestOptions): Promise<GetGlobalSellingFullServiceCategoriesResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_commodity/202404/preview/categories/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["page_offset","page_size"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GetSizeGroups
   * /gs_full_service_commodity/202408/size_groups (GET)
   */
  async getSizeGroups(params: GetSizeGroupsRequest, opts?: TikTokRequestOptions): Promise<GetSizeGroupsResponse> {
    return this.client.request({"method":"GET","path":"/gs_full_service_commodity/202408/size_groups","baseUrl":"https://open-api.tiktokglobalshop.com","query":["category_id"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * Getgradingtemplatesconfig
   * /gs_full_service_commodity/202405/preview/grading_templates (GET)
   */
  async getgradingtemplatesconfig(params: GetgradingtemplatesconfigRequest, opts?: TikTokRequestOptions): Promise<GetgradingtemplatesconfigResponse> {
    return this.client.request({"method":"GET","path":"/gs_full_service_commodity/202405/preview/grading_templates","baseUrl":"https://open-api.tiktokglobalshop.com","query":["supplier_id"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * Getsizegroupsconfig
   * /gs_full_service_commodity/202405/preview/size_groups (GET)
   */
  async getsizegroupsconfig(params: GetsizegroupsconfigRequest, opts?: TikTokRequestOptions): Promise<GetsizegroupsconfigResponse> {
    return this.client.request({"method":"GET","path":"/gs_full_service_commodity/202405/preview/size_groups","baseUrl":"https://open-api.tiktokglobalshop.com","query":["category_id"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GlobalSellingGetSupplierAddresses
   * /gs_full_service_commodity/202407/supplier_addresses (GET)
   */
  async globalSellingGetSupplierAddresses(params: GlobalSellingGetSupplierAddressesRequest, opts?: TikTokRequestOptions): Promise<GlobalSellingGetSupplierAddressesResponse> {
    return this.client.request({"method":"GET","path":"/gs_full_service_commodity/202407/supplier_addresses","baseUrl":"https://open-api.tiktokglobalshop.com","query":["page_token","page_size"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * QuerySKUsandtheapprovalstatusofSKUs
   * /gs_full_service_commodity/202405/preview/products/search (POST)
   */
  async querySKUsandtheapprovalstatusofSKUs(params: QuerySKUsandtheapprovalstatusofSKUsRequest, body?: QuerySKUsandtheapprovalstatusofSKUsBody, opts?: TikTokRequestOptions): Promise<QuerySKUsandtheapprovalstatusofSKUsResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_commodity/202405/preview/products/search","baseUrl":"https://open-api.tiktokglobalshop.com","query":["supplier_id"],"headers":[],"pathParams":[],"body":["external_sku_codes","page_size","page_token","platform_sku_codes","platform_spu_codes","push_time_ge","push_time_lt","sku_status"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * imageupload
   * /gs_full_service_commodity/202405/preview/images/upload (POST)
   */
  async imageupload(params: ImageuploadRequest, opts?: TikTokRequestOptions): Promise<ImageuploadResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_commodity/202405/preview/images/upload","baseUrl":"https://open-api.tiktokglobalshop.com","query":["supplier_id"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }
}
