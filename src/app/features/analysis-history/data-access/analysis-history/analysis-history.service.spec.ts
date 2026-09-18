import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MockService } from 'ng-mocks';

import { LoggerService, ContextLogger } from '@app/core/logging';
import { AnalysisResultsFacade } from '@app/features/analysis-results';
import type { AnalysisTarget } from '@app/features/analysis-run';
import { AnalysisHistoryService } from './analysis-history.service';
import { AnalysisHistoryStoreService } from '../analysis-history-store/analysis-history-store.service';
import { AnalysisHistoryStorageService } from '../analysis-history-storage/analysis-history-storage.service';
import type { AnalysisHistoryEntry } from '../../analysis-history.model';

class MockBroadcastChannel {
  onmessage: ((event: MessageEvent) => void) | null = null;
  postMessage = vi.fn();
  close = vi.fn();

  simulateMessage(data: any) {
    this.onmessage?.({ data } as MessageEvent);
  }
}

describe('AnalysisHistoryService', () => {
  let service: AnalysisHistoryService;
  let logger: ReturnType<typeof MockService<ContextLogger>>;
  let mockChannel: MockBroadcastChannel;

  let store: {
    analysisHistory: ReturnType<typeof signal<AnalysisHistoryEntry[] | null>>;
    showPanel: ReturnType<typeof signal<boolean>>;
    addAnalysisHistoryEntry: ReturnType<typeof vi.fn>;
    removeAnalysisHistoryEntry: ReturnType<typeof vi.fn>;
  };

  let storage: {
    getAnalysisHistory: ReturnType<typeof vi.fn>;
    saveAnalysisHistoryEntry: ReturnType<typeof vi.fn>;
    removeAnalysisHistoryEntry: ReturnType<typeof vi.fn>;
    clearAnalysisHistory: ReturnType<typeof vi.fn>;
  };

  let results: {
    navigateToAnalysis: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    store = {
      analysisHistory: signal(null),
      showPanel: signal(false),
      addAnalysisHistoryEntry: vi.fn(),
      removeAnalysisHistoryEntry: vi.fn(),
    };

    storage = {
      getAnalysisHistory: vi.fn(),
      saveAnalysisHistoryEntry: vi.fn(),
      removeAnalysisHistoryEntry: vi.fn(),
      clearAnalysisHistory: vi.fn(),
    };

    results = {
      navigateToAnalysis: vi.fn(),
    };

    logger = MockService(ContextLogger);

    const loggerService = MockService(LoggerService, {
      withContext: () => logger,
    });

    mockChannel = new MockBroadcastChannel();
    class MockBroadcastChannelConstructor {
      constructor() {
        return mockChannel;
      }
    }

    vi.stubGlobal('BroadcastChannel', MockBroadcastChannelConstructor);

    TestBed.configureTestingModule({
      providers: [
        { provide: AnalysisHistoryStoreService, useValue: store },
        { provide: AnalysisHistoryStorageService, useValue: storage },
        { provide: LoggerService, useValue: loggerService },
        { provide: AnalysisResultsFacade, useValue: results },
      ],
    });

    service = TestBed.inject(AnalysisHistoryService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const analysisHistoryEntry: AnalysisHistoryEntry = {
    analysisId: '1',
    completedAt: 42,
    target: null as unknown as AnalysisTarget,
  };

  describe('loadAnalysisHistory', () => {
    it('loads analysis history', () => {
      vi.spyOn(storage, 'getAnalysisHistory').mockReturnValue([analysisHistoryEntry]);
      service.loadAnalysisHistory();
      expect(store.analysisHistory()).toEqual([analysisHistoryEntry]);
    });

    it('loads analysis history when empty', () => {
      vi.spyOn(storage, 'getAnalysisHistory').mockReturnValue(null);
      service.loadAnalysisHistory();
      expect(store.analysisHistory()).toBeNull();
    });
  });

  describe('loadAnalysis', () => {
    it('loads analysis', () => {
      service.loadAnalysis('123');
      expect(results.navigateToAnalysis).toHaveBeenCalledWith('123');
    });
  });

  describe('panel toggling', () => {
    it('handles analysis history panel opening', () => {
      service.openPanel();
      expect(store.showPanel()).toBeTruthy();
    });

    it('handles analysis history panel closing', () => {
      service.closePanel();
      expect(store.showPanel()).toBeFalsy();
    });
  });

  describe('addAnalysisHistoryEntry', () => {
    it('adds analysis history entry', () => {
      service.addAnalysisHistoryEntry(analysisHistoryEntry);
      expect(store.addAnalysisHistoryEntry).toHaveBeenCalledWith(analysisHistoryEntry);
      expect(storage.saveAnalysisHistoryEntry).toHaveBeenCalledWith(analysisHistoryEntry);
    });
  });

  describe('removeAnalysisHistoryEntry', () => {
    it('removes analysis history entry', () => {
      store.analysisHistory.set([analysisHistoryEntry]);
      service.removeAnalysisHistoryEntry(analysisHistoryEntry.analysisId);
      expect(store.removeAnalysisHistoryEntry).toHaveBeenCalledWith(
        analysisHistoryEntry.analysisId,
      );
      expect(storage.removeAnalysisHistoryEntry).toHaveBeenCalledWith(
        analysisHistoryEntry.analysisId,
      );
    });

    it('removes notification that does not exist', () => {
      store.analysisHistory.set(null);
      service.removeAnalysisHistoryEntry(analysisHistoryEntry.analysisId);
      expect(store.removeAnalysisHistoryEntry).toHaveBeenCalledWith(
        analysisHistoryEntry.analysisId,
      );
      expect(storage.removeAnalysisHistoryEntry).toHaveBeenCalledWith(
        analysisHistoryEntry.analysisId,
      );
    });
  });

  describe('BroadcastChannel sync', () => {
    it('sends postMessage when adding an entry', () => {
      service.addAnalysisHistoryEntry(analysisHistoryEntry);
      expect(mockChannel.postMessage).toHaveBeenCalledWith({
        type: 'add',
        analysisHistoryEntry: analysisHistoryEntry,
      });
    });

    it('sends postMessage when removing an entry', () => {
      service.removeAnalysisHistoryEntry(analysisHistoryEntry.analysisId);
      expect(mockChannel.postMessage).toHaveBeenCalledWith({
        type: 'remove',
        analysisId: analysisHistoryEntry.analysisId,
      });
    });

    it('adds entry received via BroadcastChannel', () => {
      mockChannel.simulateMessage({ type: 'add', analysisHistoryEntry: analysisHistoryEntry });
      expect(store.addAnalysisHistoryEntry).toHaveBeenCalledWith(analysisHistoryEntry);
    });

    it('removes entry received via BroadcastChannel', () => {
      mockChannel.simulateMessage({ type: 'remove', analysisId: analysisHistoryEntry.analysisId });
      expect(store.removeAnalysisHistoryEntry).toHaveBeenCalledWith(
        analysisHistoryEntry.analysisId,
      );
    });

    it('does nothing when the message type is not known', () => {
      mockChannel.simulateMessage({ type: 'unknown', analysisId: analysisHistoryEntry.analysisId });
      expect(store.addAnalysisHistoryEntry).not.toHaveBeenCalled();
      expect(store.removeAnalysisHistoryEntry).not.toHaveBeenCalled();
    });
  });
});
