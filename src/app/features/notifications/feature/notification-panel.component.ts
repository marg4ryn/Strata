import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';

import { NotificationsFacade } from '../notifications.facade';
import { NotificationItem } from '../ui/notification-item.component';

@Component({
  selector: 'app-notification-panel',
  imports: [NotificationItem, A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notification-panel.component.html',
  styleUrl: './notification-panel.component.scss',
})
export class NotificationPanel {
  protected readonly facade = inject(NotificationsFacade);
}
