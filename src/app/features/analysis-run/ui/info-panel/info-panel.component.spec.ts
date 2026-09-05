import { ComponentFixture, TestBed } from '@angular/core/testing';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { LocalizedDatePipe } from '@app/shared/localized-date-pipe/localized-date.pipe';
import { InfoPanelComponent } from './info-panel.component';
import { AnalysisTarget, DateRange, PendingAnalysis } from '../../analysis-run.model';

describe('InfoPanelComponent', () => {
  let component: InfoPanelComponent;
  let fixture: ComponentFixture<InfoPanelComponent>;

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
      imports: [InfoPanelComponent, getTranslocoModule()],
    }).compileComponents();

    fixture = TestBed.createComponent(InfoPanelComponent);
    component = fixture.componentInstance;
  });

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
});
