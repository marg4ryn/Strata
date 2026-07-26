import { inject, Service } from '@angular/core';

import { Notification } from '../../notifications.model';
import { LoggerService } from '@app/core/logging/logger.service';

@Service()
export class StorageService {
  private readonly logger = inject(LoggerService);
  private readonly notificationsKey = 'notifications';

  getNotifications(): Notification[] | null {
    let raw: string | null;
    try {
      raw = sessionStorage.getItem(this.notificationsKey);
    } catch (error) {
      this.logger.error(
        'Notifications Storage failed to read notifications from sessionStorage',
        error,
      );
      return null;
    }

    if (!raw) return null;

    try {
      const notifications = JSON.parse(raw) as Notification[];
      this.logger.debug(
        'Notifications Storage returned notifications from sessionStorage',
        notifications,
      );
      return notifications;
    } catch (error) {
      this.logger.error(
        'Notifications Storage failed to parse notifications JSON, clearing corrupted data',
        error,
      );
      this.clearNotifications();
      return null;
    }
  }

  saveNotification(notification: Notification): void {
    const notifications = this.getNotifications() ?? [];
    const updatedNotifications = [...notifications, notification];

    try {
      sessionStorage.setItem(this.notificationsKey, JSON.stringify(updatedNotifications));
      this.logger.info('Notifications Storage saved notification to sessionStorage');
    } catch (error) {
      this.logger.error(
        `Notifications Storage failed to save notification to sessionStorage`,
        error,
      );
    }
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
      try {
        sessionStorage.setItem(this.notificationsKey, JSON.stringify(filteredNotifications));
        this.logger.info('Notifications Storage removed notification from sessionStorage');
      } catch (error) {
        this.logger.error(
          'Notifications Storage failed to remove notification from sessionStorage',
          error,
        );
      }
    }
  }

  clearNotifications(): void {
    try {
      sessionStorage.removeItem(this.notificationsKey);
      this.logger.info('Notifications Storage removed notifications from sessionStorage');
    } catch (error) {
      this.logger.error(
        'Notifications Storage failed to remove notifications from sessionStorage',
        error,
      );
    }
  }
}
