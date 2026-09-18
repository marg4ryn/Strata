import { Service } from '@angular/core';

import { injectLogger } from '@app/core/logging';

@Service()
export class AnalysisRunLockService {
  private readonly logger = injectLogger('AnalysisRunLockService');
  private readonly prefix = 'session-';
  private readonly releasers = new Map<string, () => void>();

  async lock(sessionId: string): Promise<boolean> {
    const name = this.prefix + sessionId;

    if (this.releasers.has(sessionId)) {
      this.logger.debug('Lock aborted - already in use', { sessionId });
      return false;
    }

    if (!navigator.locks) {
      this.logger.error('Web Locks API not supported', { sessionId });
      return false;
    }

    let release!: () => void;
    const holdPromise = new Promise<void>((res) => (release = res));

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
          .catch((err) => {
            reject(err);
          });
      });

      if (acquired) {
        this.releasers.set(sessionId, release);
        this.logger.info('Lock acquired', { sessionId });
      } else {
        this.logger.debug('Lock rejected - in use by another tab', { sessionId });
      }

      return acquired;
    } catch (error) {
      this.logger.error('Failed to acquire lock', { sessionId, error });
      return false;
    }
  }

  async unlock(sessionId: string): Promise<void> {
    const release = this.releasers.get(sessionId);

    if (!release) {
      this.logger.debug('Unlock aborted - no active lock found', { sessionId });
      return;
    }

    try {
      release();
      this.logger.info('Lock released', { sessionId });
    } catch (error) {
      this.logger.error('Failed to release lock', { sessionId, error });
    } finally {
      this.releasers.delete(sessionId);
    }
  }
}
