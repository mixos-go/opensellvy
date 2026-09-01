import type { ID, ISO8601 } from '../base';

export type NotificationChannel = 'email' | 'whatsapp' | 'sms' | 'push';

export type NotificationStatus = 'queued' | 'sent' | 'failed';

export interface Notification {
  id: ID;
  storeId: ID;
  recipientId?: ID; // user atau customer
  channel: NotificationChannel;
  template: string;
  data: Record<string, unknown>;
  status: NotificationStatus;
  error?: string;
  sentAt?: ISO8601;
  createdAt: ISO8601;
}