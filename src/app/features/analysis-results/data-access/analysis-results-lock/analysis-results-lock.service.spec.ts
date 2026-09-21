import { TestBed } from '@angular/core/testing';
import { MockService } from 'ng-mocks';

import { LoggerService, ContextLogger } from '@app/core/logging';
import { AnalysisResultsLockService } from './analysis-results-lock.service';

class MockLockManager {
  private readonly tails = new Map<string, Promise<unknown>>();

  request<T>(
    name: string,
    options: { mode?: string },
    callback: (lock: { name: string }) => Promise<T>,
  ): Promise<T> {
    const previous = this.tails.get(name) ?? Promise.resolve();
    const result = previous.then(() => callback({ name }));
    this.tails.set(
      name,
      result.catch(() => undefined),
    );
    return result;
  }
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => (resolve = res));
  return { promise, resolve };
}

const tick = () => new Promise((resolve) => setTimeout(resolve));

describe('AnalysisResultsLockService', () => {
  let service: AnalysisResultsLockService;
  let logger: ContextLogger;
  let lockManager: MockLockManager;

  const name = 'registry:lock';

  beforeEach(() => {
    lockManager = new MockLockManager();
    vi.stubGlobal('navigator', { locks: lockManager });

    logger = MockService(ContextLogger);

    const loggerService = MockService(LoggerService, {
      withContext: () => logger,
    });

    TestBed.configureTestingModule({
      providers: [AnalysisResultsLockService, { provide: LoggerService, useValue: loggerService }],
    });

    service = TestBed.inject(AnalysisResultsLockService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('runExclusive', () => {
    it('requests exclusive lock with given name', async () => {
      const requestSpy = vi.spyOn(lockManager, 'request');

      await service.runExclusive(name, async () => 1);

      expect(requestSpy).toHaveBeenCalledWith(name, { mode: 'exclusive' }, expect.any(Function));
    });

    it('returns value produced by callback', async () => {
      const res = await service.runExclusive(name, async () => 'result');
      expect(res).toBe('result');
    });

    it('propagates error thrown by callback', async () => {
      const error = new Error('boom');

      await expect(
        service.runExclusive(name, async () => {
          throw error;
        }),
      ).rejects.toBe(error);
    });

    it('runs next callback after previous one failed', async () => {
      await service
        .runExclusive(name, async () => {
          throw new Error('boom');
        })
        .catch(() => undefined);

      const res = await service.runExclusive(name, async () => 'next');

      expect(res).toBe('next');
    });

    it('serializes callbacks for the same name', async () => {
      const events: string[] = [];
      const gate = deferred();

      const first = service.runExclusive(name, async () => {
        events.push('first:start');
        await gate.promise;
        events.push('first:end');
      });
      const second = service.runExclusive(name, async () => {
        events.push('second:start');
      });

      await tick();
      expect(events).toEqual(['first:start']);

      gate.resolve();
      await Promise.all([first, second]);

      expect(events).toEqual(['first:start', 'first:end', 'second:start']);
    });

    it('runs callbacks for different names concurrently', async () => {
      const gate = deferred();
      const events: string[] = [];

      const blocked = service.runExclusive('a', async () => {
        await gate.promise;
        events.push('a');
      });
      await service.runExclusive('b', async () => {
        events.push('b');
      });

      expect(events).toEqual(['b']);

      gate.resolve();
      await blocked;

      expect(events).toEqual(['b', 'a']);
    });
  });

  describe('when Web Locks API is not supported', () => {
    beforeEach(() => {
      vi.stubGlobal('navigator', {});
    });

    it('runs callback without lock and returns its value', async () => {
      const fn = vi.fn().mockResolvedValue('result');

      const res = await service.runExclusive(name, fn);

      expect(fn).toHaveBeenCalledOnce();
      expect(res).toBe('result');
    });

    it('logs error', async () => {
      await service.runExclusive(name, async () => undefined);
      expect(logger.error).toHaveBeenCalled();
    });

    it('propagates error thrown by callback', async () => {
      const error = new Error('boom');

      await expect(
        service.runExclusive(name, async () => {
          throw error;
        }),
      ).rejects.toBe(error);
    });
  });
});
