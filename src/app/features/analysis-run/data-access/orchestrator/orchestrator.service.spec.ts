import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { LoggerService } from '@app/core/logging/logger.service';
import { OrchestratorService } from './orchestrator.service';
import {
  AnalysisStatusKey,
  PendingAnalysis,
  AnalysisTargetFormModel,
  AnalysisTarget,
  DateRange,
} from '../../analysis-run.model';
import { StoreService } from '../store/store.service';
import { StorageService } from '../storage/storage.service';
import { WebSocketService } from '../web-socket/web-socket.service';
import { LockService } from '../lock/lock.service';

describe('OrchestratorService', () => {
  let service: OrchestratorService;
  let logger: Partial<LoggerService>;

  let store: {
    pendingAnalysis: ReturnType<typeof signal<PendingAnalysis | null>>;
    progress: ReturnType<typeof signal<AnalysisStatusKey | null>>;
    result: ReturnType<typeof signal<string | null>>;
    error: ReturnType<typeof signal<string | null>>;
    isBusy: ReturnType<typeof signal<boolean>>;
    showModal: ReturnType<typeof signal<boolean>>;
    resetAnalysisState: ReturnType<typeof vi.fn>;
    resetState: ReturnType<typeof vi.fn>;
  };

  let storage: {
    saveSessionId: ReturnType<typeof vi.fn>;
    savePendingAnalysis: ReturnType<typeof vi.fn>;
    getSessionId: ReturnType<typeof vi.fn>;
    getPendingAnalyses: ReturnType<typeof vi.fn>;
    deleteSessionId: ReturnType<typeof vi.fn>;
    deletePendingAnalysis: ReturnType<typeof vi.fn>;
  };

  let websocket: {
    connect: ReturnType<typeof vi.fn>;
    abort: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  };

  let locker: {
    lock: ReturnType<typeof vi.fn>;
    unlock: ReturnType<typeof vi.fn>;
  };

  const sessionId = '123';

  beforeEach(() => {
    store = {
      pendingAnalysis: signal(null),
      progress: signal(null),
      result: signal(null),
      error: signal(null),
      isBusy: signal(false),
      showModal: signal(false),
      resetAnalysisState: vi.fn(),
      resetState: vi.fn(),
    };

    storage = {
      saveSessionId: vi.fn(),
      savePendingAnalysis: vi.fn(),
      getSessionId: vi.fn(),
      getPendingAnalyses: vi.fn(),
      deleteSessionId: vi.fn(),
      deletePendingAnalysis: vi.fn(),
    };

    websocket = {
      connect: vi.fn(),
      abort: vi.fn(),
      disconnect: vi.fn(),
    };

    locker = {
      lock: vi.fn(),
      unlock: vi.fn(),
    };

    logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: StoreService, useValue: store },
        { provide: StorageService, useValue: storage },
        { provide: WebSocketService, useValue: websocket },
        { provide: LockService, useValue: locker },
        { provide: LoggerService, useValue: logger },
      ],
    });

    service = TestBed.inject(OrchestratorService);
    store.pendingAnalysis.set({ sessionId: sessionId } as unknown as PendingAnalysis);
  });

  describe('effect', () => {
    it('handles result change', () => {
      const clearDataSpy = vi.spyOn(service, 'clearData');

      store.result.set('123');
      TestBed.tick();

      expect(clearDataSpy).toHaveBeenCalledOnce();
      expect(logger.info).toHaveBeenCalledWith('Orchestrator handled the analysis results');
    });

    it('handles error change', () => {
      store.error.set('Error');
      TestBed.tick();
      expect(logger.info).toHaveBeenCalledWith('Orchestrator handled an analysis error');
    });
  });

  describe('tryToReconnect', () => {
    it('returns when there is an ongoing analysis', async () => {
      store.isBusy.set(true);

      await service.tryToReconnect();

      expect(logger.debug).toHaveBeenCalledWith(
        'Orchestrator is trying to reconnect to an ongoing analysis',
      );
      expect(logger.debug).toHaveBeenCalledWith('Orchestrator found an ongoing analysis');
      expect(store.resetState).not.toHaveBeenCalled();
    });

    it('calls tryToResumeAnalysis when no analysis was processed in this tab', async () => {
      const resumeAnalysisSpy = vi
        .spyOn(service, 'tryToResumeAnalysis')
        .mockImplementation(async () => {});
      storage.getSessionId.mockReturnValue(null);
      store.isBusy.set(false);

      await service.tryToReconnect();

      expect(logger.debug).toHaveBeenCalledWith('Orchestrator did not found an ongoing analysis');
      expect(storage.getSessionId).toHaveBeenCalledOnce();
      expect(resumeAnalysisSpy).toHaveBeenCalledOnce();
    });

    it('calls tryToResumeAnalysis when other tab took over analysis', async () => {
      const resumeAnalysisSpy = vi
        .spyOn(service, 'tryToResumeAnalysis')
        .mockImplementation(async () => {});
      storage.getSessionId.mockReturnValue(sessionId);
      store.isBusy.set(false);
      locker.lock.mockReturnValue(false);

      await service.tryToReconnect();

      expect(logger.debug).toHaveBeenCalledWith(
        'Orchestrator found an ongoing analysis, but another card took over',
      );
      expect(locker.lock).toHaveBeenCalledWith(sessionId);
      expect(storage.deleteSessionId).toHaveBeenCalledOnce();
      expect(resumeAnalysisSpy).toHaveBeenCalledOnce();
    });

    it('calls tryToResumeAnalysis when other tab finished analysis', async () => {
      const resumeAnalysisSpy = vi
        .spyOn(service, 'tryToResumeAnalysis')
        .mockImplementation(async () => {});
      storage.getSessionId.mockReturnValue(sessionId);
      store.isBusy.set(false);
      locker.lock.mockReturnValue(true);
      storage.getPendingAnalyses.mockReturnValue(null);

      await service.tryToReconnect();

      expect(logger.debug).toHaveBeenCalledWith(
        'Orchestrator found an ongoing analysis, but another card took over',
      );
      expect(storage.getPendingAnalyses).toHaveBeenCalledOnce();
      expect(storage.deleteSessionId).toHaveBeenCalledOnce();
      expect(locker.unlock).toHaveBeenCalledWith(sessionId);
      expect(resumeAnalysisSpy).toHaveBeenCalledOnce();
    });

    it('reconnects to unfinished analysis', async () => {
      storage.getSessionId.mockReturnValue(sessionId);
      store.isBusy.set(false);
      locker.lock.mockReturnValue(true);
      const pendingAnalysis = { sessionId: sessionId } as PendingAnalysis;
      storage.getPendingAnalyses.mockReturnValue([pendingAnalysis]);

      await service.tryToReconnect();

      expect(logger.info).toHaveBeenCalledWith('Orchestrator reconnected to an ongoing analysis');
      expect(store.pendingAnalysis()).toBe(pendingAnalysis);
      expect(websocket.connect).toHaveBeenCalledWith({ sessionId: sessionId });
    });
  });

  describe('tryToResumeAnalysis', () => {
    it('hides modal when there is no pending analysis', async () => {
      storage.getPendingAnalyses.mockReturnValue(null);

      await service.tryToResumeAnalysis();

      expect(logger.debug).toHaveBeenCalledWith(
        'Orchestrator is trying to resume any pending analysis',
      );
      expect(logger.debug).toHaveBeenCalledWith('Orchestrator did not found any pending analysis');
      expect(storage.getPendingAnalyses).toHaveBeenCalledOnce();
      expect(store.showModal()).toBeFalsy();
    });

    it('returns when the only pending analysis is taken', async () => {
      const pendingAnalysis = { sessionId: sessionId } as PendingAnalysis;
      storage.getPendingAnalyses.mockReturnValue([pendingAnalysis]);
      locker.lock.mockReturnValue(false);

      await service.tryToResumeAnalysis();

      expect(logger.debug).toHaveBeenCalledWith(
        `Orchestrator is trying to take over the analysis with sessionId: ${sessionId}`,
      );
      expect(logger.debug).toHaveBeenCalledWith(
        `Orchestrator could not take over the analysis with sessionId: ${sessionId} - analysis belongs to another tab`,
      );
      expect(locker.lock).toHaveBeenCalledWith(sessionId);
    });

    it('returns when the only pending analysis was finished in this moment', async () => {
      const pendingAnalysis = { sessionId: sessionId } as PendingAnalysis;
      storage.getPendingAnalyses.mockReturnValueOnce([pendingAnalysis]);
      locker.lock.mockReturnValue(true);
      storage.getPendingAnalyses.mockReturnValueOnce(null);

      await service.tryToResumeAnalysis();

      expect(logger.debug).toHaveBeenCalledWith(
        `Orchestrator could not take over the analysis with sessionId: ${sessionId} - analysis belongs to another tab`,
      );
      expect(locker.unlock).toHaveBeenCalledWith(sessionId);
    });

    it('shows modal when successfully locked an unfinished analysis', async () => {
      const pendingAnalysis = { sessionId: sessionId } as PendingAnalysis;
      storage.getPendingAnalyses.mockReturnValue([pendingAnalysis]);
      locker.lock.mockReturnValue(true);

      await service.tryToResumeAnalysis();

      expect(logger.info).toHaveBeenCalledWith(
        `Orchestrator found an unfinished analysis with sessionId: ${sessionId}`,
      );
      expect(store.pendingAnalysis()).toBe(pendingAnalysis);
      expect(store.showModal()).toBeTruthy();
    });

    it('shows modal when successfully locked an unfinished analysis despite there are more analyses', async () => {
      const pendingAnalysis = { sessionId: sessionId } as PendingAnalysis;
      const secondAnalysis = { sessionId: '124' } as PendingAnalysis;
      storage.getPendingAnalyses.mockReturnValue([pendingAnalysis, secondAnalysis]);
      locker.lock.mockReturnValueOnce(false);
      locker.lock.mockReturnValueOnce(true);

      await service.tryToResumeAnalysis();

      expect(logger.info).toHaveBeenCalledWith(
        `Orchestrator found an unfinished analysis with sessionId: 124`,
      );
      expect(store.pendingAnalysis()).toBe(secondAnalysis);
      expect(store.showModal()).toBeTruthy();
    });

    it('locks first available analysis', async () => {
      const pendingAnalysis = { sessionId: sessionId } as PendingAnalysis;
      const secondAnalysis = { sessionId: '124' } as PendingAnalysis;
      storage.getPendingAnalyses.mockReturnValue([pendingAnalysis, secondAnalysis]);
      locker.lock.mockReturnValueOnce(true);
      locker.lock.mockReturnValueOnce(false);

      await service.tryToResumeAnalysis();

      expect(logger.info).toHaveBeenCalledWith(
        `Orchestrator found an unfinished analysis with sessionId: ${sessionId}`,
      );
      expect(store.pendingAnalysis()).toBe(pendingAnalysis);
      expect(store.showModal()).toBeTruthy();
    });
  });

  it('starts new analysis', async () => {
    const constructAnalysisSpy = vi.spyOn(service, 'constructPendingAnalysis');
    const constructParamsSpy = vi.spyOn(service, 'constructConnectionParams');

    const formData: AnalysisTargetFormModel = {
      targetURL: 'https://example.com/Project.git',
      limitRange: true,
      startDate: new Date('2000-01-01'),
      endDate: new Date('2000-06-01'),
    };

    await service.startNewAnalysis(formData);

    expect(logger.info).toHaveBeenCalledWith(
      'Orchestrator received data to create a new analysis: ',
      formData,
    );
    expect(constructAnalysisSpy).toHaveBeenCalledOnce();
    expect(constructParamsSpy).toHaveBeenCalledOnce();
    expect(locker.lock).toHaveBeenCalledOnce();
    expect(storage.savePendingAnalysis).toHaveBeenCalledOnce();
    expect(storage.saveSessionId).toHaveBeenCalledOnce();
    expect(websocket.connect).toHaveBeenCalledOnce();
  });

  it('resumes analysis', () => {
    service.resumeAnalysis();

    expect(store.showModal()).toBeFalsy();
    expect(storage.saveSessionId).toHaveBeenCalledWith(sessionId);
    expect(websocket.connect).toHaveBeenCalledWith({ sessionId: sessionId });
    expect(logger.info).toHaveBeenCalledWith(
      `Orchestrator received a request to resume analysis with sessionId: ${sessionId}`,
    );
  });

  it('abandons analysis', async () => {
    const clearDataSpy = vi.spyOn(service, 'clearData');
    const resumeAnalysisSpy = vi.spyOn(service, 'tryToResumeAnalysis');

    await service.abandonAnalysis();

    expect(logger.info).toHaveBeenCalledWith(
      `Orchestrator received a request to abandon analysis with sessionId: ${sessionId}`,
    );
    expect(clearDataSpy).toHaveBeenCalledOnce();
    expect(resumeAnalysisSpy).toHaveBeenCalledOnce();
  });

  it('aborts analysis', async () => {
    const clearDataSpy = vi.spyOn(service, 'clearData');

    await service.abortAnalysis();

    expect(websocket.abort).toHaveBeenCalledOnce();
    expect(logger.info).toHaveBeenCalledWith(
      `Orchestrator received a request to abort analysis with sessionId: ${sessionId}`,
    );
    expect(clearDataSpy).toHaveBeenCalledOnce();
  });

  it('retries analysis', () => {
    store.error.set('Error');

    service.retryAnalysis();

    expect(store.error()).toBeNull();
    expect(websocket.connect).toHaveBeenCalledWith({ sessionId: sessionId });
    expect(logger.info).toHaveBeenCalledWith(
      `Orchestrator received a request to retry analysis with sessionId: ${sessionId}`,
    );
  });

  it('cancels analysis', async () => {
    const clearDataSpy = vi.spyOn(service, 'clearData');
    store.error.set('Error');

    await service.cancelAnalysis();

    expect(store.error()).toBeNull();
    expect(logger.info).toHaveBeenCalledWith(
      `Orchestrator received a request to cancel analysis with sessionId: ${sessionId}`,
    );
    expect(clearDataSpy).toHaveBeenCalledOnce();
  });

  it('clears data', async () => {
    await service.clearData();

    expect(storage.deleteSessionId).toHaveBeenCalledOnce();
    expect(storage.deletePendingAnalysis).toHaveBeenCalledWith(sessionId);
    expect(locker.unlock).toHaveBeenCalledWith(sessionId);
    expect(store.resetAnalysisState).toHaveBeenCalledOnce();
    expect(logger.info).toHaveBeenCalledWith(
      `Orchestrator deleted data of analysis with sessionId: ${sessionId}`,
    );
  });

  describe('constructPendingAnalysis', () => {
    it('constructs pending analysis with date range', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01'));

      const formData: AnalysisTargetFormModel = {
        targetURL: 'https://example.com/Project.git',
        limitRange: true,
        startDate: new Date('2000-01-01'),
        endDate: new Date('2000-06-01'),
      };

      const result = service.constructPendingAnalysis(formData);

      expect(result).toMatchObject({
        sessionId: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        ),
        startedAt: Date.now(),
        target: {
          targetURL: formData.targetURL,
          limitRange: formData.limitRange,
          range: {
            startDate: formData.startDate!.toISOString().split('T')[0],
            endDate: formData.endDate!.toISOString().split('T')[0],
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          } as DateRange,
        } as AnalysisTarget,
      } as PendingAnalysis);

      vi.useRealTimers();
    });

    it('constructs pending analysis without date range', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01'));

      const formData: AnalysisTargetFormModel = {
        targetURL: 'https://example.com/Project.git',
        limitRange: false,
        startDate: null,
        endDate: null,
      };

      const result = service.constructPendingAnalysis(formData);

      expect(result).toMatchObject({
        sessionId: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        ),
        startedAt: Date.now(),
        target: {
          targetURL: formData.targetURL,
          limitRange: formData.limitRange,
          range: null,
        } as AnalysisTarget,
      } as PendingAnalysis);

      vi.useRealTimers();
    });
  });

  describe('constructConnectionParams', () => {
    it('constructs connection params with date range', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01'));

      const analysis: PendingAnalysis = {
        sessionId: '123',
        startedAt: Date.now(),
        target: {
          targetURL: 'https://example.com/Project.git',
          limitRange: true,
          range: {
            startDate: '2000-01-01',
            endDate: '2000-06-01',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        },
      };

      const result = service.constructConnectionParams(analysis);

      expect(result).toMatchObject({
        sessionId: analysis.sessionId,
        repositoryUrl: analysis.target.targetURL,
        startDate: analysis.target.range?.startDate,
        endDate: analysis.target.range?.endDate,
        timezone: analysis.target.range?.timezone,
      });

      vi.useRealTimers();
    });

    it('constructs connection params without date range', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01'));

      const analysis: PendingAnalysis = {
        sessionId: '123',
        startedAt: Date.now(),
        target: {
          targetURL: 'https://example.com/Project.git',
          limitRange: false,
          range: null,
        },
      };

      const result = service.constructConnectionParams(analysis);

      expect(result).toMatchObject({
        sessionId: analysis.sessionId,
        repositoryUrl: analysis.target.targetURL,
      });

      vi.useRealTimers();
    });
  });
});
