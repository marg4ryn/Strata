import { TestBed } from '@angular/core/testing';

import { LoggerService } from '@app/core/logging/logger/logger.service';
import { StorageService } from '@app/core/storage/storage.service';
import { AnalysisRunStorageService } from './analysis-run-storage.service';
import { PendingAnalysis, AnalysisTarget, DateRange } from '../../analysis-run.model';

describe('AnalysisRunStorageService', () => {
  let service: AnalysisRunStorageService;
  let logger: Partial<LoggerService>;

  let storage: {
    setItem: ReturnType<typeof vi.fn>;
    getItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    storage = {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
    };

    logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: LoggerService, useValue: logger },
        { provide: StorageService, useValue: storage },
      ],
    });

    service = TestBed.inject(AnalysisRunStorageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sessionId = '123';
  const sessionIdKey = 'sessionId';

  describe('getSessionId', () => {
    it('returns sessionId', () => {
      storage.getItem.mockReturnValue(sessionId);
      const res = service.getSessionId();
      expect(res).toBe(sessionId);
      expect(storage.getItem).toHaveBeenCalledWith(sessionStorage, sessionIdKey);
    });

    it('returns null when storage is empty', () => {
      storage.getItem.mockReturnValue(null);
      const res = service.getSessionId();
      expect(res).toBeNull();
      expect(storage.getItem).toHaveBeenCalledWith(sessionStorage, sessionIdKey);
    });
  });

  describe('saveSessionId', () => {
    it('saves sessionId', () => {
      service.saveSessionId(sessionId);
      expect(storage.setItem).toHaveBeenCalledWith(sessionStorage, sessionIdKey, sessionId);
    });
  });

  describe('deleteSessionId', () => {
    it('removes storage item', () => {
      service.deleteSessionId();
      expect(storage.removeItem).toHaveBeenCalledWith(sessionStorage, sessionIdKey);
    });
  });

  const range: DateRange = {
    startDate: '2000-01-01',
    endDate: '2000-01-01',
    timezone: 'Europe/Warsaw',
  };
  const target: AnalysisTarget = {
    targetURL: 'https://example.com/Project.git',
    limitRange: true,
    range: range,
  };
  const pendingAnalysis: PendingAnalysis = {
    sessionId: '1',
    startedAt: 42,
    target: target,
  };
  const newPendingAnalysis: PendingAnalysis = {
    sessionId: '2',
    startedAt: 43,
    target: target,
  };

  const pendingAnalysesKey = 'pendingAnalyses';

  describe('getPendingAnalyses', () => {
    it('returns pending analyses', () => {
      storage.getItem.mockReturnValue([pendingAnalysis, newPendingAnalysis]);
      const res = service.getPendingAnalyses();
      expect(res).toEqual([pendingAnalysis, newPendingAnalysis]);
      expect(storage.getItem).toHaveBeenCalledWith(localStorage, pendingAnalysesKey);
    });

    it('returns null when storage is empty', () => {
      storage.getItem.mockReturnValue(null);
      const res = service.getPendingAnalyses();
      expect(res).toBeNull();
    });
  });

  describe('savePendingAnalysis', () => {
    it('saves first pending analysis', () => {
      storage.getItem.mockReturnValue(null);
      service.savePendingAnalysis(pendingAnalysis);
      expect(storage.setItem).toHaveBeenCalledWith(localStorage, pendingAnalysesKey, [
        pendingAnalysis,
      ]);
    });

    it('appends pending analysis to existing list', () => {
      storage.getItem.mockReturnValue([pendingAnalysis]);
      service.savePendingAnalysis(newPendingAnalysis);
      expect(storage.setItem).toHaveBeenCalledWith(localStorage, pendingAnalysesKey, [
        pendingAnalysis,
        newPendingAnalysis,
      ]);
    });
  });

  describe('deletePendingAnalysis', () => {
    it('returns when there are no pending analyses', () => {
      vi.spyOn(service, 'getPendingAnalyses').mockReturnValue(null);
      service.deletePendingAnalysis(pendingAnalysis.sessionId);
      expect(storage.removeItem).not.toHaveBeenCalled();
    });

    it('removes the storage item when removing the last pending analysis', () => {
      vi.spyOn(service, 'getPendingAnalyses').mockReturnValue([pendingAnalysis]);
      service.deletePendingAnalysis(pendingAnalysis.sessionId);
      expect(storage.removeItem).toHaveBeenCalledWith(localStorage, pendingAnalysesKey);
    });

    it('keeps the remaining pending analyses', () => {
      vi.spyOn(service, 'getPendingAnalyses').mockReturnValue([
        pendingAnalysis,
        newPendingAnalysis,
      ]);
      service.deletePendingAnalysis(pendingAnalysis.sessionId);
      expect(storage.setItem).toHaveBeenCalledWith(localStorage, pendingAnalysesKey, [
        newPendingAnalysis,
      ]);
    });

    it('does not throw when the pending analysis does not exist', () => {
      vi.spyOn(service, 'getPendingAnalyses').mockReturnValue([pendingAnalysis]);
      expect(() => service.deletePendingAnalysis(newPendingAnalysis.sessionId)).not.toThrow();
    });
  });

  describe('clearPendingAnalyses', () => {
    it('removes the storage item', () => {
      service.clearPendingAnalyses();
      expect(storage.removeItem).toHaveBeenCalledWith(localStorage, pendingAnalysesKey);
    });
  });
});
