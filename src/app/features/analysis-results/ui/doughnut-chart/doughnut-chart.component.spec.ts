import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoughnutChartComponent, DoughnutChartItem } from './doughnut-chart.component';

describe('DoughnutChartComponent', () => {
  let component: DoughnutChartComponent;
  let fixture: ComponentFixture<DoughnutChartComponent>;

  const sampleItems: DoughnutChartItem[] = [
    { label: 'Code', value: 100 },
    { label: 'Comments', value: 50 },
    { label: 'Blank', value: 25 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoughnutChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DoughnutChartComponent);
    component = fixture.componentInstance;
  });

  it('builds chart labels from items', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.detectChanges();

    expect(component.chartData.labels).toEqual(['Code', 'Comments', 'Blank']);
  });

  it('builds chart data values from items', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.detectChanges();

    expect(component.chartData.datasets[0].data).toEqual([100, 50, 25]);
  });

  it('uses provided colors when available', () => {
    const itemsWithColors: DoughnutChartItem[] = [
      { label: 'Code', value: 100, color: '#111111' },
      { label: 'Comments', value: 50, color: '#222222' },
    ];

    fixture.componentRef.setInput('items', itemsWithColors);
    fixture.detectChanges();

    expect(component.chartData.datasets[0].backgroundColor).toEqual(['#111111', '#222222']);
  });

  it('falls back to default colors when not provided', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.detectChanges();

    const backgroundColor = component.chartData.datasets[0].backgroundColor as string[];
    expect(backgroundColor).toEqual(['#4f46e5', '#22c55e', '#f97316']);
  });

  it('cycles default colors when there are more items than colors', () => {
    const manyItems: DoughnutChartItem[] = Array.from({ length: 8 }, (_, i) => ({
      label: `Item ${i}`,
      value: i + 1,
    }));

    fixture.componentRef.setInput('items', manyItems);
    fixture.detectChanges();

    const backgroundColor = component.chartData.datasets[0].backgroundColor as string[];
    expect(backgroundColor[0]).toBe(backgroundColor[6]);
    expect(backgroundColor[1]).toBe(backgroundColor[7]);
  });

  it('sets legend visibility from showLegend input', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.componentRef.setInput('showLegend', false);
    fixture.detectChanges();

    expect(component.chartOptions?.plugins?.legend?.display).toBe(false);
  });

  it('defaults legend to visible', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.detectChanges();

    expect(component.chartOptions?.plugins?.legend?.display).toBe(true);
  });

  it('sets legend position from legendPosition input', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.componentRef.setInput('legendPosition', 'right');
    fixture.detectChanges();

    expect(component.chartOptions?.plugins?.legend?.position).toBe('right');
  });

  it('defaults legend position to bottom', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.detectChanges();

    expect(component.chartOptions?.plugins?.legend?.position).toBe('bottom');
  });

  it('sets doughnut-specific chart options', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.detectChanges();

    expect(component.chartType).toBe('doughnut');
    expect(component.chartOptions?.cutout).toBe('65%');
    expect(component.chartOptions?.spacing).toBe(3);
  });

  it('rebuilds chart data when items input changes', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.detectChanges();

    const updatedItems: DoughnutChartItem[] = [{ label: 'Only', value: 999 }];
    fixture.componentRef.setInput('items', updatedItems);
    fixture.detectChanges();

    expect(component.chartData.labels).toEqual(['Only']);
    expect(component.chartData.datasets[0].data).toEqual([999]);
  });

  it('renders an empty chart when items array is empty', () => {
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();

    expect(component.chartData.labels).toEqual([]);
    expect(component.chartData.datasets[0].data).toEqual([]);
  });

  it('calls buildChart when items changes', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.detectChanges();
  });

  it('does not call buildChart when changes do not include items, showLegend or legendPosition', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.detectChanges();

    const buildChartSpy = vi.spyOn<any, any>(component, 'buildChart');

    component.ngOnChanges({
      someOtherInput: {
        previousValue: undefined,
        currentValue: 'x',
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(buildChartSpy).not.toHaveBeenCalled();
  });
});
