import { inject, Service } from '@angular/core';

import { LoggerService } from '@app/core/logging/logger.service';
import { StorageService } from '@app/core/storage/storage.service';
import { Notification } from '../../notifications.model';

@Service()
export class NotificationsStorageService {
  private readonly logger = inject(LoggerService);
  private readonly storage = inject(StorageService);

  private readonly notificationsKey = 'notifications';
  private readonly unreadNotificationsCountKey = 'unreadNotificationsCount';

  getNotifications(): Notification[] | null {
    const notifications = this.storage.getItem<Notification[]>(
      sessionStorage,
      this.notificationsKey,
    );
    this.logger.debug(
      'Notifications Storage Service returned notifications from sessionStorage',
      notifications,
    );
    return notifications;
  }

  saveNotification(notification: Notification): void {
    const notifications = this.getNotifications() ?? [];
    const updatedNotifications = [...notifications, notification];
    this.storage.setItem(sessionStorage, this.notificationsKey, updatedNotifications);
    this.logger.info('Notifications Storage Service saved notification to sessionStorage');
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
      this.logger.info('Notifications Storage Service removed notification from sessionStorage');
    }
  }

  clearNotifications(): void {
    this.storage.removeItem(sessionStorage, this.notificationsKey);
    this.logger.info('Notifications Storage Service removed notifications from sessionStorage');
  }

  getUnreadNotificationsCount(): number | null {
    const unreadNotificationsCount = this.storage.getItem<number>(
      sessionStorage,
      this.unreadNotificationsCountKey,
    );
    this.logger.debug(
      'Notifications Storage Service returned unread notifications count from sessionStorage',
      unreadNotificationsCount,
    );
    return unreadNotificationsCount;
  }

  saveUnreadNotificationsCount(count: number): void {
    this.storage.setItem<number>(sessionStorage, this.unreadNotificationsCountKey, count);
    this.logger.info(
      'Notifications Storage Service saved unread notifications count to sessionStorage',
    );
  }

  clearUnreadNotificationsCount(): void {
    this.storage.removeItem(sessionStorage, this.unreadNotificationsCountKey);
    this.logger.info(
      'Notifications Storage Service removed unread notifications count from sessionStorage',
    );
  }
}
