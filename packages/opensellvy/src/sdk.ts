import type { OpenSellvyConfig } from './config';
import type { Modules } from '@opensellvy/module';
import type { ConnectorRegistry } from '@opensellvy/connector';

export class OpenSellvy {
  constructor(private readonly config: OpenSellvyConfig) {}

  get modules(): Modules {
    throw new Error('OpenSellvy.modules not implemented');
  }

  get connectors(): ConnectorRegistry {
    throw new Error('OpenSellvy.connectors not implemented');
  }
}
