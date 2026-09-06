# OpenSellvy

Omnichannel OMS platform untuk ecommerce Indonesia (Shopee, TikTok Shop/Tokopedia, Lazada, Blibli) — monorepo berbasis plugin.

## Architecture

```
packages/
  types/               @opensellvy/types        shared types
  core/                @opensellvy/core         auth, RBAC, crypto, logger, event, cache, queue
  db/                  @opensellvy/db           PostgreSQL schema + migrations
  connector/           @opensellvy/connector    platform plugin CONTRACT + registry (single gate)
  module/              @opensellvy/module       18 domain modules (business logic)
  api/                 @opensellvy/api          GraphQL + REST (webhook/oauth)
  ui/                  @opensellvy/ui           React components
  sdk/                 @opensellvy/sdk           umbrella SDK entry (types+core+connector+module+api+db+db-pg)
  platform-shopee/     @opensellvy/platform-shopee           plugin
  platform-tts-tokopedia/ @opensellvy/platform-tts-tokopedia plugin
  platform-lazada/     @opensellvy/platform-lazada           plugin
  platform-blibli/     @opensellvy/platform-blibli           plugin
```

## Key principle: single gate

Semua platform (payload berbeda-beda) melewati **satu gate** module layer. Module tidak pernah
`import` connector spesifik platform — hanya lewat `@opensellvy/connector` registry (polymorphism,
tanpa hardcode per-platform). Tambah platform baru = daftarkan plugin, module/API otomatis dapat.

```
request → module → registry.get(platform) → plugin.gateway → Unified types
```

Dependency rule (tidak boleh dilanggar): core/module TIDAK import `@opensellvy/platform-*`.

## Usage

```typescript
import { OpenSellvy } from '@opensellvy/sdk';
import { registerShopee } from '@opensellvy/platform-shopee';
import { registerTokopedia } from '@opensellvy/platform-tts-tokopedia';

registerShopee();
registerTokopedia();

const oms = new OpenSellvy({ apiKey: '...' });
const orders = await oms.modules.order.list({ storeId: 'store_123' });
```

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

## Disclaimer

Semua connector dibangun dari dokumentasi API resmi (clean-room HTTP implementation). Tidak
mendistribusikan SDK official milik platform.

## License

[MIT](./LICENSE)