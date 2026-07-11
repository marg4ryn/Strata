import { inject, Service, signal } from '@angular/core';
import { AnalysisStatusKey } from '../analysis-run.model';
import { LoggerService } from '@app/core/logging/logger.service';

@Service()
export class StoreService {
  private readonly logger = inject(LoggerService);

  showModal = signal<boolean>(false);
  isBusy = signal<boolean>(false);
  progress = signal<AnalysisStatusKey | null>(null);
  result = signal<string>('');
  error = signal<string>('');

  resetState(): void {
    this.showModal.set(false);
    this.isBusy.set(false);
    this.progress.set(null);
    this.result.set('');
    this.error.set('');
    this.logger.info('Store Service reset state');
  }
}
