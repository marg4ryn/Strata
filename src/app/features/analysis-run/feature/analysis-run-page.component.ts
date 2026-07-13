import { Component, inject, computed, debounced } from '@angular/core';
import { AnalysisTargetForm } from '../ui/analysis-target-form/analysis-target-form.component';
import { AnalysisProgressSpinner } from '../ui/analysis-progress-spinner/analysis-progress-spinner';
import { AnalysisStatus, AnalysisTargetFormModel } from '../data-access/analysis-run.model';
import { AnalysisRunFacade } from '../data-access/facade/analysis-run.facade';

@Component({
  selector: 'app-analysis-run-page',
  imports: [AnalysisTargetForm, AnalysisProgressSpinner],
  templateUrl: './analysis-run-page.component.html',
  styleUrl: './analysis-run-page.component.scss',
})
export class AnalysisRunPage {
  private readonly facade = inject(AnalysisRunFacade);

  showModal = this.facade.showModal;
  isBusy = this.facade.isBusy;
  progress = this.facade.progress;
  error = this.facade.error;

  label = debounced(
    computed(() => {
      const progress = this.progress();
      return progress ? `${AnalysisStatus[progress]}...` : 'Connecting...';
    }),
    800,
  );

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
