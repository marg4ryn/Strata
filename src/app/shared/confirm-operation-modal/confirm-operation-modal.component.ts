import { Component, input, output } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { ButtonDirective } from '../button-directive/button.directive';

@Component({
  selector: 'app-confirm-operation-modal',
  imports: [ButtonDirective, A11yModule],
  templateUrl: './confirm-operation-modal.component.html',
  styleUrl: './confirm-operation-modal.component.scss',
})
export class ConfirmOperationModal {
  readonly label = input<string>('This operation cannot be undone. Are you sure?');

  readonly cancel = output<void>();
  readonly confirm = output<void>();

  onCancel(): void {
    this.cancel.emit();
  }

  onConfirm(): void {
    this.confirm.emit();
  }
}
