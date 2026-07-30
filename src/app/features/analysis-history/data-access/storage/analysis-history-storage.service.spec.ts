import { TestBed } from '@angular/core/testing';

import { LoggerService } from '@app/core/logging/logger.service';
import { StorageService } from '@app/core/storage/storage.service';
import { AnalysisTarget } from '@app/features/analysis-run/analysis-run.model';
import { AnalysisHistoryStorageService } from './analysis-history-storage.service';
import { AnalysisHistoryEntry } from '../../analysis-history.model';

describe('AnalysisHistoryStorageService', () => {
  let service: AnalysisHistoryStorageService;
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
    service = TestBed.inject(AnalysisHistoryStorageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const firstAnalysisHistoryEntry: AnalysisHistoryEntry = {
    analysisId: '1',
    completedAt: 42,
    target: null as unknown as AnalysisTarget,
  };
  const secondAnalysisHistoryEntry: AnalysisHistoryEntry = {
    analysisId: '2',
    completedAt: 43,
    target: null as unknown as AnalysisTarget,
  };

  const analysisHistoryKey = 'analysisHistory';

  describe('getAnalysisHistory', () => {
    it('returns analysis history', () => {
      storage.getItem.mockReturnValue([firstAnalysisHistoryEntry, secondAnalysisHistoryEntry]);
      const res = service.getAnalysisHistory();
      expect(res).toEqual([firstAnalysisHistoryEntry, secondAnalysisHistoryEntry]);
      expect(storage.getItem).toHaveBeenCalledWith(localStorage, analysisHistoryKey);
    });

    it('returns null when storage is empty', () => {
      storage.getItem.mockReturnValue(null);
      const res = service.getAnalysisHistory();
      expect(res).toBeNull();
      expect(storage.getItem).toHaveBeenCalledWith(localStorage, analysisHistoryKey);
    });
  });

  describe('saveAnalysisHistoryEntry', () => {
    it('saves first analysis history entry', () => {
      storage.getItem.mockReturnValue(null);
      service.saveAnalysisHistoryEntry(firstAnalysisHistoryEntry);
      expect(storage.setItem).toHaveBeenCalledWith(localStorage, analysisHistoryKey, [
        firstAnalysisHistoryEntry,
      ]);
    });

    it('appends analysis history entry to existing list', () => {
      storage.getItem.mockReturnValue([firstAnalysisHistoryEntry]);
      service.saveAnalysisHistoryEntry(secondAnalysisHistoryEntry);
      expect(storage.setItem).toHaveBeenCalledWith(localStorage, analysisHistoryKey, [
        firstAnalysisHistoryEntry,
        secondAnalysisHistoryEntry,
      ]);
    });
  });

  describe('removeAnalysisHistoryEntry', () => {
    it('returns when there are no analysis history entries', () => {
      vi.spyOn(service, 'getAnalysisHistory').mockReturnValue(null);
      service.removeAnalysisHistoryEntry(firstAnalysisHistoryEntry.analysisId);
      expect(storage.removeItem).not.toHaveBeenCalled();
    });

    it('removes the storage item when removing the last notification', () => {
      vi.spyOn(service, 'getAnalysisHistory').mockReturnValue([firstAnalysisHistoryEntry]);
      service.removeAnalysisHistoryEntry(firstAnalysisHistoryEntry.analysisId);
      expect(storage.removeItem).toHaveBeenCalledWith(localStorage, analysisHistoryKey);
    });

    it('keeps the remaining notifications', () => {
      vi.spyOn(service, 'getAnalysisHistory').mockReturnValue([
        firstAnalysisHistoryEntry,
        secondAnalysisHistoryEntry,
      ]);
      service.removeAnalysisHistoryEntry(firstAnalysisHistoryEntry.analysisId);
      expect(storage.setItem).toHaveBeenCalledWith(localStorage, analysisHistoryKey, [
        secondAnalysisHistoryEntry,
      ]);
    });

    it('does not throw when the notification does not exist', () => {
      vi.spyOn(service, 'getAnalysisHistory').mockReturnValue([firstAnalysisHistoryEntry]);
      expect(() =>
        service.removeAnalysisHistoryEntry(firstAnalysisHistoryEntry.analysisId),
      ).not.toThrow();
    });
  });

  describe('clearAnalysisHistory', () => {
    it('removes the storage item', () => {
      service.clearAnalysisHistory();
      expect(storage.removeItem).toHaveBeenCalledWith(localStorage, analysisHistoryKey);
    });
  });
});
