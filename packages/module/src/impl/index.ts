import type { ModuleDeps } from './deps';
import { orderModule } from './order';
import type { OrderModuleImpl } from './order';
import { productModule } from './product';
import type { ProductModuleImpl } from './product';
import { inventoryModule } from './inventory';
import type { InventoryModuleImpl } from './inventory';
import { channelModule } from './channel';
import type { ChannelModuleImpl } from './channel';
import { customerModule } from './customer';
import type { CustomerModuleImpl } from './customer';
import { storeModule } from './store';
import type { StoreModuleImpl } from './store';
import { fulfillmentModule } from './fulfillment';
import type { FulfillmentModuleImpl } from './fulfillment';
import { returnModule } from './return';
import type { ReturnModuleImpl } from './return';
import { paymentModule } from './payment';
import type { PaymentModuleImpl } from './payment';
import { warehouseModule } from './warehouse';
import type { WarehouseModuleImpl } from './warehouse';
import { shippingModule } from './shipping';
import type { ShippingModuleImpl, CourierRateProvider } from './shipping';
import { promotionModule } from './promotion';
import type { PromotionModuleImpl } from './promotion';
import { financeModule } from './finance';
import type { FinanceModuleImpl } from './finance';
import { notificationModule } from './notification';
import type { NotificationModuleImpl } from './notification';
import { userModule } from './user';
import type { UserModuleImpl } from './user';
import { analyticsModule } from './analytics';
import type { AnalyticsModuleImpl } from './analytics';
import { auditModule } from './audit';
import type { AuditModuleImpl } from './audit';
import { catalogModule } from './catalog';
import type { CatalogModuleImpl } from './catalog';
import { createMemoryRepositories } from './memory';

export interface Services {
  orders: OrderModuleImpl;
  products: ProductModuleImpl;
  inventory: InventoryModuleImpl;
  channels: ChannelModuleImpl;
  customers: CustomerModuleImpl;
  stores: StoreModuleImpl;
  fulfillment: FulfillmentModuleImpl;
  returns: ReturnModuleImpl;
  payments: PaymentModuleImpl;
  warehouses: WarehouseModuleImpl;
  shipping: ShippingModuleImpl;
  promotions: PromotionModuleImpl;
  finance: FinanceModuleImpl;
  notifications: NotificationModuleImpl;
  users: UserModuleImpl;
  analytics: AnalyticsModuleImpl;
  audits: AuditModuleImpl;
  catalog: CatalogModuleImpl;
}

export interface CreateServicesOptions {
  deps: Omit<ModuleDeps, 'repos'>;
  /** default: in-memory repositories (tanpa DB) */
  repositories?: ModuleDeps['repos'];
  courierRates?: CourierRateProvider;
}

export function createServices(options: CreateServicesOptions): Services {
  const deps: ModuleDeps = { ...options.deps, repos: options.repositories ?? createMemoryRepositories() };

  const products = productModule(deps);
  const inventory = inventoryModule(deps);
  const orders = orderModule(deps);

  return {
    orders,
    products,
    inventory,
    channels: channelModule(deps),
    customers: customerModule(deps),
    stores: storeModule(deps),
    fulfillment: fulfillmentModule(deps),
    returns: returnModule(deps),
    payments: paymentModule(deps),
    warehouses: warehouseModule(deps),
    shipping: shippingModule(deps, options.courierRates),
    promotions: promotionModule(deps),
    finance: financeModule(deps),
    notifications: notificationModule(deps),
    users: userModule(deps),
    analytics: analyticsModule(deps),
    audits: auditModule(deps),
    catalog: catalogModule(deps, products, inventory),
  };
}

export * from './deps';
export * from './memory';

export type { OrderModuleImpl } from './order';
export type { ProductModuleImpl } from './product';
export type { InventoryModuleImpl } from './inventory';
export type { ChannelModuleImpl } from './channel';
export type { CustomerModuleImpl } from './customer';
export type { StoreModuleImpl } from './store';
export type { FulfillmentModuleImpl } from './fulfillment';
export type { ReturnModuleImpl } from './return';
export type { PaymentModuleImpl } from './payment';
export type { WarehouseModuleImpl } from './warehouse';
export type { ShippingModuleImpl, CourierRateProvider } from './shipping';
export type { PromotionModuleImpl } from './promotion';
export type { FinanceModuleImpl } from './finance';
export type { NotificationModuleImpl } from './notification';
export type { UserModuleImpl } from './user';
export type { AnalyticsModuleImpl } from './analytics';
export type { AuditModuleImpl } from './audit';
export type { CatalogModuleImpl } from './catalog';
export { createMemoryRepositories } from './memory';
export { MemoryRepositories } from './memory';