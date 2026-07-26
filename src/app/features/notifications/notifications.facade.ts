import { Service, inject, computed } from '@angular/core';

import { NotificationsService } from './data-access/service/notifications.service';
import { StoreService } from './data-access/store/store.service';

@Service()
export class NotificationsFacade {
  private readonly store = inject(StoreService);
  private readonly service = inject(NotificationsService);

  readonly notifications = computed(() => this.store.notifications());

  sendNotificationSuccess(message: string): void {
    this.service.addNotificationSuccess(message);
  }

  sendNotificationInfo(message: string): void {
    this.service.addNotificationInfo(message);
  }

  sendNotificationWarn(message: string): void {
    this.service.addNotificationWarn(message);
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
