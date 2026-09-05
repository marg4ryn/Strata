import { ComponentFixture, TestBed } from '@angular/core/testing';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { LocalizedDatePipe } from '@app/shared/localized-date-pipe/localized-date.pipe';
import { ConfirmOperationModalService } from '@app/shared/confirm-operation-modal/service/confirm-operation-modal.service';
import { AnalysisUnfinishedModalComponent } from './analysis-unfinished-modal.component';
import { AnalysisTarget, DateRange, PendingAnalysis } from '../../analysis-run.model';

describe('AnalysisUnfinishedModalComponent', () => {
  let component: AnalysisUnfinishedModalComponent;
  let fixture: ComponentFixture<AnalysisUnfinishedModalComponent>;
  let confirmModal: { confirm: ReturnType<typeof vi.fn> };

  const range: DateRange = {
    startDate: '2000-01-01',
    endDate: '2000-01-01',
    timezone: 'Europe/Warsaw',
  };
  const target: AnalysisTarget = {
    targetURL: 'https://example.com/Project.git',
    limitRange: true,
    range: range,
  };
  const analysis: PendingAnalysis = {
    sessionId: '1',
    startedAt: 42,
    target: target,
  };

  beforeEach(async () => {
    confirmModal = { confirm: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AnalysisUnfinishedModalComponent, getTranslocoModule()],
      providers: [{ provide: ConfirmOperationModalService, useValue: confirmModal }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisUnfinishedModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  function getButtons(): { abandon: HTMLButtonElement; resume: HTMLButtonElement } {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    return { abandon: buttons[0], resume: buttons[1] };
  }

  function setInput(value: PendingAnalysis): void {
    fixture.componentRef.setInput('pendingAnalysis', value);
  }

  it('renders target URL', () => {
    setInput(analysis);
    fixture.detectChanges();

    const url = fixture.nativeElement.querySelector('.details__url');
    expect(url.textContent).toContain(target.targetURL);
  });

  it('shows date range section when limitRange is true', () => {
    setInput(analysis);
    fixture.detectChanges();

    const rangeEl = fixture.nativeElement.querySelector('.details__range');
    expect(rangeEl).toBeTruthy();
  });

  it('does not show date range section when limitRange is false', () => {
    setInput({
      ...analysis,
      target: { ...analysis.target, limitRange: false },
    });
    fixture.detectChanges();

    const rangeEl = fixture.nativeElement.querySelector('.details__range');
    expect(rangeEl).toBeNull();
  });

  it('formats startedAt using localizedDate pipe with dateStyle and timeStyle', () => {
    const transformSpy = vi.spyOn(LocalizedDatePipe.prototype, 'transform');

    setInput(analysis);
    fixture.detectChanges();

    expect(transformSpy).toHaveBeenCalledWith(analysis.startedAt, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    });
  });

  it('formats range start and end dates using localizedDate pipe', () => {
    const transformSpy = vi.spyOn(LocalizedDatePipe.prototype, 'transform');

    setInput(analysis);
    fixture.detectChanges();

    expect(transformSpy).toHaveBeenCalledWith(range.startDate);
    expect(transformSpy).toHaveBeenCalledWith(range.endDate);
  });

  it('emits resume when resume button is clicked', () => {
    const spy = vi.fn();
    component.resume.subscribe(spy);

    getButtons().resume.click();

    expect(spy).toHaveBeenCalledOnce();
  });

  it('opens confirm modal when abandon button is clicked', async () => {
    confirmModal.confirm.mockResolvedValue(false);

    getButtons().abandon.click();

    expect(confirmModal.confirm).toHaveBeenCalledOnce();
  });

  it('does not emit abandon when confirm modal is cancelled', async () => {
    confirmModal.confirm.mockResolvedValue(false);
    const spy = vi.fn();
    component.abandon.subscribe(spy);

    getButtons().abandon.click();
    await fixture.whenStable();

    expect(spy).not.toHaveBeenCalled();
  });

  it('emits abandon when confirm modal is confirmed', async () => {
    confirmModal.confirm.mockResolvedValue(true);
    const spy = vi.fn();
    component.abandon.subscribe(spy);

    getButtons().abandon.click();
    await fixture.whenStable();

    expect(spy).toHaveBeenCalledOnce();
  });
});
