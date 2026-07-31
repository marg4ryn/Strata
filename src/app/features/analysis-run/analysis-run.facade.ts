import { inject, Service, computed } from '@angular/core';

import { AnalysisRunStoreService } from './data-access/store/analysis-run-store.service';
import { AnalysisRunService } from './data-access/service/analysis-run.service';
import { AnalysisTargetFormModel } from './analysis-run.model';

@Service()
export class AnalysisRunFacade {
  private readonly store = inject(AnalysisRunStoreService);
  private readonly service = inject(AnalysisRunService);

  readonly showModal = computed(() => this.store.showModal());
  readonly isBusy = computed(() => this.store.isBusy());
  readonly isAborting = computed(() => this.store.isAborting());
  readonly progress = computed(() => this.store.progress());
  readonly error = computed(() => this.store.error());
  readonly errorType = computed(() => this.store.errorType());
  readonly pendingAnalysis = computed(() => this.store.pendingAnalysis());

  startNewAnalysis(formData: AnalysisTargetFormModel): void {
    void this.service.startNewAnalysis(formData);
  }

  // an attempt to resume an unfinished analysis
  tryToReconnect(): void {
    void this.service.tryToReconnect();
  }

  // actually taking up an unfinished analysis
  resumeAnalysis(): void {
    this.service.resumeAnalysis();
  }

  // an attempt to resume analysis after an error
  retryAnalysis(): void {
    this.service.retryAnalysis();
  }

  // cancelling the analysis after an error
  cancelAnalysis(): void {
    void this.service.cancelAnalysis();
  }

  // cancelling a previously unfinished analysis
  abandonAnalysis(): void {
    void this.service.abandonAnalysis();
  }

  // cancelling an ongoing analysis
  abortAnalysis(): void {
    void this.service.abortAnalysis();
  }
}
