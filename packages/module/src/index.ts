export * as product from './product';
export * as catalog from './catalog';
export * as inventory from './inventory';
export * as order from './order';
export * as fulfillment from './fulfillment';
export * as shipping from './shipping';
export * as payment from './payment';
export * as customer from './customer';
export * as returns from './return';
export * as warehouse from './warehouse';
export * as finance from './finance';
export * as promotion from './promotion';
export * as notification from './notification';
export * as analytics from './analytics';
export * as user from './user';
export * as store from './store';
export * as channel from './channel';
export * as audit from './audit';

export interface Modules {
  product: import('./product').ProductModule;
  inventory: import('./inventory').InventoryModule;
  order: import('./order').OrderModule;
  customer: import('./customer').CustomerModule;
  fulfillment: import('./fulfillment').FulfillmentModule;
  analytics: import('./analytics').AnalyticsModule;
}
