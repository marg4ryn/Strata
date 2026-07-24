import { TestBed } from '@angular/core/testing';

import { LoggerService } from '@app/core/logging/logger.service';
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

    service = TestBed.inject(LockService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const sessionId = '123';

  it('locks available sessionId', async () => {
    const res = await service.lock(sessionId);

    expect(res).toBeTruthy();
    expect(logger.info).toHaveBeenCalledWith(`Lock Service locked sessionId: ${sessionId}`);
  });

  it('does not lock sessionId that is already tracked internally', async () => {
    await service.lock(sessionId);
    const res = await service.lock(sessionId);

    expect(res).toBeFalsy();
    expect(logger.debug).toHaveBeenCalledWith(
      `Lock Service did not try to lock sessionId: ${sessionId} - sessionId in use`,
    );
  });

  it('does not lock sessionId held by Web Locks API but not tracked internally', async () => {
    lockManager.locks.add(`session-${sessionId}`);

    const res = await service.lock(sessionId);

    expect(res).toBeFalsy();
    expect(logger.debug).toHaveBeenCalledWith(
      `Lock Service was not able to lock sessionId: ${sessionId} - sessionId in use`,
    );
  });

  it('returns false when Web Locks API is not supported', async () => {
    vi.stubGlobal('navigator', {});

    const res = await service.lock(sessionId);

    expect(res).toBeFalsy();
    expect(logger.error).toHaveBeenCalledWith(
      `Lock Service unavailable - Web Locks API not supported (sessionId: ${sessionId})`,
    );
  });

  it('handles error thrown by navigator.locks.request', async () => {
    const error = new Error('boom');
    vi.spyOn(lockManager, 'request').mockRejectedValue(error);

    const res = await service.lock(sessionId);

    expect(res).toBeFalsy();
    expect(logger.error).toHaveBeenCalledWith(
      `Lock Service failed to acquire lock for sessionId: ${sessionId}`,
      error,
    );
  });

  it('unlocks a locked sessionId', async () => {
    await service.lock(sessionId);

    await service.unlock(sessionId);

    expect(logger.info).toHaveBeenCalledWith(`Lock Service unlocked sessionId: ${sessionId}`);
    expect(lockManager.locks.has(`session-${sessionId}`)).toBeFalsy();
  });

  it('allows re-locking sessionId after unlock', async () => {
    await service.lock(sessionId);
    await service.unlock(sessionId);

    const res = await service.lock(sessionId);

    expect(res).toBeTruthy();
  });

  it('does nothing when unlocking sessionId with no active lock', () => {
    service.unlock(sessionId);

    expect(logger.debug).toHaveBeenCalledWith(
      `Lock Service did not try to unlock sessionId: ${sessionId} - no active lock found`,
    );
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('handles error thrown by release function during unlock', async () => {
    await service.lock(sessionId);

    const error = new Error('release failed');
    (service as any).releasers.set(sessionId, () => {
      throw error;
    });

    service.unlock(sessionId);

    expect(logger.error).toHaveBeenCalledWith(
      `Lock Service failed to release lock for sessionId: ${sessionId}`,
      error,
    );
    expect((service as any).releasers.has(sessionId)).toBeFalsy();
  });
});
