import { ChangeDetectionStrategy, Component, input, output, computed, inject } from '@angular/core';
import { TranslocoService, TranslocoPipe } from '@ngneat/transloco';
import { toSignal } from '@angular/core/rxjs-interop';

import { Notification } from '../notifications.model';

@Component({
  selector: 'app-notification-item',
  imports: [TranslocoPipe],
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
  private readonly transloco = inject(TranslocoService);

  readonly notification = input.required<Notification>();
  readonly remove = output<number>();

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  readonly params = computed(() => this.notification().params ?? {});
  readonly timestamp = computed(() =>
    new Date(this.notification().sentAt).toLocaleString(this.activeLang()),
  );
}
