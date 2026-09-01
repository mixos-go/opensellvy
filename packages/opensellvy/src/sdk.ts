import { connectors } from '@opensellvy/connector';
import type { ConnectorRegistry } from '@opensellvy/connector';
import { createServices } from '@opensellvy/module';
import type { Services, ModuleDeps } from '@opensellvy/module';
import type { OpenSellvyConfig } from './config';
import type { PlatformCode } from '@opensellvy/types';

export class OpenSellvy {
  private readonly services: Services;

  constructor(
    private readonly config: OpenSellvyConfig,
    deps?: Partial<Omit<ModuleDeps, 'registry'>>,
  ) {
    const credentials = deps?.credentials ?? this.defaultCredentials();
    this.services = createServices({
      deps: { registry: this.connectors, tokens: deps?.tokens, credentials, events: deps?.events },
    });
    void this.config;
  }

  get modules(): Services {
    return this.services;
  }

  get connectors(): ConnectorRegistry {
    return connectors;
  }

  private defaultCredentials(): ModuleDeps['credentials'] {
    return async (_storeId, platform) => {
      const pc = this.config.platforms?.[platform as PlatformCode];
      if (!pc) throw new Error(`Platform config "${platform}" tidak ada di config.platforms`);
      return { appId: pc.appId, secret: pc.secret, redirectUri: pc.redirectUri, sandbox: pc.sandbox };
    };
  }
}