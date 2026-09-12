import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { TranslocoPipe } from '@jsverse/transloco';

import { ButtonDirective } from '@app/shared/directives/button.directive';
import { ModalType } from '../service/confirm-operation.service';

@Component({
  selector: 'app-confirm-operation-modal',
  imports: [ButtonDirective, A11yModule, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-operation.component.html',
  styleUrl: './confirm-operation.component.scss',
})
export class ConfirmOperationComponent {
  readonly labelKey = input<string>('confirmations.default');
  readonly params = input<Record<string, unknown>>({});
  readonly type = input<ModalType>('danger');

  readonly cancel = output<void>();
  readonly confirm = output<void>();

  onCancel(): void {
    this.cancel.emit();
  }

  onConfirm(): void {
    this.confirm.emit();
  }
}
