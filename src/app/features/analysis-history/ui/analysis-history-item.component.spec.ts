import { ComponentFixture, TestBed } from '@angular/core/testing';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { ConfirmOperationModalService } from '@app/shared/confirm-operation-modal/service/confirm-operation-modal.service';
import { AnalysisHistoryItemComponent } from './analysis-history-item.component';
import { AnalysisHistoryEntry } from '../analysis-history.model';

describe('AnalysisHistoryItemComponent', () => {
  let component: AnalysisHistoryItemComponent;
  let fixture: ComponentFixture<AnalysisHistoryItemComponent>;
  let confirmModalMock: { confirm: ReturnType<typeof vi.fn> };

  const baseEntry: AnalysisHistoryEntry = {
    analysisId: '123',
    completedAt: 42,
    target: {
      targetURL: 'https://github.com/owner/repo.git',
      limitRange: false,
      range: null,
    },
  } as AnalysisHistoryEntry;

  beforeEach(async () => {
    confirmModalMock = { confirm: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AnalysisHistoryItemComponent, getTranslocoModule()],
      providers: [{ provide: ConfirmOperationModalService, useValue: confirmModalMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisHistoryItemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('historyEntry', baseEntry);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  describe('computed properties', () => {
    const withUrl = (targetURL: string) =>
      ({ ...baseEntry, target: { ...baseEntry.target, targetURL } }) as AnalysisHistoryEntry;

    it('handles URL with no slashes', async () => {
      fixture.componentRef.setInput('historyEntry', withUrl('repo.git'));
      fixture.detectChanges();
      expect(component.repoName()).toBe('repo');
    });

    it('handles empty targetURL string', async () => {
      fixture.componentRef.setInput('historyEntry', withUrl(''));
      fixture.detectChanges();
      expect(component.repoName()).toBe('');
    });

    it('repoName strips ".git" and takes last two path segments', () => {
      expect(component.repoName()).toBe('owner/repo');
    });

    it('repoName handles URL without ".git"', async () => {
      fixture.componentRef.setInput('historyEntry', withUrl('https://github.com/owner/repo'));
      fixture.detectChanges();
      expect(component.repoName()).toBe('owner/repo');
    });

    it('timestamp formats completedAt as locale string', () => {
      const expected = new Date(baseEntry.completedAt).toLocaleString();
      expect(component.timestamp()).toBe(expected);
    });

    it('hasDateRange is false when limitRange is false', () => {
      expect(component.hasDateRange()).toBe(false);
    });

    it('hasDateRange is false when limitRange is true but range is null', async () => {
      fixture.componentRef.setInput('historyEntry', {
        ...baseEntry,
        target: { ...baseEntry.target, limitRange: true, range: null },
      });
      fixture.detectChanges();
      expect(component.hasDateRange()).toBe(false);
    });

    it('hasDateRange is true when limitRange is true and range is set', async () => {
      fixture.componentRef.setInput('historyEntry', {
        ...baseEntry,
        target: {
          ...baseEntry.target,
          limitRange: true,
          range: { startDate: '2024-01-01', endDate: '2024-01-31' },
        },
      });
      fixture.detectChanges();
      expect(component.hasDateRange()).toBe(true);
    });

    it('rangeLabel returns empty string when range is null', () => {
      expect(component.rangeLabel()).toBe('');
    });

    it('rangeLabel formats start and end date when range is set', async () => {
      fixture.componentRef.setInput('historyEntry', {
        ...baseEntry,
        target: {
          ...baseEntry.target,
          range: { startDate: '2024-01-01', endDate: '2024-01-31' },
        },
      });
      fixture.detectChanges();
      expect(component.rangeLabel()).toBe('2024-01-01 – 2024-01-31');
    });
  });

  describe('loadAnalysis', () => {
    it('emits load with analysisId when confirmed', async () => {
      confirmModalMock.confirm.mockResolvedValue(true);
      const spy = vi.fn();
      component.load.subscribe(spy);

      await component.loadAnalysis();

      expect(confirmModalMock.confirm).toHaveBeenCalledWith(
        expect.anything(),
        `Load the ${component.repoName()} analysis?`,
        'confirm',
      );
      expect(spy).toHaveBeenCalledWith(baseEntry.analysisId);
    });

    it('does not emit load when not confirmed', async () => {
      confirmModalMock.confirm.mockResolvedValue(false);
      const spy = vi.fn();
      component.load.subscribe(spy);

      await component.loadAnalysis();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('removeHistoryEntry', () => {
    it('emits remove with analysisId when confirmed, and stops propagation', async () => {
      confirmModalMock.confirm.mockResolvedValue(true);
      const spy = vi.fn();
      component.remove.subscribe(spy);
      const event = { stopPropagation: vi.fn() } as unknown as Event;

      await component.removeHistoryEntry(event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(confirmModalMock.confirm).toHaveBeenCalledWith(
        expect.anything(),
        `Are you sure you want to delete the ${component.repoName()} analysis? This operation cannot be undone.`,
      );
      expect(spy).toHaveBeenCalledWith(baseEntry.analysisId);
    });

    it('does not emit remove when not confirmed', async () => {
      confirmModalMock.confirm.mockResolvedValue(false);
      const spy = vi.fn();
      component.remove.subscribe(spy);
      const event = { stopPropagation: vi.fn() } as unknown as Event;

      await component.removeHistoryEntry(event);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('handleRemoveHistoryEntryKeydown', () => {
    it('stops propagation for non-Escape keys', () => {
      const event = { key: 'Enter', stopPropagation: vi.fn() } as unknown as KeyboardEvent;
      component.handleRemoveHistoryEntryKeydown(event);
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('does not stop propagation for Escape key', () => {
      const event = { key: 'Escape', stopPropagation: vi.fn() } as unknown as KeyboardEvent;
      component.handleRemoveHistoryEntryKeydown(event);
      expect(event.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe('DOM interaction', () => {
    it('clicking delete button calls removeHistoryEntry and stops propagation to host', async () => {
      confirmModalMock.confirm.mockResolvedValue(false);
      const hostClickSpy = vi.fn();
      fixture.nativeElement.addEventListener('click', hostClickSpy);

      const deleteButton = fixture.nativeElement.querySelector('.history-item__delete');
      deleteButton.click();
      await fixture.whenStable();

      expect(confirmModalMock.confirm).toHaveBeenCalled();
    });

    it('clicking host element triggers loadAnalysis', async () => {
      confirmModalMock.confirm.mockResolvedValue(false);

      fixture.nativeElement.click();
      await fixture.whenStable();

      expect(confirmModalMock.confirm).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('Load the'),
        'confirm',
      );
    });

    it('triggers loadAnalysis on host enter keydown', async () => {
      confirmModalMock.confirm.mockResolvedValue(false);
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      fixture.nativeElement.dispatchEvent(event);
      await fixture.whenStable();
      expect(confirmModalMock.confirm).toHaveBeenCalled();
    });
  });

  describe('delete button DOM events', () => {
    function getDeleteButton(): HTMLButtonElement {
      return fixture.nativeElement.querySelector('.history-item__delete');
    }

    it('click on delete button calls removeHistoryEntry and does not bubble to host', async () => {
      confirmModalMock.confirm.mockResolvedValue(false);

      getDeleteButton().dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await fixture.whenStable();

      expect(confirmModalMock.confirm).toHaveBeenCalledOnce();
      expect(confirmModalMock.confirm).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('delete'),
      );
    });

    it('keydown on delete button with non-Escape key stops propagation to host', async () => {
      confirmModalMock.confirm.mockResolvedValue(false);

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      getDeleteButton().dispatchEvent(event);
      await fixture.whenStable();

      expect(confirmModalMock.confirm).not.toHaveBeenCalled();
    });

    it('keydown on delete button with Escape does not stop propagation', async () => {
      const spy = vi.spyOn(component, 'handleRemoveHistoryEntryKeydown');

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      getDeleteButton().dispatchEvent(event);
      await fixture.whenStable();

      expect(spy).toHaveBeenCalledWith(event);
      expect(confirmModalMock.confirm).not.toHaveBeenCalled();
    });

    it('keydown Enter on delete button does not trigger loadAnalysis via host', async () => {
      confirmModalMock.confirm.mockResolvedValue(false);

      getDeleteButton().dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      );
      await fixture.whenStable();

      expect(confirmModalMock.confirm).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('Load the'),
        'confirm',
      );
    });
  });
});
