# Shopee Connector (`@opensellvy/platform-shopee`) — Referensi

> Adapter **rujukan** (reference implementation) untuk `PlatformPlugin` nyata.
> Pemetaan di bawah mengikuti **`docs/connectors/_UNIVERSAL.md`** (pattern + checklist
> universal per capability). Struktur & pola file = wajib ditiru platform lain.
>
> Fakta teknis terverifikasi sandbox: lihat **AGENTS.md §6**. Credentials live hanya
> via env (`live-gateway.ts`) — JANGAN di-commit.

## Capability yang dideklarasikan

```
order.pull, order.push, order.fulfill, order.tracking,
product.pull, product.push, inventory.sync,
promotion.sync, return.manage, webhook.receive,
payment.read, shipping.rate, category.read, media.manage,
finance.read, merchant.read, shop.settings
```

Semua domain gateway yang di-backing capability ini terimplementasi nyata
(diverifikasi `assertNoStubMethods` di `tests/conformance.spec.ts`).

## Pemetaan capability → endpoint Open Platform v2

| Capability | Method gateway | Endpoint Shopee |
|---|---|---|
| `order.pull` | `order.pull` | `order/get_order_list` + `order/get_order_detail` |
| `order.push` | `order.push` | *(no-op — pesanan selalu masuk via pull)* |
| `order.fulfill` | `fulfillment.ship` | `logistics/ship_order` |
| `order.fulfill` | `fulfillment.updateStatus` | `order/update_order_status` |
| `order.tracking` | `order.track` | `logistics/get_logistics_detail` |
| `product.pull` | `product.pull` | `product/get_item_list` + `product/get_item_base_info` |
| `product.push` | `product.push` | `product/add_item` |
| `product.update` | *(via `product.push`/api)* | `product/update_item` |
| `inventory.sync` | `inventory.sync` | `product/update_stock` |
| `inventory.sync` | `inventory.getStockLevels` | `product/get_item_list` + `product/get_model_list` |
| `inventory.sync` | `inventory.adjust` | `product/update_stock` |
| `promotion.sync` | `promotion.list` | `discount/get_discount_list` |
| `promotion.sync` | `promotion.get` | `discount/get_discount` |
| `promotion.sync` | `promotion.update` | `discount/update_discount` |
| `promotion.sync` | `promotion.setActive` | `discount/end_discount` (deactivate); auto-start |
| `promotion.sync` | `promotion.create` | passthrough (domain) |
| `return.manage` | `returns.list` | `returns/get_return_list` |
| `return.manage` | `returns.get` | `returns/get_return_detail` |
| `return.manage` | `returns.act` (approve/receive) | `returns/confirm` |
| `return.manage` | `returns.act` (reject/refund) | `returns/refund` |
| `return.manage` | `returns.act` (cancel) | `returns/cancel_dispute` |
| `payment.read` | `payment.list` | `payment/get_escrow_list` |
| `payment.read` | `payment.get` | `payment/get_escrow_detail` |
| `payment.read` | `payment.refund` | `payment/get_escrow_detail` (best-effort; Shopee tak punya seller-refund API) |
| `shipping.rate` | `shipping.getRates` | `logistics/get_logistics_channel_list` |
| `shipping.rate` | `shipping.listShipments` | `order/get_order_list` (package_list) |
| `shipping.rate` | `shipping.getShipment` | `logistics/get_tracking_info` |
| `category.read` | `product.listCategories` | `product/get_category` |
| `media.manage` | `media.upload` | `media/upload_image` (POST multipart) |
| `media.manage` | `media.list` | *(tidak ada endpoint list — return `[]`)* |
| `webhook.receive` | `PlatformPlugin.webhook` | HMAC verify + event map |
| `finance.read` | `finance.overview` | `payment/get_income_overview` |
| `finance.read` | `finance.transactions` | `payment/get_wallet_transaction_list` |
| `finance.read` | `finance.statement` | `payment/get_income_statement` / `get_income_report` |
| `finance.read` | `finance.payoutInfo` | `payment/get_payout_info` |
| `merchant.read` | `merchant.getProfile` | `merchant/get_merchant_info` |
| `merchant.read` | `merchant.listShops` | `merchant/get_shop_list_by_merchant` |
| `merchant.read` | `merchant.listWarehouses` | `merchant/get_merchant_warehouse_list` |
| `merchant.read` | `merchant.listWarehouseLocations` | `merchant/get_merchant_warehouse_location_list` |
| `shop.settings` | `shop.getSettings` | `shop/get_shop_info` + `shop/get_shop_holiday_mode` |
| `shop.settings` | `shop.setHolidayMode` | `shop/set_shop_holiday_mode` |
| `shop.settings` | `shop.listWarehouses` | `merchant/get_merchant_warehouse_list` |

## Catatan & batasan yang disengaja

- **`payment.refund`**: Shopee tidak mengekspos refund inisiasi-seller; method
  memverifikasi escrow via `get_escrow_detail` dan return void (bukan stub).
- **`promotion.setActive(true)`**: diskon Shopee auto-start saat `start_time`; tidak ada
  API start → no-op saat `active=true`, `end_discount` saat `active=false`.
- **`media.list`**: tidak ada endpoint list aset → return `[]` (bukan `NotImplementedError`).
- **`inventory.getStockLevels`**: SKU tak cocok → `{available:0,reserved:0,incoming:0,holding:0}`.
- **`returns.act('cancel')`**: `cancel_dispute` hanya utk kompensasi tertentu; retur umum
  tak punya cancel inisiasi-seller.

## Verification

- `tests/conformance.spec.ts` → `assertNoStubMethods` PASS (tidak ada stub utk capability terdeklarasi).
- Live verify: `SHOPEE_ACCESS_TOKEN=... SHOPEE_PARTNER_ID=1241483 SHOPEE_SHOP_ID=227844766 npx tsx live-gateway.ts`
  (env-only; token valid ±4 jam — cek `expire_time`).
