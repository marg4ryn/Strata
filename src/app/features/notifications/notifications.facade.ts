import { Service, inject, computed } from '@angular/core';

import { NotificationsService } from './data-access/service/notifications.service';
import { StoreService } from './data-access/store/store.service';

@Service()
export class NotificationsFacade {
  private readonly store = inject(StoreService);
  private readonly service = inject(NotificationsService);

  readonly notifications = computed(() => this.store.notifications());
  readonly showPanel = computed(() => this.store.showPanel());

  openPanel(): void {
    this.store.openPanel();
  }

  closePanel(): void {
    this.store.closePanel();
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
