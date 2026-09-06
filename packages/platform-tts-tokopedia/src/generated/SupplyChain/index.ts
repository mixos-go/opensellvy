// AUTO-GENERATED from TikTok Shop reference docs (references/api/supply_chain).
// Do not edit by hand; run `npm run generate` in sdk/.

import { TikTokClient } from '../../tts.client'
import { TikTokRequestOptions } from '../../tts.types'

export interface ConfirmPackageShipmentRequest {}


export interface ConfirmPackageShipmentBody {
  "packages"?: Array<{
  "dimension"?: {
    "height"?: number,
    "length"?: number,
    "unit"?: string,
    "width"?: number,
  },
  "weight"?: {
    "unit"?: string,
    "value"?: number,
  },
  }>,
  "warehouse_provider_id"?: string,
}

export interface ConfirmPackageShipmentResponse {
  "code"?: number,
  "data"?: {
  "errors"?: Array<{
    "detail"?: {
      "package_id"?: string,
    },
  }>,
  "success_packages"?: Array<string>,
  },
  "message"?: string,
  "request_id"?: string,
}

export class TikTokSupplyChainApi {
  constructor(private client: TikTokClient) {}

  /**
   * ConfirmPackageShipment
   * /supply_chain/202309/packages/sync (POST)
   */
  async confirmPackageShipment(params: ConfirmPackageShipmentRequest, body?: ConfirmPackageShipmentBody, opts?: TikTokRequestOptions): Promise<ConfirmPackageShipmentResponse> {
    return this.client.request({"method":"POST","path":"/supply_chain/202309/packages/sync","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["packages","warehouse_provider_id"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }
}
