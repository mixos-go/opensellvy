export interface DbOptions {
  url?: string;
  max?: number;
  ssl?: boolean;
}

export interface Database {
  connect(options?: DbOptions): Promise<void>;
  disconnect(): Promise<void>;
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
}
