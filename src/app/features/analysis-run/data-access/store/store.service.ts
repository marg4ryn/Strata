import { inject, Service, signal } from '@angular/core';
import { LoggerService } from '@app/core/logging/logger.service';

@Service()
export class StoreService {
  private readonly logger = inject(LoggerService);

  showModal = signal<boolean>(false);
  isBusy = signal<boolean>(false);
  progress = signal<string>('');
  result = signal<string>('');
  error = signal<string>('');

  resetState(): void {
    this.showModal.set(false);
    this.isBusy.set(false);
    this.progress.set('');
    this.result.set('');
    this.error.set('');
    this.logger.info('Store Service reset state');
  }
}
