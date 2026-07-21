import { inject, Service, computed } from '@angular/core';
import { StoreService } from './data-access/store/store.service';
import { OrchestratorService } from './data-access/orchestrator/orchestrator.service';
import { AnalysisTargetFormModel } from './analysis-run.model';

@Service()
export class AnalysisRunFacade {
  private readonly store = inject(StoreService);
  private readonly orchestrator = inject(OrchestratorService);

  readonly showModal = computed(() => this.store.showModal());
  readonly isBusy = computed(() => this.store.isBusy());
  readonly progress = computed(() => this.store.progress());
  readonly error = computed(() => this.store.error());
  readonly pendingAnalysis = computed(() => this.store.pendingAnalysis());

  startNewAnalysis(formData: AnalysisTargetFormModel): void {
    void this.orchestrator.startNewAnalysis(formData);
  }

  // attempt to resume unfinished analysis
  tryToReconnect(): void {
    void this.orchestrator.tryToReconnect();
  }

  // actually taking up the unfinished analysis
  resumeAnalysis(): void {
    this.orchestrator.resumeAnalysis();
  }

  // attempt to resume analysis after an error
  retryAnalysis(): void {
    this.orchestrator.retryAnalysis();
  }

  // abandoning analysis after an error
  cancelAnalysis(): void {
    void this.orchestrator.cancelAnalysis();
  }

  // abandoning a previously unfinished analysis
  abandonAnalysis(): void {
    void this.orchestrator.abandonAnalysis();
  }

  // abandoning an ongoing analysis
  abortAnalysis(): void {
    void this.orchestrator.abortAnalysis();
  }
}
