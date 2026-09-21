import { TestBed } from '@angular/core/testing';
import { MockService } from 'ng-mocks';

import { LoggerService, ContextLogger } from '@app/core/logging';
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
  let logger: ContextLogger;
  let lockManager: MockLockManager;

  const sessionId = '123';
  const expectedKey = `session-${sessionId}`;

  beforeEach(() => {
    lockManager = new MockLockManager();
    vi.stubGlobal('navigator', { locks: lockManager });

    logger = MockService(ContextLogger);

    const loggerService = MockService(LoggerService, {
      withContext: () => logger,
    });

    TestBed.configureTestingModule({
      providers: [AnalysisRunLockService, { provide: LoggerService, useValue: loggerService }],
    });

    service = TestBed.inject(AnalysisRunLockService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('lock', () => {
    it('locks available session', async () => {
      const res = await service.lock(sessionId);
      expect(res).toBe(true);
    });

    it('holds Web Lock under prefixed key', async () => {
      await service.lock(sessionId);
      expect(lockManager.locks.has(expectedKey)).toBe(true);
    });

    it('locks different sessions independently', async () => {
      const first = await service.lock('a');
      const second = await service.lock('b');

      expect(first).toBe(true);
      expect(second).toBe(true);
    });

    it('does not lock session that is already tracked internally', async () => {
      await service.lock(sessionId);

      const res = await service.lock(sessionId);

      expect(res).toBe(false);
    });

    it('does not lock session held by Web Locks API but not tracked internally', async () => {
      lockManager.locks.add(expectedKey);

      const res = await service.lock(sessionId);

      expect(res).toBe(false);
    });

    it('returns false when Web Locks API is not supported', async () => {
      vi.stubGlobal('navigator', {});

      const res = await service.lock(sessionId);

      expect(res).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('handles error thrown by navigator.locks.request', async () => {
      vi.spyOn(lockManager, 'request').mockRejectedValue(new Error('boom'));

      const res = await service.lock(sessionId);

      expect(res).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('unlock', () => {
    it('returns true and releases Web Lock after successful unlock', async () => {
      await service.lock(sessionId);

      const res = service.unlock(sessionId);

      expect(res).toBe(true);
      await vi.waitFor(() => expect(lockManager.locks.has(expectedKey)).toBe(false));
    });

    it('allows locking again after unlock', async () => {
      await service.lock(sessionId);
      service.unlock(sessionId);
      await vi.waitFor(() => expect(lockManager.locks.has(expectedKey)).toBe(false));

      const res = await service.lock(sessionId);

      expect(res).toBe(true);
    });

    it('returns false when unlocking session with no active lock', () => {
      const res = service.unlock(sessionId);
      expect(res).toBe(false);
    });

    it('returns false on second unlock of the same session', async () => {
      await service.lock(sessionId);
      service.unlock(sessionId);

      const res = service.unlock(sessionId);

      expect(res).toBe(false);
    });
  });
});
