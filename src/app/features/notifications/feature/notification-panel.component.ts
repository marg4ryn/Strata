import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';

import { NotificationsFacade } from '../notifications.facade';
import { NotificationItemComponent } from '../ui/notification-item.component';

@Component({
  selector: 'app-notification-panel',
  imports: [NotificationItemComponent, A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notification-panel.component.html',
  styleUrl: './notification-panel.component.scss',
})
export class NotificationPanelComponent {
  protected readonly facade = inject(NotificationsFacade);
}
