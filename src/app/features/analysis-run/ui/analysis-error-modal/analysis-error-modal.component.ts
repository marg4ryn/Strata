import { Component, input, output } from '@angular/core';
import { PendingAnalysis } from '../../data-access/analysis-run.model';
import { ButtonDirective } from '@app/shared/button-directive/button.directive';
import { InfoPanel } from '../../shared/info-panel/info-panel.component';

@Component({
  selector: 'app-analysis-error-modal',
  imports: [ButtonDirective, InfoPanel],
  templateUrl: './analysis-error-modal.component.html',
  styleUrl: './analysis-error-modal.component.scss',
})
export class AnalysisErrorModal {
  pendingAnalysis = input.required<PendingAnalysis | null>();
  error = input.required<string | null>();

  retry = output<void>();
  cancel = output<void>();

  retryAnalysis(): void {
    this.retry.emit();
  }

  cancelAnalysis(): void {
    this.cancel.emit();
  }
}
