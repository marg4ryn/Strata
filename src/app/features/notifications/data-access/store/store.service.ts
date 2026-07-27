import { Service, signal, inject } from '@angular/core';

import { LoggerService } from '@app/core/logging/logger.service';
import { Notification } from '../../notifications.model';

@Service()
export class StoreService {
  private readonly logger = inject(LoggerService);

  readonly notifications = signal<Notification[] | null>(null);
  readonly showPanel = signal<boolean>(false);

  openPanel(): void {
    this.showPanel.set(true);
    this.logger.debug('Notifications Store opened notifications panel');
  }

  closePanel(): void {
    this.showPanel.set(false);
    this.logger.debug('Notifications Store closed notifications panel');
  }

  addNotification(notification: Notification): void {
    this.notifications.update((notifications) => [...(notifications ?? []), notification]);
    this.logger.info('Notifications Store added notification: ', notification);
  }

  removeNotification(sentAt: number): void {
    if (!this.notifications()) return;
    const filteredNotifications = this.notifications()!.filter(
      (notification) => notification.sentAt !== sentAt,
    );
    this.notifications.set(filteredNotifications.length < 1 ? null : filteredNotifications);
    this.logger.info(`Notifications Store removed notification sent at: ${sentAt}`);
  }

  clearNotifications(): void {
    this.notifications.set(null);
    this.logger.info('Notifications Store removed all notifications');
  }
}
