import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { TranslocoPipe } from '@ngneat/transloco';

import { ButtonDirective } from '@app/shared/button-directive/button.directive';
import { ModalType } from '../service/confirm-operation-modal.service';

@Component({
  selector: 'app-confirm-operation-modal',
  imports: [ButtonDirective, A11yModule, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-operation-modal.component.html',
  styleUrl: './confirm-operation-modal.component.scss',
})
export class ConfirmOperationModalComponent {
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
