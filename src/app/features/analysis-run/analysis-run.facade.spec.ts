import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { AnalysisRunFacade } from './analysis-run.facade';
import { AnalysisRunStoreService } from './data-access/analysis-run-store/analysis-run-store.service';
import { AnalysisRunService } from './data-access/analysis-run/analysis-run.service';
import {
  AnalysisTargetFormModel,
  AnalysisStatusKey,
  PendingAnalysis,
  AnalysisTarget,
  ErrorType,
} from './analysis-run.model';

describe('AnalysisRunFacade', () => {
  let service: AnalysisRunFacade;

  let store: {
    pendingAnalysis: ReturnType<typeof signal<PendingAnalysis | null>>;
    progress: ReturnType<typeof signal<AnalysisStatusKey | null>>;
    error: ReturnType<typeof signal<string | null>>;
    errorType: ReturnType<typeof signal<ErrorType | null>>;
    isBusy: ReturnType<typeof signal<boolean>>;
    isAborting: ReturnType<typeof signal<boolean>>;
    showModal: ReturnType<typeof signal<boolean>>;
  };

  let analysisRunService: {
    tryToReconnect: ReturnType<typeof vi.fn>;
    startNewAnalysis: ReturnType<typeof vi.fn>;
    abortAnalysis: ReturnType<typeof vi.fn>;
    resumeAnalysis: ReturnType<typeof vi.fn>;
    retryAnalysis: ReturnType<typeof vi.fn>;
    cancelAnalysis: ReturnType<typeof vi.fn>;
    abandonAnalysis: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    store = {
      pendingAnalysis: signal(null),
      progress: signal(null),
      error: signal(null),
      errorType: signal(null),
      isBusy: signal(false),
      isAborting: signal(false),
      showModal: signal(false),
    };

    analysisRunService = {
      tryToReconnect: vi.fn(),
      startNewAnalysis: vi.fn(),
      abortAnalysis: vi.fn(),
      resumeAnalysis: vi.fn(),
      retryAnalysis: vi.fn(),
      cancelAnalysis: vi.fn(),
      abandonAnalysis: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AnalysisRunFacade,
        { provide: AnalysisRunStoreService, useValue: store },
        { provide: AnalysisRunService, useValue: analysisRunService },
      ],
    });
    service = TestBed.inject(AnalysisRunFacade);
  });

  it('updates computed signals', () => {
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
    store.isBusy.set(true);
    store.isAborting.set(true);
    store.showModal.set(true);
    store.progress.set('ANALYZING');
    store.error.set('Error');
    store.errorType.set('server');
    store.pendingAnalysis.set(pendingAnalysis);

    expect(service.isBusy()).toBeTruthy();
    expect(service.isAborting()).toBeTruthy();
    expect(service.showModal()).toBeTruthy();
    expect(service.progress()).toBe('ANALYZING');
    expect(service.error()).toBe('Error');
    expect(service.errorType()).toBe('server');
    expect(service.pendingAnalysis()).toBe(pendingAnalysis);
  });

  it('handles startNewAnalysis with formData', () => {
    const data = {
      targetURL: 'https://example.com/Project.git',
      limitRange: false,
      startDate: null,
      endDate: null,
    } as AnalysisTargetFormModel;

    service.startNewAnalysis(data);
    expect(analysisRunService.startNewAnalysis).toHaveBeenCalledWith(data);
  });

  it('handles tryToReconnect', () => {
    service.tryToReconnect();
    expect(analysisRunService.tryToReconnect).toHaveBeenCalledOnce();
  });

  it('handles resumeAnalysis', () => {
    service.resumeAnalysis();
    expect(analysisRunService.resumeAnalysis).toHaveBeenCalledOnce();
  });

  it('handles retryAnalysis', () => {
    service.retryAnalysis();
    expect(analysisRunService.retryAnalysis).toHaveBeenCalledOnce();
  });

  it('handles cancelAnalysis', () => {
    service.cancelAnalysis();
    expect(analysisRunService.cancelAnalysis).toHaveBeenCalledOnce();
  });

  it('handles abandonAnalysis', () => {
    service.abandonAnalysis();
    expect(analysisRunService.abandonAnalysis).toHaveBeenCalledOnce();
  });

  it('handles abortAnalysis', () => {
    service.abortAnalysis();
    expect(analysisRunService.abortAnalysis).toHaveBeenCalledOnce();
  });
});
