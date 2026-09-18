import { Service } from '@angular/core';

import { injectLogger } from '@app/core/logging';

@Service()
export class LockService {
  private readonly logger = injectLogger('LockService');
  private readonly releasers = new Map<string, () => void>();

  async lock(value: string): Promise<boolean> {
    if (this.releasers.has(value)) {
      return false;
    }

    if (!navigator.locks) {
      this.logger.error('Web Locks API not supported', { value });
      return false;
    }

    let release!: () => void;
    const holdPromise = new Promise<void>((res) => (release = res));

    try {
      const acquired = await new Promise<boolean>((resolve, reject) => {
        navigator.locks
          .request(value, { mode: 'exclusive', ifAvailable: true }, async (lock) => {
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
        this.releasers.set(value, release);
      }

      return acquired;
    } catch (error) {
      this.logger.error('Failed to acquire lock', { value, error });
      return false;
    }
  }

  async unlock(value: string): Promise<boolean> {
    const release = this.releasers.get(value);

    if (!release) {
      return false;
    }

    try {
      release();
      return true;
    } catch (error) {
      this.logger.error('Failed to release lock', { value, error });
      return false;
    } finally {
      this.releasers.delete(value);
    }
  }
}
