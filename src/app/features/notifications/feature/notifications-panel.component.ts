import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';

import { NotificationsFacade } from '../notifications.facade';
import { NotificationItem } from '../ui/notification-item.component';

@Component({
  selector: 'app-notifications-panel',
  imports: [NotificationItem, A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notifications-panel.component.html',
  styleUrl: './notifications-panel.component.scss',
})
export class NotificationsPanel {
  protected readonly facade = inject(NotificationsFacade);
}
