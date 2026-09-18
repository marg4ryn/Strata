import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { TranslocoPipe } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';

import { ButtonDirective } from '@app/shared/directives';
import type { ModalType } from '../services/confirm-operation.service';

@Component({
  selector: 'app-confirm-operation-modal',
  imports: [ButtonDirective, A11yModule, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-operation.component.html',
  styleUrl: './confirm-operation.component.scss',
})
export class ConfirmOperationComponent {
  readonly labelKey = input<string>(marker('confirmations.default'));
  readonly params = input<Record<string, unknown>>({});
  readonly type = input<ModalType>('danger');

  readonly dismissEvent = output<void>();
  readonly confirmEvent = output<void>();

  onCancel(): void {
    this.dismissEvent.emit();
  }

  onConfirm(): void {
    this.confirmEvent.emit();
  }
}
