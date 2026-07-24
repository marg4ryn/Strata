import { ComponentFixture, TestBed } from '@angular/core/testing';

import { isoDateToLocaleString } from '@app/shared/date-utils/date.utils';
import { InfoPanel } from './info-panel.component';
import { AnalysisTarget, DateRange, PendingAnalysis } from '../../analysis-run.model';

describe('InfoPanel', () => {
  let component: InfoPanel;
  let fixture: ComponentFixture<InfoPanel>;

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
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [InfoPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(InfoPanel);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setInput(value: PendingAnalysis): void {
    fixture.componentRef.setInput('pendingAnalysis', value);
  }

  it('immediately updates computed signals', () => {
    fixture.detectChanges();
    setInput(analysis);

    expect(component.targetURL()).toBe(target.targetURL);
    expect(component.analysisStartDate()).toBe(new Date(analysis.startedAt).toLocaleString());
    expect(component.limitRange()).toBeTruthy();
    expect(component.startDate()).toBe(isoDateToLocaleString(range.startDate));
    expect(component.endDate()).toBe(isoDateToLocaleString(range.endDate));
  });

  it('does not update debounced signals before 800ms', async () => {
    fixture.detectChanges();
    setInput(analysis);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(799);
    fixture.detectChanges();

    expect(component.debouncedTargetURL.value()).not.toBe(target.targetURL);
    expect(component.debouncedAnalysisStartDate.value()).not.toBe(
      new Date(analysis.startedAt).toLocaleString(),
    );
    expect(component.debouncedLimitRange.value()).not.toBeTruthy();
    expect(component.debouncedStartDate.value()).not.toBe(isoDateToLocaleString('2000-01-01'));
    expect(component.debouncedEndDate.value()).not.toBe(isoDateToLocaleString('2000-01-01'));
  });

  it('updates debounced signals after 800ms', async () => {
    fixture.detectChanges();
    setInput(analysis);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(800);
    fixture.detectChanges();

    expect(component.debouncedTargetURL.value()).toBe(target.targetURL);
    expect(component.debouncedAnalysisStartDate.value()).toBe(
      new Date(analysis.startedAt).toLocaleString(),
    );
    expect(component.debouncedLimitRange.value()).toBeTruthy();
    expect(component.debouncedStartDate.value()).toBe(isoDateToLocaleString(range.startDate));
    expect(component.debouncedEndDate.value()).toBe(isoDateToLocaleString(range.endDate));
  });

  it('renders target URL after debounce', async () => {
    fixture.detectChanges();
    setInput(analysis);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(800);
    fixture.detectChanges();

    const url = fixture.nativeElement.querySelector('.details__url');
    expect(url.textContent).toContain(target.targetURL);
  });

  it('shows date range section when limitRange is true', async () => {
    fixture.detectChanges();
    setInput(analysis);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(800);
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
    await vi.advanceTimersByTimeAsync(800);
    fixture.detectChanges();

    const range = fixture.nativeElement.querySelector('.details__range');
    expect(range).toBeNull();
  });
});
