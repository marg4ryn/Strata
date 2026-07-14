import { TestBed } from '@angular/core/testing';

import { StoreService } from './store.service';
import { LoggerService } from '@app/core/logging/logger.service';
import { AnalysisTarget, PendingAnalysis } from '../analysis-run.model';

describe('StoreService', () => {
  let store: StoreService;
  let logger: LoggerService;

  const target: AnalysisTarget = {
    targetURL: 'https://example.com',
    limitRange: false,
    range: null,
  };
  const pendingAnalysis: PendingAnalysis = {
    sessionId: '1',
    startedAt: 42,
    target: target,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(StoreService);
    logger = TestBed.inject(LoggerService);
  });

  describe('resetState', () => {
    it('should reset state', () => {
      store.pendingAnalysis.set(pendingAnalysis);
      store.progress.set('QUEUED');
      store.result.set('foo');
      store.error.set('bar');
      store.showModal.set(true);
      store.isBusy.set(true);

      store.resetState();

      expect(store.pendingAnalysis()).toBeNull();
      expect(store.progress()).toBeNull();
      expect(store.result()).toBeNull();
      expect(store.error()).toBeNull();
      expect(store.showModal()).toBeFalsy();
      expect(store.isBusy()).toBeFalsy();
    });

    it('should log on state reset', () => {
      const infoSpy = vi.spyOn(logger, 'info');
      store.resetState();
      expect(infoSpy).toHaveBeenCalled();
    });
  });

  describe('resetAnalysisState', () => {
    it('should reset analysis state', () => {
      store.pendingAnalysis.set(pendingAnalysis);
      store.progress.set('QUEUED');
      store.result.set('foo');
      store.error.set('bar');

      store.resetAnalysisState();

      expect(store.pendingAnalysis()).toBeNull();
      expect(store.progress()).toBeNull();
      expect(store.result()).toBeNull();
      expect(store.error()).toBeNull();
    });

    it('should omit non analysis data', () => {
      store.showModal.set(true);
      store.isBusy.set(true);
      store.resetAnalysisState();
      expect(store.showModal()).toBeTruthy();
      expect(store.isBusy()).toBeTruthy();
    });

    it('should log on analysis state reset', () => {
      const infoSpy = vi.spyOn(logger, 'info');
      store.resetAnalysisState();
      expect(infoSpy).toHaveBeenCalled();
    });
  });
});
