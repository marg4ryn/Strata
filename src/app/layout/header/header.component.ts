import { Component, inject, ViewChild, ElementRef } from '@angular/core';

import { NotificationsFacade } from '@app/features/notifications/notifications.facade';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class Header {
  @ViewChild('notifBtn', { read: ElementRef })
  notifBtn!: ElementRef<HTMLButtonElement>;

  readonly notifications = inject(NotificationsFacade);

  ngOnInit() {
    this.notifications.loadNotifications();
  }

  toggleNotificationsPanel(): void {
    if (this.notifications.showPanel()) {
      this.notifications.closePanel();
      this.notifBtn.nativeElement.focus();
    } else {
      this.notifications.openPanel();
    }
  }
}
