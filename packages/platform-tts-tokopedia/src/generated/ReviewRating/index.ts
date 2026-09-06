// AUTO-GENERATED from TikTok Shop reference docs (references/api/review_rating).
// Do not edit by hand; run `npm run generate` in sdk/.

import { TikTokClient } from '../../tts.client'
import { TikTokRequestOptions } from '../../tts.types'

export interface ImportProductReviewsRequest {
  /** Use this property to pass shop information in requesting the API. Failure in passing the correct value when requesting the API for cross-border shops will return incorrect response. */
  "shop_cipher"?: string,
}

export interface ImportProductReviewsBody {
  "product_review"?: {
  "product"?: {
    "description"?: string,
    "identifiers"?: {
      "external_product_id"?: string,
      "product_identifier_code"?: string,
      "seller_sku"?: string,
      "tiktok_product_id"?: string,
    },
    "image_uris"?: Array<string>,
    "name"?: string,
  },
  "review_records"?: Array<Record<string, unknown>>,
  },
}

export interface ImportProductReviewsResponse {
  "code"?: number,
  "data"?: {
  "errors"?: Array<{
    "detail"?: {
      "external_review_id"?: string,
    },
  }>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface UploadReviewMediaRequest {}


export interface UploadReviewMediaResponse {
  "code"?: number,
  "data"?: {
  "uri"?: string,
  },
  "message"?: string,
  "request_id"?: string,
}

export class TikTokReviewRatingApi {
  constructor(private client: TikTokClient) {}

  /**
   * ImportProductReviews
   * /review_rating/202508/product_reviews (POST)
   */
  async importProductReviews(params: ImportProductReviewsRequest, body?: ImportProductReviewsBody, opts?: TikTokRequestOptions): Promise<ImportProductReviewsResponse> {
    return this.client.request({"method":"POST","path":"/review_rating/202508/product_reviews","baseUrl":"https://open-api.tiktokglobalshop.com","query":["shop_cipher"],"headers":[],"pathParams":[],"body":["product_review"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * UploadReviewMedia
   * /review_rating/202410/media/upload (POST)
   */
  async uploadReviewMedia(params: UploadReviewMediaRequest, opts?: TikTokRequestOptions): Promise<UploadReviewMediaResponse> {
    return this.client.request({"method":"POST","path":"/review_rating/202410/media/upload","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":[]}, params as unknown as Record<string, unknown>, opts)
  }
}
