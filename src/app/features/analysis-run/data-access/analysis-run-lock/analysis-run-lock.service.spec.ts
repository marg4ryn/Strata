import { TestBed } from '@angular/core/testing';
import { MockService } from 'ng-mocks';

import { LoggerService, ContextLogger } from '@app/core/logging';
import { LockService } from '@app/core/lock';
import { AnalysisRunLockService } from './analysis-run-lock.service';

describe('AnalysisRunLockService', () => {
  let service: AnalysisRunLockService;
  let logger: ContextLogger;
  let locker: LockService;

  beforeEach(() => {
    locker = MockService(LockService);
    logger = MockService(ContextLogger);

    const loggerService = MockService(LoggerService, {
      withContext: () => logger,
    });

    TestBed.configureTestingModule({
      providers: [
        AnalysisRunLockService,
        { provide: LockService, useValue: locker },
        { provide: LoggerService, useValue: loggerService },
      ],
    });

    service = TestBed.inject(AnalysisRunLockService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sessionId = '123';
  const expectedKey = `session-${sessionId}`;

  describe('lock', () => {
    it('returns true when lock is acquired', async () => {
      vi.spyOn(locker, 'lock').mockResolvedValue(true);

      const res = await service.lock(sessionId);

      expect(locker.lock).toHaveBeenCalledWith(expectedKey);
      expect(res).toBe(true);
    });

    it('returns false when lock is NOT acquired', async () => {
      vi.spyOn(locker, 'lock').mockResolvedValue(false);

      const res = await service.lock(sessionId);

      expect(locker.lock).toHaveBeenCalledWith(expectedKey);
      expect(res).toBe(false);
    });
  });

  describe('unlock', () => {
    it('returns true when lock is released', async () => {
      vi.spyOn(locker, 'unlock').mockResolvedValue(true);

      const res = await service.unlock(sessionId);

      expect(locker.unlock).toHaveBeenCalledWith(expectedKey);
      expect(res).toBe(true);
    });

    it('returns false when lock is NOT released', async () => {
      vi.spyOn(locker, 'unlock').mockResolvedValue(false);

      const res = await service.unlock(sessionId);

      expect(locker.unlock).toHaveBeenCalledWith(expectedKey);
      expect(res).toBe(false);
    });
  });
});
