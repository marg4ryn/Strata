import { Service, signal } from '@angular/core';

import { injectLogger } from '@app/core/logging';
import type { Notification } from '../../notifications.model';

@Service()
export class NotificationsStoreService {
  private readonly logger = injectLogger('NotificationsStoreService');

  readonly unreadNotificationsCount = signal<number>(0);
  readonly notifications = signal<Notification[] | null>(null);
  readonly showPanel = signal<boolean>(false);

  addNotification(notification: Notification): void {
    this.notifications.update((notifications) => [...(notifications ?? []), notification]);
    this.logger.info('Notification added', { sentAt: notification.sentAt });
  }

  removeNotification(sentAt: number): void {
    const currentNotifications = this.notifications();
    if (!currentNotifications) return;

    const filtered = currentNotifications.filter((n) => n.sentAt !== sentAt);
    this.notifications.set(filtered.length < 1 ? null : filtered);
    this.logger.info('Notification removed', { sentAt });
  }
}
