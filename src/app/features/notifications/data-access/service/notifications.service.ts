import { inject, Service } from '@angular/core';

import { LoggerService } from '@app/core/logging/logger.service';
import { StoreService } from '../store/store.service';
import { StorageService } from '../storage/storage.service';
import { NotificationType, Notification } from '../../notifications.model';

@Service()
export class NotificationsService {
  private readonly logger = inject(LoggerService);
  private readonly store = inject(StoreService);
  private readonly storage = inject(StorageService);

  loadNotifications(): void {
    const notifications = this.storage.getNotifications();
    this.logger.info('Notifications Service loaded notifications: ', notifications);
    this.store.notifications.set(notifications);
  }

  removeNotification(sentAt: number): void {
    this.logger.debug(
      `Notifications Service received request to remove notification sent at: ${sentAt}`,
    );
    this.storage.removeNotification(sentAt);
    this.store.removeNotification(sentAt);
  }

  clearNotifications(): void {
    this.logger.debug('Notifications Service received request to remove all notifications');
    this.storage.clearNotifications();
    this.store.clearNotifications();
  }

  addNotificationSuccess(message: string): void {
    this.addNotification('success', message);
  }

  addNotificationInfo(message: string): void {
    this.addNotification('info', message);
  }

  addNotificationWarn(message: string): void {
    this.addNotification('warn', message);
  }

  addNotificationError(message: string): void {
    this.addNotification('error', message);
  }

  private addNotification(type: NotificationType, message: string): void {
    const notification = this.constructNotification(type, message);
    this.storage.saveNotification(notification);
    this.store.addNotification(notification);
  }

  private constructNotification(type: NotificationType, message: string): Notification {
    const sentAt = Date.now();
    const notification = { type, message, sentAt } as Notification;
    this.logger.info('Notifications Service created notification: ', notification);
    return notification;
  }
}
