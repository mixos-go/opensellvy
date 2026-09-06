import type { PlatformCode } from '@opensellvy/types';
import type { PlatformPlugin } from './base.connector';
import { assertCapabilitiesImplementable } from './capabilities';

const registry = new Map<PlatformCode, PlatformPlugin>();

const DEFAULTS = { replace: false, force: false } as const;

export interface RegisterOptions {
  /**
   * true → timpa plugin yang sudah ada untuk kode yang sama (default false).
   * Default (false) melempar RegisterError agar dua adapter tidak diam-diam
   * saling menimpa di registry satu-gate.
   */
  replace?: boolean;
  /** alias replace — untuk backward-compat pola lain. */
  force?: boolean;
}

export function registerPlatform(plugin: PlatformPlugin, options: RegisterOptions = {}): void {
  const { replace = DEFAULTS.replace, force = DEFAULTS.force } = options;
  const shouldReplace = replace || force;
  if (registry.has(plugin.platform) && !shouldReplace) {
    const existing = registry.get(plugin.platform)!;
    throw new RegisterError(
      `Platform "${plugin.platform}" sudah terdaftar (${existing.name}). ` +
        'Pakai { replace: true } untuk menimpa, atau pastikan hanya satu adapter per platform.',
      plugin.platform,
    );
  }
  const missing = assertCapabilitiesImplementable(plugin);
  if (missing.length > 0) {
    throw new RegisterError(
      `Platform "${plugin.platform}" mendeklarasikan capability yang tidak didukung gateway:\n` +
        '  - ' + missing.join('\n  - ') +
        '\nCek CAPABILITY_METHODS di @opensellvy/connector. Hilangkan capability yang platform ini ' +
        'tidak sediakan, atau lengkapi method gateway yang dibutuhkan.',
      plugin.platform,
    );
  }
  registry.set(plugin.platform, plugin);
}

export class RegisterError extends Error {
  constructor(message: string, public readonly platform: PlatformCode) {
    super(message);
    this.name = 'RegisterError';
  }
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