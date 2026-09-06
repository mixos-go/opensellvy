// AUTO-GENERATED from TikTok Shop reference docs (references/api/gs_full_service_inventory).
// Do not edit by hand; run `npm run generate` in sdk/.

import { TikTokClient } from '../../tts.client'
import { TikTokRequestOptions } from '../../tts.types'

export interface GSFullServiceQueryVirtualInventoryRequest {}


export interface GSFullServiceQueryVirtualInventoryBody {
  "skus"?: Array<string>,
}

export interface GSFullServiceQueryVirtualInventoryResponse {
  "code"?: number,
  "data"?: {
  "inventory"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface GSFullServiceUpdateVirtualInventoryRequest {}


export interface GSFullServiceUpdateVirtualInventoryBody {
  "skus"?: Array<Record<string, unknown>>,
}

export interface GSFullServiceUpdateVirtualInventoryResponse {
  "code"?: number,
  "data"?: {
  "errors"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface QueryGlobalSellingVirtualInventoryRequest {}


export interface QueryGlobalSellingVirtualInventoryBody {
  "skus"?: Array<string>,
  "supplier_id"?: string,
}

export interface QueryGlobalSellingVirtualInventoryResponse {
  "code"?: number,
  "data"?: {
  "inventory"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export interface SetGlobalSellingVirtualInventoryRequest {}


export interface SetGlobalSellingVirtualInventoryBody {
  "skus"?: Array<Record<string, unknown>>,
  "supplier_id"?: string,
}

export interface SetGlobalSellingVirtualInventoryResponse {
  "code"?: number,
  "data"?: {
  "errors"?: Array<Record<string, unknown>>,
  },
  "message"?: string,
  "request_id"?: string,
}

export class TikTokGsFullServiceInventoryApi {
  constructor(private client: TikTokClient) {}

  /**
   * GSFullServiceQueryVirtualInventory
   * /gs_full_service_inventory/202405/beta/virtual_inventory/query (POST)
   */
  async gSFullServiceQueryVirtualInventory(params: GSFullServiceQueryVirtualInventoryRequest, body?: GSFullServiceQueryVirtualInventoryBody, opts?: TikTokRequestOptions): Promise<GSFullServiceQueryVirtualInventoryResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_inventory/202405/beta/virtual_inventory/query","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["skus"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * GSFullServiceUpdateVirtualInventory
   * /gs_full_service_inventory/202405/beta/virtual_inventory/update (POST)
   */
  async gSFullServiceUpdateVirtualInventory(params: GSFullServiceUpdateVirtualInventoryRequest, body?: GSFullServiceUpdateVirtualInventoryBody, opts?: TikTokRequestOptions): Promise<GSFullServiceUpdateVirtualInventoryResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_inventory/202405/beta/virtual_inventory/update","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["skus"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * QueryGlobalSellingVirtualInventory
   * /gs_full_service_inventory/202404/preview/virtual_inventory/query (POST)
   */
  async queryGlobalSellingVirtualInventory(params: QueryGlobalSellingVirtualInventoryRequest, body?: QueryGlobalSellingVirtualInventoryBody, opts?: TikTokRequestOptions): Promise<QueryGlobalSellingVirtualInventoryResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_inventory/202404/preview/virtual_inventory/query","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["skus","supplier_id"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }

  /**
   * SetGlobalSellingVirtualInventory
   * /gs_full_service_inventory/202404/preview/virtual_inventory/update (POST)
   */
  async setGlobalSellingVirtualInventory(params: SetGlobalSellingVirtualInventoryRequest, body?: SetGlobalSellingVirtualInventoryBody, opts?: TikTokRequestOptions): Promise<SetGlobalSellingVirtualInventoryResponse> {
    return this.client.request({"method":"POST","path":"/gs_full_service_inventory/202404/preview/virtual_inventory/update","baseUrl":"https://open-api.tiktokglobalshop.com","query":[],"headers":[],"pathParams":[],"body":["skus","supplier_id"]}, { ...(params as unknown as Record<string, unknown>), ...((body || {}) as Record<string, unknown>) }, opts)
  }
}
