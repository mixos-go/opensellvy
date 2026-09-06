// AUTO-GENERATED from TikTok Shop reference docs (references/api/epharmacy).
// Do not edit by hand; run `npm run generate` in sdk/.

import { TikTokClient } from '../../tts.client'
import { TikTokRequestOptions } from '../../tts.types'

export interface GetConsultationProviderRequest {
  /** TTS consultation identifier (path) */
  "consultation_id": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetConsultationProviderResponse {
  "code"?: number,
  "data"?: {
  "consultation_provider"?: {
    "id"?: string,
  },
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GetPharmaciesRequest {
  /** An opaque token used to retrieve the next page of a paginated result set. Retrieve this value from the result of the next_page_token from a previous response. It is not needed for the first page. */
  "page_token"?: string,
  /** The number of results to be returned per page. Default: 50 Valid range: [1, 100] */
  "page_size"?: number,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface GetPharmaciesResponse {
  "code"?: number,
  "data"?: {
  "next_page_token"?: string,
  "pharmacies"?: Array<{
    "pharmacist"?: {
      "name"?: string,
      "practice_license_expire_time"?: number,
      "practice_license_number"?: string,
    },
  }>,
  "total_count"?: number,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface UpdatePharmaciesRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface UpdatePharmaciesBody {
  "pharmacies"?: Array<{
  "pharmacist"?: {
    "name"?: string,
    "practice_license_expire_time"?: number,
    "practice_license_number"?: string,
  },
  }>,
}

export interface UpdatePharmaciesResponse {
  "code"?: number,
  "data"?: {
  "errors"?: Array<{
    "detail"?: {
      "warehouse_id"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface UpdatePrescriptionRequirementRequest {
  /** The product ID associated with the prescription requirement. (path) */
  "product_id": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface UpdatePrescriptionRequirementBody {
  "prescription_requirement"?: {
  "needs_prescription"?: boolean,
  },
}

export interface UpdatePrescriptionRequirementResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export interface UpdatePrescriptionStatusRequest {
  /** Unique identifier of the order (path) */
  "order_id": string,
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface UpdatePrescriptionStatusBody {
  "prescription_status"?: string,
  "rejection_reason"?: string,
}

export interface UpdatePrescriptionStatusResponse {
  "code"?: number,
  "data"?: Record<string, unknown>,
  "message"?: string,
  "request_id"?: string,
}

export class TikTokEpharmacyApi {
  constructor(private client: TikTokClient) {}

  /**
   * GetConsultationProvider
   * /epharmacy/202507/consultations/{consultation_id}/providers (GET)
   */
  async getConsultationProvider(params: GetConsultationProviderRequest, opts?: TikTokRequestOptions): Promise<GetConsultationProviderResponse> {
    return this.client.request({"method":"GET","path":"/epharmacy/202507/consultations/{consultation_id}/providers","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":["consultation_id"],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * GetPharmacies
   * /epharmacy/202504/pharmacies (GET)
   */
  async getPharmacies(params: GetPharmaciesRequest, opts?: TikTokRequestOptions): Promise<GetPharmaciesResponse> {
    return this.client.request({"method":"GET","path":"/epharmacy/202504/pharmacies","baseUrl":"https://open-api.tiktokglobalshop.com","query":["page_token","page_size","shop_cipher"],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }

  /**
   * UpdatePharmacies
   * /epharmacy/202504/pharmacies/update (POST)
   */
  async updatePharmacies(params: UpdatePharmaciesRequest, body?: UpdatePharmaciesBody, opts?: TikTokRequestOptions): Promise<UpdatePharmaciesResponse> {
    return this.client.request({"method":"POST","path":"/epharmacy/202504/pharmacies/update","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":["pharmacies"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * UpdatePrescriptionRequirement
   * /epharmacy/202504/products/{product_id}/prescription_requirements/update (POST)
   */
  async updatePrescriptionRequirement(params: UpdatePrescriptionRequirementRequest, body?: UpdatePrescriptionRequirementBody, opts?: TikTokRequestOptions): Promise<UpdatePrescriptionRequirementResponse> {
    return this.client.request({"method":"POST","path":"/epharmacy/202504/products/{product_id}/prescription_requirements/update","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":["product_id"],"body":["prescription_requirement"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * UpdatePrescriptionStatus
   * /epharmacy/202504/orders/{order_id}/update_prescription_status (POST)
   */
  async updatePrescriptionStatus(params: UpdatePrescriptionStatusRequest, body?: UpdatePrescriptionStatusBody, opts?: TikTokRequestOptions): Promise<UpdatePrescriptionStatusResponse> {
    return this.client.request({"method":"POST","path":"/epharmacy/202504/orders/{order_id}/update_prescription_status","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":["order_id"],"body":["prescription_status","rejection_reason"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }
}
