import { Component, inject, computed, debounced } from '@angular/core';
import { AnalysisTargetForm } from '../ui/analysis-target-form/analysis-target-form.component';
import { AnalysisProgressSpinner } from '../ui/analysis-progress-spinner/analysis-progress-spinner.component';
import { AnalysisErrorModal } from '../ui/analysis-error-modal/analysis-error-modal.component';
import { AnalysisUnfinishedModal } from '../ui/analysis-unfinished-modal/analysis-unfinished-modal.component';
import { AnalysisStatus, AnalysisTargetFormModel } from '../analysis-run.model';
import { AnalysisRunFacade } from '../analysis-run.facade';

@Component({
  selector: 'app-analysis-run-page',
  imports: [
    AnalysisTargetForm,
    AnalysisProgressSpinner,
    AnalysisErrorModal,
    AnalysisUnfinishedModal,
  ],
  templateUrl: './analysis-run-page.component.html',
  styleUrl: './analysis-run-page.component.scss',
})
export class AnalysisRunPage {
  private readonly facade = inject(AnalysisRunFacade);

  readonly pendingAnalysis = this.facade.pendingAnalysis;
  readonly progress = this.facade.progress;
  readonly error = this.facade.error;
  readonly isBusy = this.facade.isBusy;
  readonly showModal = this.facade.showModal;

  readonly label = computed(() => {
    const progress = this.progress();
    return progress ? `${AnalysisStatus[progress]}...` : 'Connecting...';
  });

  readonly debouncedLabel = debounced(this.label, 800);

  ngOnInit() {
    this.facade.tryToReconnect();
  }

  startNewAnalysis(formData: AnalysisTargetFormModel): void {
    this.facade.startNewAnalysis(formData);
  }

  abortAnalysis(): void {
    this.facade.abortAnalysis();
  }

  resumeAnalysis(): void {
    this.facade.resumeAnalysis();
  }

  retryAnalysis(): void {
    this.facade.retryAnalysis();
  }

  cancelAnalysis(): void {
    this.facade.cancelAnalysis();
  }

  abandonAnalysis(): void {
    this.facade.abandonAnalysis();
  }
}
