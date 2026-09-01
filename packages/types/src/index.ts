export type ID = string;

export type PlatformCode = 'shopee' | 'tts-tokopedia' | 'lazada' | 'blibli';

export type ISO8601 = string;

export interface Money {
  amount: number;
  currency: 'IDR';
}

export interface Price {
  retail: Money;
  sale?: Money;
  cost?: Money;
}

export interface PageInfo {
  totalCount: number;
  hasNextPage: boolean;
  cursor?: string;
}

export interface Paginated<T> {
  items: T[];
  pageInfo: PageInfo;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
