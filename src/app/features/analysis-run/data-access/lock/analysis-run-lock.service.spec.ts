import { TestBed } from '@angular/core/testing';

import { LoggerService } from '@app/core/logging/logger.service';
import { AnalysisRunLockService } from './analysis-run-lock.service';

class MockLockManager {
  locks = new Set<string>();

  async request(
    name: string,
    options: { ifAvailable?: boolean },
    callback: (lock: { name: string } | null) => Promise<void> | void,
  ): Promise<void> {
    const available = !this.locks.has(name);

    if (!available) {
      await callback(null);
      return;
    }

    this.locks.add(name);
    try {
      await callback({ name });
    } finally {
      this.locks.delete(name);
    }
  }
}

describe('AnalysisRunLockService', () => {
  let service: AnalysisRunLockService;
  let logger: Partial<LoggerService>;
  let lockManager: MockLockManager;

  beforeEach(() => {
    lockManager = new MockLockManager();
    vi.stubGlobal('navigator', { locks: lockManager });

    logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: LoggerService, useValue: logger }],
    });

    service = TestBed.inject(AnalysisRunLockService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const sessionId = '123';

  describe('lock', () => {
    it('locks available sessionId', async () => {
      const res = await service.lock(sessionId);

      expect(res).toBeTruthy();
      expect(logger.info).toHaveBeenCalled();
    });

    it('does not lock sessionId that is already tracked internally', async () => {
      await service.lock(sessionId);
      const res = await service.lock(sessionId);

      expect(res).toBeFalsy();
      expect(logger.debug).toHaveBeenCalled();
    });

    it('does not lock sessionId held by Web Locks API but not tracked internally', async () => {
      lockManager.locks.add(`session-${sessionId}`);

      const res = await service.lock(sessionId);

      expect(res).toBeFalsy();
      expect(logger.debug).toHaveBeenCalled();
    });

    it('returns false when Web Locks API is not supported', async () => {
      vi.stubGlobal('navigator', {});

      const res = await service.lock(sessionId);

      expect(res).toBeFalsy();
      expect(logger.error).toHaveBeenCalled();
    });

    it('handles error thrown by navigator.locks.request', async () => {
      const error = new Error('boom');
      vi.spyOn(lockManager, 'request').mockRejectedValue(error);

      const res = await service.lock(sessionId);

      expect(res).toBeFalsy();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('unlock', () => {
    it('unlocks a locked sessionId', async () => {
      const release = vi.fn();
      (service as any).releasers.set(sessionId, release);

      await service.unlock(sessionId);

      expect(release).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
      expect((service as any).releasers.has(sessionId)).toBeFalsy();
    });

    it('does nothing when unlocking sessionId with no active lock', () => {
      service.unlock(sessionId);

      expect(logger.debug).toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('handles error thrown by release function during unlock', () => {
      const error = new Error('release failed');
      (service as any).releasers.set(sessionId, () => {
        throw error;
      });

      service.unlock(sessionId);

      expect(logger.error).toHaveBeenCalledWith(expect.any(String), error);
      expect((service as any).releasers.has(sessionId)).toBeFalsy();
    });
  });
});
