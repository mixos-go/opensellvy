import type { PlatformCode } from '../types';

export type PlatformConnectorFactory = () => unknown;

const registry = new Map<PlatformCode, PlatformConnectorFactory>();

export function registerPlatform(
  platform: PlatformCode,
  factory: PlatformConnectorFactory,
): void {
  registry.set(platform, factory);
}

export function getPlatform(platform: PlatformCode): PlatformConnectorFactory {
  const factory = registry.get(platform);
  if (!factory) {
    throw new Error(`Platform "${platform}" not registered`);
  }
  return factory;
}

export function listPlatforms(): PlatformCode[] {
  return [...registry.keys()];
}

export interface ConnectorRegistry {
  register: typeof registerPlatform;
  get: typeof getPlatform;
  list: typeof listPlatforms;
}

export const connectors: ConnectorRegistry = {
  register: registerPlatform,
  get: getPlatform,
  list: listPlatforms,
};
