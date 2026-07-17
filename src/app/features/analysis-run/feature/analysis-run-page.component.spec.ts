import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { AnalysisRunPage } from './analysis-run-page.component';
import { AnalysisRunFacade } from '../data-access/facade/analysis-run.facade';
import {
  AnalysisStatus,
  AnalysisStatusKey,
  PendingAnalysis,
} from '../data-access/analysis-run.model';

describe('AnalysisRunPage', () => {
  let component: AnalysisRunPage;
  let fixture: ComponentFixture<AnalysisRunPage>;
  let facade: {
    pendingAnalysis: ReturnType<typeof signal<PendingAnalysis | null>>;
    progress: ReturnType<typeof signal<AnalysisStatusKey | null>>;
    error: ReturnType<typeof signal<string | null>>;
    isBusy: ReturnType<typeof signal<boolean>>;
    showModal: ReturnType<typeof signal<boolean>>;
    tryToReconnect: ReturnType<typeof vi.fn>;
    startNewAnalysis: ReturnType<typeof vi.fn>;
    abortAnalysis: ReturnType<typeof vi.fn>;
    resumeAnalysis: ReturnType<typeof vi.fn>;
    retryAnalysis: ReturnType<typeof vi.fn>;
    cancelAnalysis: ReturnType<typeof vi.fn>;
    abandonAnalysis: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    facade = {
      pendingAnalysis: signal(null),
      progress: signal(null),
      error: signal(null),
      isBusy: signal(false),
      showModal: signal(false),
      tryToReconnect: vi.fn(),
      startNewAnalysis: vi.fn(),
      abortAnalysis: vi.fn(),
      resumeAnalysis: vi.fn(),
      retryAnalysis: vi.fn(),
      cancelAnalysis: vi.fn(),
      abandonAnalysis: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AnalysisRunPage],
      providers: [{ provide: AnalysisRunFacade, useValue: facade }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisRunPage);
    component = fixture.componentInstance;
  });

  function query<T = HTMLElement>(selector: string): T | null {
    return fixture.nativeElement.querySelector(selector);
  }

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should call tryToReconnect on init', () => {
    fixture.detectChanges();
    expect(facade.tryToReconnect).toHaveBeenCalledOnce();
  });

  describe('conditional rendering', () => {
    it('shows error modal when error is set', () => {
      facade.error.set('Server error');
      fixture.detectChanges();

      expect(query('app-analysis-error-modal')).toBeTruthy();
      expect(query('app-analysis-progress-spinner')).toBeNull();
      expect(query('app-analysis-unfinished-modal')).toBeNull();
      expect(query('app-analysis-target-form')).toBeNull();
    });

    it('prioritizes error modal over unfinished modal', () => {
      facade.showModal.set(true);
      facade.error.set('Server error');
      fixture.detectChanges();

      expect(query('app-analysis-error-modal')).toBeTruthy();
      expect(query('app-analysis-unfinished-modal')).toBeNull();
    });

    it('shows spinner when isBusy is true and no error', () => {
      facade.isBusy.set(true);
      fixture.detectChanges();

      expect(query('app-analysis-error-modal')).toBeNull();
      expect(query('app-analysis-progress-spinner')).toBeTruthy();
      expect(query('app-analysis-unfinished-modal')).toBeNull();
      expect(query('app-analysis-target-form')).toBeNull();
    });

    it('shows unfinished modal when showModal is true', () => {
      facade.showModal.set(true);
      fixture.detectChanges();

      expect(query('app-analysis-error-modal')).toBeNull();
      expect(query('app-analysis-progress-spinner')).toBeNull();
      expect(query('app-analysis-unfinished-modal')).toBeTruthy();
      expect(query('app-analysis-target-form')).toBeNull();
    });

    it('shows target form by default', () => {
      fixture.detectChanges();

      expect(query('app-analysis-error-modal')).toBeNull();
      expect(query('app-analysis-progress-spinner')).toBeNull();
      expect(query('app-analysis-unfinished-modal')).toBeNull();
      expect(query('app-analysis-target-form')).toBeTruthy();
    });
  });

  describe('event handling via real child components', () => {
    it('should call retryAnalysis when retry button in error modal is clicked', () => {
      facade.error.set('Server error');
      fixture.detectChanges();

      const buttons = query<HTMLElement>('app-analysis-error-modal')!.querySelectorAll('button');
      const retryButton = buttons[1] as HTMLButtonElement;
      retryButton.click();

      expect(facade.retryAnalysis).toHaveBeenCalledOnce();
    });

    it('should call cancelAnalysis when cancel button in error modal is clicked', () => {
      facade.error.set('Server error');
      fixture.detectChanges();

      const buttons = query<HTMLElement>('app-analysis-error-modal')!.querySelectorAll('button');
      const cancelButton = buttons[0] as HTMLButtonElement;
      cancelButton.click();

      expect(facade.cancelAnalysis).toHaveBeenCalledOnce();
    });

    it('should call resumeAnalysis when resume button in unfinished modal is clicked', () => {
      facade.showModal.set(true);
      fixture.detectChanges();

      const buttons = query<HTMLElement>('app-analysis-unfinished-modal')!.querySelectorAll(
        'button',
      );
      const resumeButton = buttons[1] as HTMLButtonElement;
      resumeButton.click();

      expect(facade.resumeAnalysis).toHaveBeenCalledOnce();
    });

    it('should call abandonAnalysis after confirming abandon in unfinished modal', () => {
      facade.showModal.set(true);
      fixture.detectChanges();

      const unfinishedModal = query<HTMLElement>('app-analysis-unfinished-modal')!;
      const abandonButton = unfinishedModal.querySelectorAll('button')[0] as HTMLButtonElement;
      abandonButton.click();
      fixture.detectChanges();

      const confirmModal = fixture.nativeElement.querySelector('app-confirm-operation-modal');
      expect(confirmModal).toBeTruthy();

      const confirmButton = confirmModal!.querySelectorAll('button')[1] as HTMLButtonElement;
      confirmButton.click();
      fixture.detectChanges();

      expect(facade.abandonAnalysis).toHaveBeenCalledOnce();
    });

    it('should call abortAnalysis when spinner emits abort', () => {
      facade.isBusy.set(true);
      fixture.detectChanges();

      const abortButton = query<HTMLElement>('app-analysis-progress-spinner')!.querySelector(
        'button',
      );
      (abortButton as HTMLButtonElement).click();
      fixture.detectChanges();

      const confirmButton = query<HTMLElement>('app-confirm-operation-modal')!.querySelectorAll(
        'button',
      )[1];
      (confirmButton as HTMLButtonElement).click();

      expect(facade.abortAnalysis).toHaveBeenCalledOnce();
    });

    it('should call startNewAnalysis when target form is submitted', () => {
      fixture.detectChanges();

      const urlInput = query<HTMLInputElement>('#analysisTargetURL')!;
      urlInput.value = 'https://example.com';
      urlInput.dispatchEvent(new Event('input'));
      urlInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      const form = query<HTMLFormElement>('app-analysis-target-form form');
      form?.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      expect(facade.startNewAnalysis).toHaveBeenCalled();
    });
  });

  describe('label computed', () => {
    it('shows "Connecting..." when progress is null', () => {
      fixture.detectChanges();
      expect(component.debouncedLabel.value()).toBe('Connecting...');
    });

    it('does not update debounced label before 800ms', async () => {
      vi.useFakeTimers();
      fixture.detectChanges();
      facade.progress.set('ANALYZING');
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(799);
      fixture.detectChanges();

      expect(component.debouncedLabel.value()).toBe(`Connecting...`);
      vi.useRealTimers();
    });

    it('updates debounced label after 800ms', async () => {
      vi.useFakeTimers();
      fixture.detectChanges();
      facade.progress.set('ANALYZING');
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(800);
      fixture.detectChanges();

      expect(component.debouncedLabel.value()).toBe(`${AnalysisStatus.ANALYZING}...`);
      vi.useRealTimers();
    });
  });
});
