import type { ApiConfig } from './types/api.types';

export interface OpenSellvyServer {
  start(): Promise<void>;
  stop(): Promise<void>;
}

export function createServer(_config?: ApiConfig): OpenSellvyServer {
  return {
    start: async () => {
      throw new Error('Not implemented');
    },
    stop: async () => {},
  };
}
