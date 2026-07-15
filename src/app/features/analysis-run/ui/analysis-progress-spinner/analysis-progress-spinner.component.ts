import { Component, input, output } from '@angular/core';
import { PendingAnalysis } from '../../data-access/analysis-run.model';
import { ButtonDirective } from '@app/shared/button-directive/button.directive';
import { ConfirmOperationModal } from '@app/shared/confirm-operation-modal/confirm-operation-modal.component';
import { InfoPanel } from '../../shared/info-panel/info-panel.component';

@Component({
  selector: 'app-analysis-progress-spinner',
  imports: [ButtonDirective, ConfirmOperationModal, InfoPanel],
  templateUrl: './analysis-progress-spinner.component.html',
  styleUrl: './analysis-progress-spinner.component.scss',
})
export class AnalysisProgressSpinner {
  pendingAnalysis = input.required<PendingAnalysis | null>();
  label = input<string>('');

  abort = output<void>();

  showModal: boolean = false;

  onCancel(): void {
    this.showModal = false;
  }

  onConfirm(): void {
    this.showModal = false;
    this.abort.emit();
  }

  abortAnalysis(): void {
    this.showModal = true;
  }
}
