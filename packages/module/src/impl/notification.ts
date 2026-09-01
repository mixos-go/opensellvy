import type { ID, Notification, NotificationChannel, NotificationStatus } from '@opensellvy/types';
import type { ModuleDeps } from './deps';
import { buildIds } from './deps';

export interface NotificationModuleImpl {
  enqueue(input: Omit<Notification, 'id' | 'status' | 'createdAt'>): Promise<Notification>;
  markSent(id: string): Promise<Notification>;
  markFailed(id: string, error: string): Promise<Notification>;
  list(storeId: string, limit?: number): Promise<Notification[]>;
}

export function notificationModule(deps: ModuleDeps): NotificationModuleImpl {
  const { repos } = deps;
  const { id, now } = buildIds(deps);

  const require = async (notificationId: string) => {
    const found = await repos.notifications.findById(notificationId);
    if (!found) throw new Error(`Notification ${notificationId} not found`);
    return found;
  };

  return {
    async enqueue(input) {
      const notification: Notification = { ...input, id: id(), status: 'queued', createdAt: now() };
      await repos.notifications.save(notification);
      await deps.events?.emit('notification.queued', { id: notification.id, channel: notification.channel });
      return notification;
    },

    async markSent(notificationId) {
      return repos.notifications.save({ ...(await require(notificationId)), status: 'sent', sentAt: now() });
    },

    async markFailed(notificationId, error) {
      return repos.notifications.save({ ...(await require(notificationId)), status: 'failed', error });
    },

    async list(storeId, limit) {
      return repos.notifications.list(storeId, limit);
    },
  };
}

export type { NotificationChannel, NotificationStatus };