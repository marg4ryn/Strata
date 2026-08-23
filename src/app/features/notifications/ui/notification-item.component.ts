import { ChangeDetectionStrategy, Component, input, output, computed } from '@angular/core';

import { Notification } from '../notifications.model';

@Component({
  selector: 'app-notification-item',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'notification-item',
    '[class.notification-item--success]': "notification().type === 'success'",
    '[class.notification-item--info]': "notification().type === 'info'",
    '[class.notification-item--error]': "notification().type === 'error'",
    '[class.notification-item--warning]': "notification().type === 'warning'",
  },
  templateUrl: './notification-item.component.html',
  styleUrl: './notification-item.component.scss',
})
export class NotificationItemComponent {
  readonly notification = input.required<Notification>();
  readonly remove = output<number>();
  readonly timestamp = computed(() => new Date(this.notification().sentAt).toLocaleString());
}
