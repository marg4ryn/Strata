import { TestBed } from '@angular/core/testing';

import { LoggerService } from '@app/core/logging/logger.service';
import { AnalysisTarget } from '@app/features/analysis-run/analysis-run.model';
import { AnalysisHistoryStoreService } from './analysis-history-store.service';
import { AnalysisHistoryEntry } from '../../analysis-history.model';

describe('AnalysisHistoryStoreService', () => {
  let service: AnalysisHistoryStoreService;
  let logger: Partial<LoggerService>;

  beforeEach(() => {
    logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: LoggerService, useValue: logger }],
    });
    service = TestBed.inject(AnalysisHistoryStoreService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const firstAnalysisHistoryEntry: AnalysisHistoryEntry = {
    analysisId: '1',
    startedAt: 42,
    target: null as unknown as AnalysisTarget,
  };
  const secondAnalysisHistoryEntry: AnalysisHistoryEntry = {
    analysisId: '2',
    startedAt: 43,
    target: null as unknown as AnalysisTarget,
  };

  it('updates computed signals', () => {
    service.analysisHistory.set([firstAnalysisHistoryEntry]);
    service.showPanel.set(true);

    expect(service.analysisHistory()).toEqual([firstAnalysisHistoryEntry]);
    expect(service.showPanel()).toBeTruthy();
  });

  describe('addAnalysisHistoryEntry', () => {
    it('adds first analysis history entry', () => {
      service.analysisHistory.set(null);
      service.addAnalysisHistoryEntry(firstAnalysisHistoryEntry);
      expect(service.analysisHistory()).toEqual([firstAnalysisHistoryEntry]);
      expect(logger.info).toHaveBeenCalled();
    });

    it('appends analysis history entry to existing list', () => {
      service.analysisHistory.set([firstAnalysisHistoryEntry]);
      service.addAnalysisHistoryEntry(secondAnalysisHistoryEntry);
      expect(service.analysisHistory()).toEqual([
        firstAnalysisHistoryEntry,
        secondAnalysisHistoryEntry,
      ]);
      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe('removeAnalysisHistoryEntry', () => {
    it('removes last analysis history entry', () => {
      service.analysisHistory.set([firstAnalysisHistoryEntry]);
      service.removeAnalysisHistoryEntry(firstAnalysisHistoryEntry.analysisId);
      expect(service.analysisHistory()).toBeNull();
      expect(logger.info).toHaveBeenCalled();
    });

    it('keeps the remaining analysis history entries', () => {
      service.analysisHistory.set([firstAnalysisHistoryEntry, secondAnalysisHistoryEntry]);
      service.removeAnalysisHistoryEntry(firstAnalysisHistoryEntry.analysisId);
      expect(service.analysisHistory()).toEqual([secondAnalysisHistoryEntry]);
      expect(logger.info).toHaveBeenCalled();
    });

    it('does not throw when the analysis history entry list is empty', () => {
      service.analysisHistory.set(null);
      expect(() =>
        service.removeAnalysisHistoryEntry(firstAnalysisHistoryEntry.analysisId),
      ).not.toThrow();
    });

    it('does not throw when the analysis history entry does not exist', () => {
      service.analysisHistory.set([firstAnalysisHistoryEntry]);
      expect(() =>
        service.removeAnalysisHistoryEntry(firstAnalysisHistoryEntry.analysisId),
      ).not.toThrow();
    });
  });
});
