import { inject, Service } from '@angular/core';

import { LoggerService } from '@app/core/logging/logger.service';

@Service()
export class LockService {
  private readonly logger = inject(LoggerService);
  private readonly prefix = 'session-';
  private readonly releasers = new Map<string, () => void>();

  async lock(sessionId: string): Promise<boolean> {
    const name = this.prefix + sessionId;

    if (this.releasers.has(sessionId)) {
      this.logger.debug(
        `Lock Service did not try to lock sessionId: ${sessionId} - sessionId in use`,
      );
      return false;
    }

    if (!navigator.locks) {
      this.logger.error(
        `Lock Service unavailable - Web Locks API not supported (sessionId: ${sessionId})`,
      );
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
        this.logger.info(`Lock Service locked sessionId: ${sessionId}`);
      } else {
        this.logger.debug(
          `Lock Service was not able to lock sessionId: ${sessionId} - sessionId in use`,
        );
      }

      return acquired;
    } catch (err) {
      this.logger.error(`Lock Service failed to acquire lock for sessionId: ${sessionId}`, err);
      return false;
    }
  }

  async unlock(sessionId: string): Promise<void> {
    const release = this.releasers.get(sessionId);

    if (!release) {
      this.logger.debug(
        `Lock Service did not try to unlock sessionId: ${sessionId} - no active lock found`,
      );
      return;
    }

    try {
      await release();
      this.logger.info(`Lock Service unlocked sessionId: ${sessionId}`);
    } catch (err) {
      this.logger.error(`Lock Service failed to release lock for sessionId: ${sessionId}`, err);
    } finally {
      this.releasers.delete(sessionId);
    }
  }
}
