import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { AnalysisTarget } from '../analysis-run/analysis-run.model';
import { AnalysisHistoryFacade } from './analysis-history.facade';
import { AnalysisHistoryStoreService } from './data-access/store/analysis-history-store.service';
import { AnalysisHistoryService } from './data-access/service/analysis-history.service';
import { AnalysisHistoryEntry } from './analysis-history.model';

describe('AnalysisHistoryFacade', () => {
  let service: AnalysisHistoryFacade;

  let store: {
    analysisHistory: ReturnType<typeof signal<AnalysisHistoryEntry[] | null>>;
    showPanel: ReturnType<typeof signal<boolean>>;
  };

  let analysisHistoryService: {
    openPanel: ReturnType<typeof vi.fn>;
    closePanel: ReturnType<typeof vi.fn>;
    loadAnalysisHistory: ReturnType<typeof vi.fn>;
    addAnalysisHistoryEntry: ReturnType<typeof vi.fn>;
    removeAnalysisHistoryEntry: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    store = {
      analysisHistory: signal(null),
      showPanel: signal(false),
    };

    analysisHistoryService = {
      openPanel: vi.fn(),
      closePanel: vi.fn(),
      loadAnalysisHistory: vi.fn(),
      addAnalysisHistoryEntry: vi.fn(),
      removeAnalysisHistoryEntry: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AnalysisHistoryStoreService, useValue: store },
        { provide: AnalysisHistoryService, useValue: analysisHistoryService },
      ],
    });
    service = TestBed.inject(AnalysisHistoryFacade);
  });

  const analysisHistoryEntry: AnalysisHistoryEntry = {
    analysisId: '1',
    startedAt: 42,
    target: null as unknown as AnalysisTarget,
  };

  it('updates computed signals', () => {
    store.analysisHistory.set([analysisHistoryEntry]);
    store.showPanel.set(true);
    expect(service.analysisHistory()).toEqual([analysisHistoryEntry]);
    expect(service.showPanel()).toBeTruthy();
  });

  it('handles openPanel', () => {
    service.openPanel();
    expect(analysisHistoryService.openPanel).toHaveBeenCalledOnce();
  });

  it('handles closePanel', () => {
    service.closePanel();
    expect(analysisHistoryService.closePanel).toHaveBeenCalledOnce();
  });

  it('handles loadAnalysisHistory', () => {
    service.loadAnalysisHistory();
    expect(analysisHistoryService.loadAnalysisHistory).toHaveBeenCalledOnce();
  });

  it('handles addAnalysisHistoryEntry', () => {
    service.addAnalysisHistoryEntry(analysisHistoryEntry);
    expect(analysisHistoryService.addAnalysisHistoryEntry).toHaveBeenCalledWith(
      analysisHistoryEntry,
    );
  });

  it('handles removeAnalysisHistoryEntry', () => {
    service.removeAnalysisHistoryEntry(analysisHistoryEntry.analysisId);
    expect(analysisHistoryService.removeAnalysisHistoryEntry).toHaveBeenCalledWith(
      analysisHistoryEntry.analysisId,
    );
  });
});
