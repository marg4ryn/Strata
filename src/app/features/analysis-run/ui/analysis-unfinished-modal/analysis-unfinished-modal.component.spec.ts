import { ComponentFixture, TestBed } from '@angular/core/testing';

import { isoDateToLocaleString } from '@app/shared/date-utils/date.utils';
import { AnalysisUnfinishedModal } from './analysis-unfinished-modal.component';
import { AnalysisTarget, DateRange, PendingAnalysis } from '../../analysis-run.model';

describe('AnalysisUnfinishedModal', () => {
  let component: AnalysisUnfinishedModal;
  let fixture: ComponentFixture<AnalysisUnfinishedModal>;

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
    await TestBed.configureTestingModule({
      imports: [AnalysisUnfinishedModal],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisUnfinishedModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  function getButtons(): { abandon: HTMLButtonElement; resume: HTMLButtonElement } {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    return { abandon: buttons[0], resume: buttons[1] };
  }

  function getConfirmModal(): HTMLElement | null {
    return fixture.nativeElement.querySelector('app-confirm-operation-modal');
  }

  function getConfirmModalButtons(): { cancel: HTMLButtonElement; confirm: HTMLButtonElement } {
    const modal = getConfirmModal()!;
    const buttons = modal.querySelectorAll('button');
    return { cancel: buttons[0], confirm: buttons[1] };
  }

  function setInput(value: PendingAnalysis): void {
    fixture.componentRef.setInput('pendingAnalysis', value);
  }

  it('computes default date values when pendingAnalysis range is not set', () => {
    fixture.detectChanges();
    setInput({
      ...analysis,
      target: { ...analysis.target, limitRange: false, range: null },
    });
    fixture.detectChanges();

    expect(component.startDate()).toBe('');
    expect(component.endDate()).toBe('');
  });

  it('immediately updates computed signals', () => {
    fixture.detectChanges();
    setInput(analysis);

    expect(component.targetURL()).toBe(target.targetURL);
    expect(component.analysisStartDate()).toBe(new Date(analysis.startedAt).toLocaleString());
    expect(component.limitRange()).toBeTruthy();
    expect(component.startDate()).toBe(isoDateToLocaleString(range.startDate));
    expect(component.endDate()).toBe(isoDateToLocaleString(range.endDate));
  });

  it('displays analysis data via inputs', () => {
    fixture.detectChanges();
    setInput(analysis);
    fixture.detectChanges();

    const started = fixture.nativeElement.querySelector('.details__group');
    expect(started.textContent).toContain(new Date(analysis.startedAt).toLocaleString());

    const url = fixture.nativeElement.querySelector('.details__url');
    expect(url.textContent).toContain(target.targetURL);
  });

  it('shows date range section when limitRange is true', () => {
    fixture.detectChanges();
    setInput(analysis);
    fixture.detectChanges();

    const rangeEl = fixture.nativeElement.querySelector('.details__range');
    expect(rangeEl).toBeTruthy();
    expect(rangeEl.textContent).toContain(isoDateToLocaleString(range.startDate));
  });

  it('does not show date range section when limitRange is false', async () => {
    fixture.detectChanges();
    setInput({
      ...analysis,
      target: { ...analysis.target, limitRange: false },
    });
    fixture.detectChanges();

    const range = fixture.nativeElement.querySelector('.details__range');
    expect(range).toBeNull();
  });

  it('does not emit abandon when abandon button is clicked', () => {
    const spy = vi.fn();
    component.abandon.subscribe(spy);

    getButtons().abandon.click();

    expect(spy).not.toHaveBeenCalled();
  });

  it('emits resume when resume button is clicked', () => {
    const spy = vi.fn();
    component.resume.subscribe(spy);

    getButtons().resume.click();

    expect(spy).toHaveBeenCalledOnce();
  });

  it('does not render confirm modal initially', () => {
    expect(getConfirmModal()).toBeNull();
  });

  it('shows confirm modal when abandon button is clicked', () => {
    getButtons().abandon.click();
    fixture.detectChanges();

    expect(component.showModal).toBe(true);
    expect(getConfirmModal()).not.toBeNull();
  });

  it('hides confirm modal and does not emit abandon on cancel', () => {
    const spy = vi.fn();
    component.abandon.subscribe(spy);

    getButtons().abandon.click();
    fixture.detectChanges();

    getConfirmModalButtons().cancel.click();
    fixture.detectChanges();

    expect(component.showModal).toBe(false);
    expect(getConfirmModal()).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it('hides confirm modal and emits abandon on confirm', () => {
    const spy = vi.fn();
    component.abandon.subscribe(spy);

    getButtons().abandon.click();
    fixture.detectChanges();

    getConfirmModalButtons().confirm.click();
    fixture.detectChanges();

    expect(component.showModal).toBe(false);
    expect(getConfirmModal()).toBeNull();
    expect(spy).toHaveBeenCalledOnce();
  });
});
