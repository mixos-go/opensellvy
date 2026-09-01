# opensellvy

Omnichannel OMS SDK untuk platform ecommerce Indonesia (Shopee, TikTok Shop/Tokopedia, Lazada, Blibli).

## Installation

```bash
npm install opensellvy
```

## Usage

### SDK Mode

```typescript
import { OpenSellvy, configure } from 'opensellvy';

const oms = new OpenSellvy({ apiKey: '...' });
const orders = await oms.orders.list({ storeId: 'store_123' });
```

### API Mode

```typescript
import { createServer } from 'opensellvy/api';

const server = createServer({ port: 4000 });
await server.start();
```

### Connector Mode

```typescript
import { registerPlatform } from 'opensellvy/connectors';
import { ShopeeConnector } from 'opensellvy/connectors';

registerPlatform('shopee', ShopeeConnector);
```

## Structure

- `src/core` - Auth, RBAC, crypto, logger, event, cache, queue
- `src/db` - Database schema & SQL migrations (PostgreSQL via Drizzle)
- `src/connector` - Platform connectors (Shopee, TTS/Tokopedia, Lazada, Blibli) + OAuth
- `src/module` - 18 business domain modules
- `src/api` - GraphQL (main API) + REST (webhooks/oauth callbacks)
- `src/ui` - Optional React components

## Supported Platforms

| Platform | Status |
|---|---|
| Shopee | Planned |
| TikTok Shop / Tokopedia | Planned |
| Lazada | Planned |
| Blibli | Planned |

## Disclaimer

`opensellvy` dibangun dari documentation API resmi masing-masing platform dan tidak
mempublikasikan atau mendistribusikan SDK resmi milik platform. Seluruh kode connector
adalah implementasi mandiri (clean-room) berbasis HTTP.

## License

[MIT](./LICENSE)
