export type ID = string;

export type ISO8601 = string;

export type Currency = 'IDR';

export interface Money {
  amount: number;
  currency: Currency;
}

/**
 * Platform yang terkoneksi. 'local' = store lokal (tanpa API eksternal),
 * dipakai sebagai adapter bukti one-gate sebelum integrasi platform.
 */
export type PlatformCode = 'shopee' | 'tts-tokopedia' | 'lazada' | 'blibli' | 'local';

/** Platform eksternal saja (tanpa 'local'). */
export type ChannelPlatform = Exclude<PlatformCode, 'local'>;

export interface PageInfo {
  totalCount: number;
  hasNextPage: boolean;
  cursor?: string;
}

export interface Paginated<T> {
  items: T[];
  pageInfo: PageInfo;
}

export interface Address {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  subDistrict: string;
  postalCode: string;
  detail: string;
  latitude?: number;
  longitude?: number;
}

export interface Timestamps {
  createdAt: ISO8601;
  updatedAt: ISO8601;
}