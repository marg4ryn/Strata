import { Service, inject, computed } from '@angular/core';

import { NotificationsService } from './data-access/notifications/notifications.service';
import { NotificationsStoreService } from './data-access/notifications-store/notifications-store.service';

@Service()
export class NotificationsFacade {
  private readonly store = inject(NotificationsStoreService);
  private readonly service = inject(NotificationsService);

  readonly unreadNotificationsCount = computed(() => this.store.unreadNotificationsCount());
  readonly notifications = computed(() => this.store.notifications());
  readonly showPanel = computed(() => this.store.showPanel());

  openPanel(): void {
    this.service.openPanel();
  }

  closePanel(): void {
    this.service.closePanel();
  }

  sendNotificationSuccess(message: string): void {
    this.service.addNotificationSuccess(message);
  }

  sendNotificationInfo(message: string): void {
    this.service.addNotificationInfo(message);
  }

  sendNotificationWarning(message: string): void {
    this.service.addNotificationWarning(message);
  }

  sendNotificationError(message: string): void {
    this.service.addNotificationError(message);
  }

  loadNotifications(): void {
    this.service.loadNotifications();
  }

  removeNotification(sentAt: number): void {
    this.service.removeNotification(sentAt);
  }

  clearNotifications(): void {
    this.service.clearNotifications();
  }
}
