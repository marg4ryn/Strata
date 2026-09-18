import { Service, inject } from '@angular/core';

import { injectLogger } from '@app/core/logging';
import { LockService } from '@app/core/lock';

@Service()
export class AnalysisRunLockService {
  private readonly logger = injectLogger('AnalysisRunLockService');
  private readonly locker = inject(LockService);
  private readonly prefix = 'session-';

  async lock(sessionId: string): Promise<boolean> {
    const acquired = await this.locker.lock(`${this.prefix}${sessionId}`);
    this.logger.debug(`Lock ${acquired ? 'acquired' : 'not acquired'}`, { sessionId });
    return acquired;
  }

  async unlock(sessionId: string): Promise<boolean> {
    const released = await this.locker.unlock(`${this.prefix}${sessionId}`);
    this.logger.debug(`Lock ${released ? 'released' : 'not released'}`, { sessionId });
    return released;
  }
}
