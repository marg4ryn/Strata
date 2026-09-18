import { inject, Service } from '@angular/core';

import { injectLogger } from '@app/core/logging';
import { StorageService } from '@app/core/storage';
import type { Notification } from '../../notifications.model';

@Service()
export class NotificationsStorageService {
  private readonly logger = injectLogger('NotificationsStorageService');
  private readonly storage = inject(StorageService);

  private readonly notificationsKey = 'notifications';
  private readonly unreadNotificationsCountKey = 'unreadNotificationsCount';

  getNotifications(): Notification[] | null {
    return this.storage.getItem<Notification[]>(sessionStorage, this.notificationsKey);
  }

  saveNotification(notification: Notification): void {
    const notifications = this.getNotifications() ?? [];
    const updatedNotifications = [...notifications, notification];
    this.storage.setItem(sessionStorage, this.notificationsKey, updatedNotifications);
    this.logger.debug('Notification saved', { sentAt: notification.sentAt });
  }

  removeNotification(sentAt: number): void {
    const notifications = this.getNotifications();
    if (!notifications) return;

    const filteredNotifications = notifications.filter(
      (notification) => notification.sentAt !== sentAt,
    );

    if (filteredNotifications.length < 1) {
      this.clearNotifications();
    } else {
      this.storage.setItem(sessionStorage, this.notificationsKey, filteredNotifications);
      this.logger.debug('Notification removed', { sentAt });
    }
  }

  clearNotifications(): void {
    this.storage.removeItem(sessionStorage, this.notificationsKey);
    this.logger.info('All notifications cleared');
  }

  getUnreadNotificationsCount(): number | null {
    return this.storage.getItem<number>(sessionStorage, this.unreadNotificationsCountKey);
  }

  saveUnreadNotificationsCount(count: number): void {
    this.storage.setItem<number>(sessionStorage, this.unreadNotificationsCountKey, count);
    this.logger.debug('Unread notifications count updated', { count });
  }

  clearUnreadNotificationsCount(): void {
    this.storage.removeItem(sessionStorage, this.unreadNotificationsCountKey);
  }
}
