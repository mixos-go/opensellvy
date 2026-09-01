export interface UserModule {
  create(data: unknown): Promise<unknown>;
  update(id: string, patch: unknown): Promise<unknown>;
  getUser(id: string): Promise<unknown>;
  listUsers(storeId: string): Promise<unknown[]>;
  assignRole(userId: string, role: string): Promise<void>;
}