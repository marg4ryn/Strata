import { inject, Service, signal } from '@angular/core';
import { LoggerService } from '@app/core/logging/logger.service';
import { AnalysisStatusKey, PendingAnalysis, ErrorType } from '../../analysis-run.model';

@Service()
export class StoreService {
  private readonly logger = inject(LoggerService);

  readonly pendingAnalysis = signal<PendingAnalysis | null>(null);
  readonly progress = signal<AnalysisStatusKey | null>(null);
  readonly result = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly errorType = signal<ErrorType | null>(null);

  readonly showModal = signal<boolean>(false);
  readonly isBusy = signal<boolean>(false);

  resetAnalysisState(): void {
    this.pendingAnalysis.set(null);
    this.progress.set(null);
    this.result.set(null);
    this.error.set(null);
    this.errorType.set(null);
    this.logger.info('Store Service reset analysis state');
  }

  resetState(): void {
    this.pendingAnalysis.set(null);
    this.progress.set(null);
    this.result.set(null);
    this.error.set(null);
    this.errorType.set(null);
    this.isBusy.set(false);
    this.showModal.set(false);
    this.logger.info('Store Service reset state');
  }
}
