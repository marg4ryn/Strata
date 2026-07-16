import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoPanel } from './info-panel.component';
import { AnalysisTarget, DateRange, PendingAnalysis } from '../../data-access/analysis-run.model';

describe('InfoPanel', () => {
  let component: InfoPanel;
  let fixture: ComponentFixture<InfoPanel>;

  const range: DateRange = {
    startDate: '2000-01-01',
    endDate: '2000-01-01',
    timezone: 'Europe/Warsaw',
  };
  const target: AnalysisTarget = {
    targetURL: 'https://example.com',
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

  function setInput(value: PendingAnalysis) {
    fixture.componentRef.setInput('pendingAnalysis', value);
  }

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('immediately updates computed signals', () => {
    fixture.detectChanges();
    setInput(analysis);

    expect(component.targetURL()).toBe('https://example.com');
    expect(component.analysisStartDate()).toBe(new Date(42).toLocaleString());
    expect(component.limitRange()).toBeTruthy();
    expect(component.startDate()).toBe(new Date('2000-01-01').toLocaleDateString());
    expect(component.endDate()).toBe(new Date('2000-01-01').toLocaleDateString());
  });

  it('does not update debounced signals before 800ms', async () => {
    fixture.detectChanges();
    setInput(analysis);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(799);
    fixture.detectChanges();

    expect(component.debouncedTargetURL.value()).not.toBe('https://example.com');
    expect(component.debouncedAnalysisStartDate.value()).not.toBe(new Date(42).toLocaleString());
    expect(component.debouncedLimitRange.value()).not.toBeTruthy();
    expect(component.debouncedStartDate.value()).not.toBe(
      new Date('2000-01-01').toLocaleDateString(),
    );
    expect(component.debouncedEndDate.value()).not.toBe(
      new Date('2000-01-01').toLocaleDateString(),
    );
  });

  it('updates debounced signals after 800ms', async () => {
    fixture.detectChanges();
    setInput(analysis);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(800);
    fixture.detectChanges();

    expect(component.debouncedTargetURL.value()).toBe('https://example.com');
    expect(component.debouncedAnalysisStartDate.value()).toBe(new Date(42).toLocaleString());
    expect(component.debouncedLimitRange.value()).toBeTruthy();
    expect(component.debouncedStartDate.value()).toBe(new Date('2000-01-01').toLocaleDateString());
    expect(component.debouncedEndDate.value()).toBe(new Date('2000-01-01').toLocaleDateString());
  });

  it('renders target URL after debounce', async () => {
    fixture.detectChanges();
    setInput(analysis);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(800);
    fixture.detectChanges();

    const url = fixture.nativeElement.querySelector('.details__url');
    expect(url.textContent).toContain('https://example.com');
  });

  it('shows date range section when limitRange is true', async () => {
    fixture.detectChanges();
    setInput(analysis);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(800);
    fixture.detectChanges();

    const range = fixture.nativeElement.querySelector('.details__range');
    expect(range).toBeTruthy();
    expect(range.textContent).toContain(
      new Date(analysis.target.range!.startDate).toLocaleDateString(),
    );
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
