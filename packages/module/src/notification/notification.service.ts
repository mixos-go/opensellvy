export interface NotificationModule {
  send(userId: string, channel: 'email' | 'whatsapp' | 'sms' | 'push', template: string, data: unknown): Promise<void>;
  sendBulk(userIds: string[], channel: string, template: string, data: unknown): Promise<void>;
  getHistory(userId: string, limit?: number): Promise<unknown[]>;
}