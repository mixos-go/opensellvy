import type {
  UnifiedOrder,
  OrderFilter,
  UnifiedProduct,
  InventoryItem,
  StockMovement,
  UnifiedCustomer,
  CustomerFilter,
  ChannelConnection,
  Store,
  Warehouse,
  ReturnRequest,
  Payment,
  Settlement,
  Promotion,
  Shipment,
  Notification,
  AuditLog,
  User,
  StoreMember,
  SalesSummary,
  AnalyticsFilter,
  Paginated,
} from '@opensellvy/types';

export interface OrderRepository {
  save(order: UnifiedOrder): Promise<void>;
  merge(order: UnifiedOrder): Promise<UnifiedOrder>;
  update(id: string, patch: Partial<UnifiedOrder>): Promise<UnifiedOrder>;
  find(filter: OrderFilter): Promise<Paginated<UnifiedOrder>>;
  findById(id: string): Promise<UnifiedOrder | undefined>;
  findByChannelKey(platform: string, platformOrderId: string): Promise<UnifiedOrder | undefined>;
  countByStore(storeId: string, from?: string, to?: string): Promise<number>;
}

export interface ProductRepository {
  save(product: UnifiedProduct): Promise<UnifiedProduct>;
  update(id: string, patch: Partial<UnifiedProduct>): Promise<UnifiedProduct>;
  findById(id: string): Promise<UnifiedProduct | undefined>;
  findBySku(sku: string): Promise<UnifiedProduct | undefined>;
  list(storeId: string, opts?: { categoryId?: string; query?: string; cursor?: string; limit?: number }): Promise<Paginated<UnifiedProduct>>;
  delete(id: string): Promise<void>;
}

export interface InventoryRepository {
  upsert(item: InventoryItem): Promise<InventoryItem>;
  findBySku(sku: string, warehouseId?: string): Promise<InventoryItem[]>;
  list(storeId: string): Promise<InventoryItem[]>;
  addMovement(movement: StockMovement): Promise<void>;
  listMovements(sku: string, limit?: number): Promise<StockMovement[]>;
}

export interface CustomerRepository {
  save(customer: UnifiedCustomer): Promise<UnifiedCustomer>;
  findById(id: string): Promise<UnifiedCustomer | undefined>;
  findByPlatformProfile(platform: string, platformUserId: string): Promise<UnifiedCustomer | undefined>;
  find(filter: CustomerFilter): Promise<Paginated<UnifiedCustomer>>;
}

export interface ChannelRepository {
  save(channel: ChannelConnection): Promise<ChannelConnection>;
  findById(id: string): Promise<ChannelConnection | undefined>;
  findByStore(storeId: string): Promise<ChannelConnection[]>;
  findByShop(platform: string, platformShopId: string): Promise<ChannelConnection | undefined>;
  delete(id: string): Promise<void>;
}

export interface StoreRepository {
  save(store: Store): Promise<Store>;
  findById(id: string): Promise<Store | undefined>;
  findBySlug(slug: string): Promise<Store | undefined>;
  list(): Promise<Store[]>;
  delete(id: string): Promise<void>;
}

export interface UserRepository {
  save(user: User): Promise<User>;
  findById(id: string): Promise<User | undefined>;
  findByEmail(email: string): Promise<User | undefined>;
}

export interface MemberRepository {
  add(member: StoreMember): Promise<void>;
  update(storeId: string, userId: string, patch: Partial<StoreMember>): Promise<StoreMember>;
  findByStore(storeId: string): Promise<StoreMember[]>;
  /** semua toko tempat seorang user menjadi anggota (dengan role per toko). */
  findByUser(userId: string): Promise<StoreMember[]>;
  find(storeId: string, userId: string): Promise<StoreMember | undefined>;
}

export interface WarehouseRepository {
  save(warehouse: Warehouse): Promise<Warehouse>;
  findById(id: string): Promise<Warehouse | undefined>;
  list(storeId: string): Promise<Warehouse[]>;
  delete(id: string): Promise<void>;
}

export interface ReturnRepository {
  save(request: ReturnRequest): Promise<ReturnRequest>;
  findById(id: string): Promise<ReturnRequest | undefined>;
  findByOrder(orderId: string): Promise<ReturnRequest[]>;
}

export interface PaymentRepository {
  save(payment: Payment): Promise<Payment>;
  findByOrder(orderId: string): Promise<Payment[]>;
}

export interface ShipmentRepository {
  save(shipment: Shipment): Promise<Shipment>;
  findByTracking(trackingNumber: string): Promise<Shipment | undefined>;
  findByOrder(orderId: string): Promise<Shipment[]>;
}

export interface SettlementRepository {
  save(settlement: Settlement): Promise<Settlement>;
  list(storeId: string, opts?: { from?: string; to?: string }): Promise<Settlement[]>;
}

export interface PromotionRepository {
  save(promotion: Promotion): Promise<Promotion>;
  findByCode(storeId: string, code: string): Promise<Promotion | undefined>;
  list(storeId: string): Promise<Promotion[]>;
}

export interface NotificationRepository {
  save(notification: Notification): Promise<Notification>;
  findById(id: string): Promise<Notification | undefined>;
  list(storeId: string, limit?: number): Promise<Notification[]>;
}

export interface AuditRepository {
  save(log: AuditLog): Promise<AuditLog>;
  list(filter: { storeId?: string; actorId?: string; action?: string }): Promise<AuditLog[]>;
}

export interface AnalyticsRepository {
  getSalesSummary(storeId: string, from: string, to: string): Promise<SalesSummary>;
}

export interface Repositories {
  orders: OrderRepository;
  products: ProductRepository;
  inventory: InventoryRepository;
  customers: CustomerRepository;
  channels: ChannelRepository;
  stores: StoreRepository;
  users: UserRepository;
  members: MemberRepository;
  warehouses: WarehouseRepository;
  returns: ReturnRepository;
  payments: PaymentRepository;
  shipments: ShipmentRepository;
  settlements: SettlementRepository;
  promotions: PromotionRepository;
  notifications: NotificationRepository;
  audits: AuditRepository;
  analytics: AnalyticsRepository;
}

export type { AnalyticsFilter };