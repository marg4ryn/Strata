import { TestBed } from '@angular/core/testing';
import { MockService } from 'ng-mocks';

import { LoggerService } from '@app/core/logging/logger/logger.service';
import { ContextLogger } from '@app/core/logging/context-logger/context-logger';
import { AnalysisRunStoreService } from './analysis-run-store.service';
import { AnalysisTarget, PendingAnalysis } from '../../analysis-run.model';

describe('AnalysisRunStoreService', () => {
  let service: AnalysisRunStoreService;
  let logger: ReturnType<typeof MockService<ContextLogger>>;

  beforeEach(() => {
    logger = MockService(ContextLogger);

    const loggerService = MockService(LoggerService, {
      withContext: () => logger,
    });

    TestBed.configureTestingModule({
      providers: [{ provide: LoggerService, useValue: loggerService }],
    });

    service = TestBed.inject(AnalysisRunStoreService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  describe('resetState', () => {
    it('resets state', () => {
      service.pendingAnalysis.set(pendingAnalysis);
      service.progress.set('QUEUED');
      service.result.set('foo');
      service.error.set('bar');
      service.errorType.set('server');
      service.showModal.set(true);
      service.isBusy.set(true);
      service.isAborting.set(true);

      service.resetState();

      expect(service.pendingAnalysis()).toBeNull();
      expect(service.progress()).toBeNull();
      expect(service.result()).toBeNull();
      expect(service.error()).toBeNull();
      expect(service.errorType()).toBeNull();
      expect(service.showModal()).toBeFalsy();
      expect(service.isBusy()).toBeFalsy();
      expect(service.isAborting()).toBeFalsy();
    });

    it('logs on state reset', () => {
      service.resetState();
      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe('resetAnalysisState', () => {
    it('resets analysis state', () => {
      service.pendingAnalysis.set(pendingAnalysis);
      service.progress.set('QUEUED');
      service.result.set('foo');
      service.error.set('bar');
      service.errorType.set('server');

      service.resetAnalysisState();

      expect(service.pendingAnalysis()).toBeNull();
      expect(service.progress()).toBeNull();
      expect(service.result()).toBeNull();
      expect(service.error()).toBeNull();
      expect(service.errorType()).toBeNull();
    });

    it('omits non analysis data', () => {
      service.showModal.set(true);
      service.isBusy.set(true);
      service.isAborting.set(true);

      service.resetAnalysisState();

      expect(service.showModal()).toBeTruthy();
      expect(service.isBusy()).toBeTruthy();
      expect(service.isAborting()).toBeTruthy();
    });

    it('logs on analysis state reset', () => {
      service.resetAnalysisState();
      expect(logger.info).toHaveBeenCalled();
    });
  });
});
