import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { TranslocoService } from '@jsverse/transloco';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { LineChartComponent } from './line-chart.component';
import type { LineChartSeries } from './line-chart.component';

describe('LineChartComponent', () => {
  let component: LineChartComponent;
  let fixture: ComponentFixture<LineChartComponent>;
  let transloco: TranslocoService;

  const seriesA: LineChartSeries = {
    legendLabelKey: 'legend.series.a',
    tooltipLabelKey: 'tooltip.series.a',
    color: '#ff0000',
    points: [
      { date: '2024-01-01', value: 10 },
      { date: '2024-01-02', value: 20 },
    ],
  };

  const seriesB: LineChartSeries = {
    legendLabelKey: 'legend.series.b',
    tooltipLabelKey: 'tooltip.series.b',
    color: '#00ff00',
    points: [{ date: '2024-01-02', value: 5 }],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineChartComponent, getTranslocoModule()],
      providers: [provideCharts(withDefaultRegisterables())],
    }).compileComponents();

    fixture = TestBed.createComponent(LineChartComponent);
    component = fixture.componentInstance;
    transloco = TestBed.inject(TranslocoService);

    fixture.componentRef.setInput('series', []);
    fixture.componentRef.setInput('period', 'day');
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('uses minimum chart width when there are no buckets', () => {
    expect(component.chartWidth()).toBe(350);
  });

  it('has a fixed chart height', () => {
    expect(component.chartHeight()).toBe(250);
  });

  it('produces one dataset per series', () => {
    fixture.componentRef.setInput('series', [seriesA, seriesB]);
    fixture.detectChanges();

    expect(component.chartData()!.datasets).toHaveLength(2);
  });

  it('merges bucket keys from all series without duplicates', () => {
    fixture.componentRef.setInput('series', [seriesA, seriesB]);
    fixture.detectChanges();

    // seriesA: 2024-01-01, 2024-01-02 | seriesB: 2024-01-02 -> 2 unique keys
    expect(component.chartData()!.labels).toHaveLength(2);
  });

  it('scales chart width based on number of unique bucket keys', () => {
    const manyPointsSeries: LineChartSeries = {
      legendLabelKey: 'legend.series.c',
      tooltipLabelKey: 'tooltip.series.c',
      color: '#0000ff',
      points: Array.from({ length: 30 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        value: i,
      })),
    };

    fixture.componentRef.setInput('series', [manyPointsSeries]);
    fixture.detectChanges();

    expect(component.chartWidth()).toBe(30 * 15);
  });

  it('fills missing bucket values with zero in dataset data', () => {
    fixture.componentRef.setInput('series', [seriesA, seriesB]);
    fixture.detectChanges();

    const data = component.chartData()!;
    // seriesB has no value for the first bucket (2024-01-01)
    expect(data.datasets[1].data[0]).toBe(0);
  });

  it('applies series color to dataset border and background', () => {
    fixture.componentRef.setInput('series', [seriesA]);
    fixture.detectChanges();

    const data = component.chartData()!;
    expect(data.datasets[0].borderColor).toBe(seriesA.color);
    expect(data.datasets[0].backgroundColor).toBe(seriesA.color);
  });

  it('translates tooltip label key for each dataset', () => {
    const translateSpy = vi.spyOn(transloco, 'translate').mockReturnValue('Translated Label');
    fixture.componentRef.setInput('series', [seriesA]);
    fixture.detectChanges();

    expect(translateSpy).toHaveBeenCalledWith('tooltip.series.a');
    expect(component.chartData()!.datasets[0].label).toBe('Translated Label');
  });

  it('recomputes buckets when aggregation period input changes', () => {
    fixture.componentRef.setInput('series', [seriesA]);
    fixture.detectChanges();
    const dayLabelsCount = component.chartData()!.labels!.length;

    fixture.componentRef.setInput('period', 'month');
    fixture.detectChanges();
    const monthLabelsCount = component.chartData()!.labels!.length;

    // two points in the same month collapse into a single bucket
    expect(dayLabelsCount).toBe(2);
    expect(monthLabelsCount).toBe(1);
  });

  it('formats month aggregation bucket key as month and year', () => {
    const label = component.formatBucketLabel('2024-03', 'month', 'en');
    expect(label).toContain('2024');
    expect(label.toLowerCase()).toContain('march');
  });

  it('formats non-month aggregation bucket key as day and month', () => {
    const label = component.formatBucketLabel('2024-03-15', 'day', 'en');
    expect(label).toContain('15');
    expect(label.toLowerCase()).toContain('march');
  });

  it('sets chart type to line', () => {
    expect(component.chartType).toBe('line');
  });

  it('disables the built-in chart.js legend', () => {
    expect(component.chartOptions()!.plugins!.legend!.display).toBe(false);
  });

  it('formats tooltip label using localized number', () => {
    const tooltipCallback = component.chartOptions()!.plugins!.tooltip!.callbacks!.label as (
      context: unknown,
    ) => string;

    const result = tooltipCallback({
      dataset: { label: 'Series A' },
      parsed: { y: 1234 },
    });

    expect(result).toContain('Series A');
    expect(result).toContain((1234).toLocaleString('en'));
  });

  it('renders a legend item for each series', () => {
    fixture.componentRef.setInput('series', [seriesA, seriesB]);
    fixture.detectChanges();

    const items = fixture.debugElement.queryAll(By.css('.line-chart__legend-item'));
    expect(items).toHaveLength(2);
  });

  it('applies series color to legend rectangle', () => {
    fixture.componentRef.setInput('series', [seriesA]);
    fixture.detectChanges();

    const rectangle = fixture.debugElement.query(By.css('.line-chart__legend-rectangle'))
      .nativeElement as HTMLElement;
    expect(rectangle.style.background).toBe('rgb(255, 0, 0)');
  });

  it('recomputes chart data when active language changes', () => {
    fixture.componentRef.setInput('series', [seriesA]);
    fixture.componentRef.setInput('period', 'month');
    fixture.detectChanges();

    const enLabel = component.chartData()!.labels![0];

    transloco.setActiveLang('pl');
    fixture.detectChanges();

    const plLabel = component.chartData()!.labels![0];
    expect(plLabel).not.toBe(enLabel);
  });
});
