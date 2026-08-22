import { Service, signal, inject } from '@angular/core';

import { LoggerService } from '@app/core/logging/logger/logger.service';
import { Notification } from '../../notifications.model';

@Service()
export class NotificationsStoreService {
  private readonly logger = inject(LoggerService);

  readonly unreadNotificationsCount = signal<number>(0);
  readonly notifications = signal<Notification[] | null>(null);
  readonly showPanel = signal<boolean>(false);

  addNotification(notification: Notification): void {
    this.notifications.update((notifications) => [...(notifications ?? []), notification]);
    this.logger.info('Notifications Store Service added notification: ', notification);
  }

  removeNotification(sentAt: number): void {
    if (!this.notifications()) return;
    const filteredNotifications = this.notifications()!.filter(
      (notification) => notification.sentAt !== sentAt,
    );
    this.notifications.set(filteredNotifications.length < 1 ? null : filteredNotifications);
    this.logger.info(`Notifications Store Service removed notification sent at: ${sentAt}`);
  }
}
