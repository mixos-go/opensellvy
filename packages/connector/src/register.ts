import type { PlatformCode } from '@opensellvy/types';
import type { PlatformPlugin } from './base.connector';

const registry = new Map<PlatformCode, PlatformPlugin>();

export function registerPlatform(plugin: PlatformPlugin): void {
  registry.set(plugin.platform, plugin);
}

export function getPlatform(platform: PlatformCode): PlatformPlugin {
  const plugin = registry.get(platform);
  if (!plugin) {
    throw new Error(`Platform "${platform}" not registered`);
  }
  return plugin;
}

export function listPlatforms(): PlatformCode[] {
  return [...registry.keys()];
}

export function listPlugins(): PlatformPlugin[] {
  return [...registry.values()];
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