import { Service } from '@angular/core';

import { injectLogger } from '@app/core/logging';

@Service()
export class AnalysisResultsLockService {
  private readonly logger = injectLogger('AnalysisResultsLockService');

  async runExclusive<T>(value: string, fn: () => Promise<T>): Promise<T> {
    if (!navigator.locks) {
      this.logger.error('Web Locks API not supported', { value });
      return fn();
    }
    return navigator.locks.request(value, { mode: 'exclusive' }, fn);
  }
}
