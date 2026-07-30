import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';

import { ButtonDirective } from '@app/shared/button-directive/button.directive';
import { ModalType } from '../service/confirm-operation-modal.service';

@Component({
  selector: 'app-confirm-operation-modal',
  imports: [ButtonDirective, A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-operation-modal.component.html',
  styleUrl: './confirm-operation-modal.component.scss',
})
export class ConfirmOperationModal {
  readonly label = input<string>('This operation cannot be undone. Are you sure?');
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
