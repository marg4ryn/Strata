import { TestBed } from '@angular/core/testing';
import { MockService } from 'ng-mocks';

import { LoggerService, ContextLogger } from '@app/core/logging';
import { LockService } from './lock.service';

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

describe('LockService', () => {
  let service: LockService;
  let logger: ReturnType<typeof MockService<ContextLogger>>;
  let lockManager: MockLockManager;

  beforeEach(() => {
    lockManager = new MockLockManager();
    vi.stubGlobal('navigator', { locks: lockManager });

    logger = MockService(ContextLogger);

    const loggerService = MockService(LoggerService, {
      withContext: () => logger,
    });

    TestBed.configureTestingModule({
      providers: [{ provide: LoggerService, useValue: loggerService }],
    });

    service = TestBed.inject(LockService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const value = '123';

  describe('lock', () => {
    it('locks available value', async () => {
      const res = await service.lock(value);
      expect(res).toBeTruthy();
    });

    it('does not lock value that is already tracked internally', async () => {
      await service.lock(value);
      const res = await service.lock(value);
      expect(res).toBeFalsy();
    });

    it('does not lock value held by Web Locks API but not tracked internally', async () => {
      lockManager.locks.add(value);
      const res = await service.lock(value);
      expect(res).toBeFalsy();
    });

    it('returns false when Web Locks API is not supported', async () => {
      vi.stubGlobal('navigator', {});

      const res = await service.lock(value);

      expect(res).toBeFalsy();
      expect(logger.error).toHaveBeenCalled();
    });

    it('handles error thrown by navigator.locks.request', async () => {
      const error = new Error('boom');
      vi.spyOn(lockManager, 'request').mockRejectedValue(error);

      const res = await service.lock(value);

      expect(res).toBeFalsy();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('unlock', () => {
    it('returns true after successfull unlock', async () => {
      const release = vi.fn();
      (service as any).releasers.set(value, release);

      const res = await service.unlock(value);

      expect(res).toBeTruthy();
      expect(release).toHaveBeenCalled();
      expect((service as any).releasers.has(value)).toBeFalsy();
    });

    it('returns false when unlocking value with no active lock', async () => {
      const res = await service.unlock(value);
      expect(res).toBeFalsy();
    });

    it('handles error thrown by release function during unlock', async () => {
      const error = new Error('release failed');
      (service as any).releasers.set(value, () => {
        throw error;
      });

      const res = await service.unlock(value);

      expect(res).toBeFalsy();
      expect(logger.error).toHaveBeenCalled();
      expect((service as any).releasers.has(value)).toBeFalsy();
    });
  });
});
