import { Service, inject, untracked } from '@angular/core';

import { LoggerService } from '@app/core/logging/logger.service';
import { NotificationsStoreService } from '../notifications-store/notifications-store.service';
import { NotificationsStorageService } from '../notifications-storage/notifications-storage.service';
import { NotificationType, Notification } from '../../notifications.model';

@Service()
export class NotificationsService {
  private readonly logger = inject(LoggerService);
  private readonly store = inject(NotificationsStoreService);
  private readonly storage = inject(NotificationsStorageService);

  loadNotifications(): void {
    this.logger.debug('Notifications Service is loading notifications');
    const notifications = this.storage.getNotifications();
    this.store.notifications.set(notifications);

    const unreadNotificationsCount = this.storage.getUnreadNotificationsCount();
    this.store.unreadNotificationsCount.set(unreadNotificationsCount ?? 0);
  }

  openPanel(): void {
    this.logger.debug('Notifications Service opened notifications panel');
    this.store.showPanel.set(true);

    if (this.store.unreadNotificationsCount() > 0) {
      this.store.unreadNotificationsCount.set(0);
      this.storage.clearUnreadNotificationsCount();
    }
  }

  closePanel(): void {
    this.logger.debug('Notifications Service closed notifications panel');
    this.store.showPanel.set(false);
  }

  removeNotification(sentAt: number): void {
    this.logger.debug(
      `Notifications Service received a request to remove notification sent at: ${sentAt}`,
    );
    this.storage.removeNotification(sentAt);
    this.store.removeNotification(sentAt);
  }

  clearNotifications(): void {
    this.logger.debug('Notifications Service received a request to remove all notifications');
    this.storage.clearNotifications();
    this.store.notifications.set(null);
  }

  addNotificationSuccess(messageKey: string, params?: Record<string, unknown>): void {
    this.addNotification('success', messageKey, params);
  }

  addNotificationInfo(messageKey: string, params?: Record<string, unknown>): void {
    this.addNotification('info', messageKey, params);
  }

  addNotificationWarning(messageKey: string, params?: Record<string, unknown>): void {
    this.addNotification('warning', messageKey, params);
  }

  addNotificationError(messageKey: string, params?: Record<string, unknown>): void {
    this.addNotification('error', messageKey, params);
  }

  private addNotification(
    type: NotificationType,
    messageKey: string,
    params?: Record<string, unknown>,
  ): void {
    const notification = this.constructNotification(type, messageKey, params);
    this.storage.saveNotification(notification);
    this.store.addNotification(notification);

    if (!this.store.showPanel()) {
      const unreadNotificationsCount = untracked(() => this.store.unreadNotificationsCount()) + 1;
      this.store.unreadNotificationsCount.set(unreadNotificationsCount);
      this.storage.saveUnreadNotificationsCount(unreadNotificationsCount);
      this.logger.debug(
        `Notifications Service increased unread notifications count to: ${unreadNotificationsCount}`,
      );
    }
  }

  private constructNotification(
    type: NotificationType,
    messageKey: string,
    params?: Record<string, unknown>,
  ): Notification {
    const sentAt = Date.now();
    const notification = { type, messageKey, sentAt, params } as Notification;
    this.logger.info('Notifications Service created notification: ', notification);
    return notification;
  }
}
