import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { AnalysisRunFacade } from './analysis-run.facade';
import { StoreService } from './data-access/store/store.service';
import { OrchestratorService } from './data-access/orchestrator/orchestrator.service';
import {
  AnalysisTargetFormModel,
  AnalysisStatusKey,
  PendingAnalysis,
  AnalysisTarget,
} from './analysis-run.model';

describe('AnalysisRunFacade', () => {
  let service: AnalysisRunFacade;

  let store: {
    pendingAnalysis: ReturnType<typeof signal<PendingAnalysis | null>>;
    progress: ReturnType<typeof signal<AnalysisStatusKey | null>>;
    error: ReturnType<typeof signal<string | null>>;
    isBusy: ReturnType<typeof signal<boolean>>;
    showModal: ReturnType<typeof signal<boolean>>;
  };

  let orchestrator: {
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
      isBusy: signal(false),
      showModal: signal(false),
    };

    orchestrator = {
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
        { provide: StoreService, useValue: store },
        { provide: OrchestratorService, useValue: orchestrator },
      ],
    });
    service = TestBed.inject(AnalysisRunFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update computed signals', () => {
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
    store.isBusy.set(true);
    store.showModal.set(true);
    store.progress.set('ANALYZING');
    store.error.set('Error');
    store.pendingAnalysis.set(pendingAnalysis);

    expect(service.isBusy()).toBeTruthy();
    expect(service.showModal()).toBeTruthy();
    expect(service.progress()).toBe('ANALYZING');
    expect(service.error()).toBe('Error');
    expect(service.pendingAnalysis()).toBe(pendingAnalysis);
  });

  it('should handle startNewAnalysis with formData', () => {
    const data = {
      targetURL: 'https://example.com',
      limitRange: false,
      startDate: null,
      endDate: null,
    } as AnalysisTargetFormModel;

    service.startNewAnalysis(data);
    expect(orchestrator.startNewAnalysis).toHaveBeenCalledWith(data);
  });

  it('should handle tryToReconnect', () => {
    service.tryToReconnect();
    expect(orchestrator.tryToReconnect).toHaveBeenCalledOnce();
  });

  it('should handle resumeAnalysis', () => {
    service.resumeAnalysis();
    expect(orchestrator.resumeAnalysis).toHaveBeenCalledOnce();
  });

  it('should handle retryAnalysis', () => {
    service.retryAnalysis();
    expect(orchestrator.retryAnalysis).toHaveBeenCalledOnce();
  });

  it('should handle cancelAnalysis', () => {
    service.cancelAnalysis();
    expect(orchestrator.cancelAnalysis).toHaveBeenCalledOnce();
  });

  it('should handle abandonAnalysis', () => {
    service.abandonAnalysis();
    expect(orchestrator.abandonAnalysis).toHaveBeenCalledOnce();
  });

  it('should handle abortAnalysis', () => {
    service.abortAnalysis();
    expect(orchestrator.abortAnalysis).toHaveBeenCalledOnce();
  });
});
