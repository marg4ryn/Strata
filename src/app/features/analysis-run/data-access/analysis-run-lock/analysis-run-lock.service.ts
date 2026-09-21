import { Service } from '@angular/core';

import { injectLogger } from '@app/core/logging';

@Service()
export class AnalysisRunLockService {
  private readonly logger = injectLogger('AnalysisRunLockService');

  private readonly releasers = new Map<string, () => void>();
  private readonly prefix = 'session-';

  async lock(sessionId: string): Promise<boolean> {
    const name = `${this.prefix}${sessionId}`;

    if (this.releasers.has(name)) {
      this.logger.debug('Lock not acquired (already held in this tab)', { sessionId });
      return false;
    }

    if (!navigator.locks) {
      this.logger.error('Web Locks API not supported', { sessionId });
      return false;
    }

    let release!: () => void;
    const holdPromise = new Promise<void>((resolve) => (release = resolve));

    try {
      const acquired = await new Promise<boolean>((resolve, reject) => {
        navigator.locks
          .request(name, { mode: 'exclusive', ifAvailable: true }, async (lock) => {
            if (!lock) {
              resolve(false);
              return;
            }
            resolve(true);
            await holdPromise;
          })
          .catch(reject);
      });

      if (acquired) {
        this.releasers.set(name, release);
      }

      this.logger.debug(`Lock ${acquired ? 'acquired' : 'not acquired'}`, { sessionId });
      return acquired;
    } catch (error) {
      this.logger.error('Failed to acquire lock', { sessionId, error });
      return false;
    }
  }

  unlock(sessionId: string): boolean {
    const name = `${this.prefix}${sessionId}`;
    const release = this.releasers.get(name);

    if (!release) {
      this.logger.debug('Lock not released (not held)', { sessionId });
      return false;
    }

    this.releasers.delete(name);
    release();
    this.logger.debug('Lock released', { sessionId });
    return true;
  }
}
