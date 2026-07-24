import { TestBed } from '@angular/core/testing';

import { LoggerService } from '@app/core/logging/logger.service';
import { StoreService } from './store.service';
import { AnalysisTarget, PendingAnalysis } from '../../analysis-run.model';

describe('StoreService', () => {
  let store: StoreService;
  let logger: Partial<LoggerService>;

  const target: AnalysisTarget = {
    targetURL: 'https://example.com/Project.git',
    limitRange: false,
    range: null,
  };
  const pendingAnalysis: PendingAnalysis = {
    sessionId: '1',
    startedAt: 42,
    target: target,
  };

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

    store = TestBed.inject(StoreService);
  });

  describe('resetState', () => {
    it('resets state', () => {
      store.pendingAnalysis.set(pendingAnalysis);
      store.progress.set('QUEUED');
      store.result.set('foo');
      store.error.set('bar');
      store.errorType.set('server');
      store.showModal.set(true);
      store.isBusy.set(true);

      store.resetState();

      expect(store.pendingAnalysis()).toBeNull();
      expect(store.progress()).toBeNull();
      expect(store.result()).toBeNull();
      expect(store.error()).toBeNull();
      expect(store.errorType()).toBeNull();
      expect(store.showModal()).toBeFalsy();
      expect(store.isBusy()).toBeFalsy();
    });

    it('logs on state reset', () => {
      store.resetState();
      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe('resetAnalysisState', () => {
    it('resets analysis state', () => {
      store.pendingAnalysis.set(pendingAnalysis);
      store.progress.set('QUEUED');
      store.result.set('foo');
      store.error.set('bar');
      store.errorType.set('server');

      store.resetAnalysisState();

      expect(store.pendingAnalysis()).toBeNull();
      expect(store.progress()).toBeNull();
      expect(store.result()).toBeNull();
      expect(store.error()).toBeNull();
      expect(store.errorType()).toBeNull();
    });

    it('omits non analysis data', () => {
      store.showModal.set(true);
      store.isBusy.set(true);
      store.resetAnalysisState();
      expect(store.showModal()).toBeTruthy();
      expect(store.isBusy()).toBeTruthy();
    });

    it('logs on analysis state reset', () => {
      store.resetAnalysisState();
      expect(logger.info).toHaveBeenCalled();
    });
  });
});
