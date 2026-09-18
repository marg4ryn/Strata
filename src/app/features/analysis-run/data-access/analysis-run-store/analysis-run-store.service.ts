import { Service, signal } from '@angular/core';

import { injectLogger } from '@app/core/logging';
import type { AnalysisStatusKey, PendingAnalysis, ErrorType } from '../../analysis-run.model';

@Service()
export class AnalysisRunStoreService {
  private readonly logger = injectLogger('AnalysisRunStoreService');

  readonly pendingAnalysis = signal<PendingAnalysis | null>(null);
  readonly progress = signal<AnalysisStatusKey | null>(null);
  readonly result = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly errorType = signal<ErrorType | null>(null);

  readonly showModal = signal<boolean>(false);
  readonly isBusy = signal<boolean>(false);
  readonly isAborting = signal<boolean>(false);

  resetAnalysisState(): void {
    this.pendingAnalysis.set(null);
    this.progress.set(null);
    this.result.set(null);
    this.error.set(null);
    this.errorType.set(null);
    this.logger.info('Analysis state reset');
  }

  resetState(): void {
    this.pendingAnalysis.set(null);
    this.progress.set(null);
    this.result.set(null);
    this.error.set(null);
    this.errorType.set(null);
    this.isBusy.set(false);
    this.isAborting.set(false);
    this.showModal.set(false);
    this.logger.info('State reset');
  }
}
