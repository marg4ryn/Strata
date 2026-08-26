import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { ConfirmOperationModalService } from '@app/shared/confirm-operation-modal/service/confirm-operation-modal.service';
import { AnalysisHistoryPanelComponent } from './analysis-history-panel.component';
import { AnalysisHistoryFacade } from '../analysis-history.facade';
import { AnalysisHistoryEntry } from '../analysis-history.model';

describe('AnalysisHistoryPanelComponent', () => {
  let component: AnalysisHistoryPanelComponent;
  let fixture: ComponentFixture<AnalysisHistoryPanelComponent>;
  let facade: {
    analysisHistory: ReturnType<typeof signal<AnalysisHistoryEntry[]>>;
    closePanel: ReturnType<typeof vi.fn>;
    loadAnalysis: ReturnType<typeof vi.fn>;
    removeAnalysisHistoryEntry: ReturnType<typeof vi.fn>;
  };
  let confirmModal: { confirm: ReturnType<typeof vi.fn> };

  const makeEntry = (id: string): AnalysisHistoryEntry =>
    ({
      analysisId: id,
      completedAt: 42,
      target: { targetURL: `https://github.com/owner/${id}.git`, limitRange: false, range: null },
    }) as AnalysisHistoryEntry;

  beforeEach(async () => {
    facade = {
      analysisHistory: signal<AnalysisHistoryEntry[]>([]),
      closePanel: vi.fn(),
      loadAnalysis: vi.fn(),
      removeAnalysisHistoryEntry: vi.fn(),
    };
    confirmModal = { confirm: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AnalysisHistoryPanelComponent, getTranslocoModule()],
      providers: [
        { provide: AnalysisHistoryFacade, useValue: facade },
        { provide: ConfirmOperationModalService, useValue: confirmModal },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisHistoryPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  describe('empty state', () => {
    it('shows empty message when analysisHistory is empty array', () => {
      const empty = fixture.nativeElement.querySelector('.history-panel__empty');
      expect(empty).not.toBeNull();
      expect(empty.textContent).toContain('Analysis history is empty');
    });

    it('renders no app-analysis-history-item when empty', () => {
      const items = fixture.nativeElement.querySelectorAll('app-analysis-history-item');
      expect(items.length).toBe(0);
    });
  });

  describe('populated list', () => {
    beforeEach(async () => {
      facade.analysisHistory.set([makeEntry('item1'), makeEntry('item2')]);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('does not show empty message', () => {
      expect(fixture.nativeElement.querySelector('.history-panel__empty')).toBeNull();
    });

    it('renders an app-analysis-history-item for each entry', () => {
      const items = fixture.nativeElement.querySelectorAll('app-analysis-history-item');
      expect(items.length).toBe(2);
    });
  });

  describe('close button', () => {
    it('calls facade.closePanel() when clicked', () => {
      const closeBtn = fixture.nativeElement.querySelector('.history-panel__close');
      closeBtn.click();
      expect(facade.closePanel).toHaveBeenCalledOnce();
    });
  });

  describe('real AnalysisHistoryItem integration', () => {
    beforeEach(async () => {
      facade.analysisHistory.set([makeEntry('item1')]);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('calls facade.removeAnalysisHistoryEntry with analysisId when item emits remove', async () => {
      confirmModal.confirm.mockResolvedValue(true);

      const deleteBtn = fixture.nativeElement.querySelector(
        'app-analysis-history-item .history-item__delete',
      );
      deleteBtn.click();
      await fixture.whenStable();

      expect(confirmModal.confirm).toHaveBeenCalled();
      expect(facade.removeAnalysisHistoryEntry).toHaveBeenCalledWith('item1');
    });

    it('does not call facade.removeAnalysisHistoryEntry when deletion is cancelled', async () => {
      confirmModal.confirm.mockResolvedValue(false);

      const deleteBtn = fixture.nativeElement.querySelector(
        'app-analysis-history-item .history-item__delete',
      );
      deleteBtn.click();
      await fixture.whenStable();

      expect(facade.removeAnalysisHistoryEntry).not.toHaveBeenCalled();
    });

    it('calls loadAnalysis when item emits load', async () => {
      confirmModal.confirm.mockResolvedValue(true);

      const itemHost = fixture.nativeElement.querySelector('.history-item');
      itemHost.click();
      await fixture.whenStable();

      expect(confirmModal.confirm).toHaveBeenCalledOnce();
      expect(facade.closePanel).toHaveBeenCalledOnce();
      expect(facade.loadAnalysis).toHaveBeenCalledWith('item1');
    });

    it('does not call closePanel/loadAnalysis when load is cancelled', async () => {
      confirmModal.confirm.mockResolvedValue(false);

      const itemHost = fixture.nativeElement.querySelector('.history-item');
      itemHost.click();
      await fixture.whenStable();

      expect(facade.closePanel).not.toHaveBeenCalled();
      expect(facade.loadAnalysis).not.toHaveBeenCalled();
    });
  });

  describe('loadAnalysis', () => {
    it('closes panel and loads analysis by id', () => {
      component.loadAnalysis('direct-id');
      expect(facade.closePanel).toHaveBeenCalledOnce();
      expect(facade.loadAnalysis).toHaveBeenCalledWith('direct-id');
    });
  });
});
