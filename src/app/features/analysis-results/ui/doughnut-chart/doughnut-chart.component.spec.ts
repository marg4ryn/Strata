import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { DoughnutChartComponent, DoughnutChartItem } from './doughnut-chart.component';

describe('DoughnutChartComponent', () => {
  let component: DoughnutChartComponent;
  let fixture: ComponentFixture<DoughnutChartComponent>;

  const sampleItems: DoughnutChartItem[] = [
    {
      legendLabelKey: 'analysisResults.repositoryDetails.codeLegendLabel',
      tooltipLabelKey: 'analysisResults.repositoryDetails.codeTooltipLabel',
      value: 100,
      color: '#111111',
    },
    {
      legendLabelKey: 'analysisResults.repositoryDetails.commentsLegendLabel',
      tooltipLabelKey: 'analysisResults.repositoryDetails.commentsTooltipLabel',
      value: 50,
      color: '#222222',
    },
    {
      legendLabelKey: 'analysisResults.repositoryDetails.blankLegendLabel',
      tooltipLabelKey: 'analysisResults.repositoryDetails.blankTooltipLabel',
      value: 25,
      color: '#333333',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoughnutChartComponent, getTranslocoModule()],
      providers: [provideCharts(withDefaultRegisterables())],
    }).compileComponents();

    fixture = TestBed.createComponent(DoughnutChartComponent);
    component = fixture.componentInstance;
  });

  it('builds chart labels from items using translations', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.detectChanges();

    expect(component.chartData().labels).toEqual(['Code', 'Comments', 'Blank']);
  });

  it('builds chart data values from items', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.detectChanges();

    expect(component.chartData().datasets[0].data).toEqual([100, 50, 25]);
  });

  it('uses provided colors', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.detectChanges();

    expect(component.chartData().datasets[0].backgroundColor).toEqual([
      '#111111',
      '#222222',
      '#333333',
    ]);
  });

  it('sets chart options', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.detectChanges();

    expect(component.chartType).toBe('doughnut');
    expect(component.chartOptions()?.cutout).toBe('65%');
    expect(component.chartOptions()?.spacing).toBe(3);
    expect(component.chartOptions()?.plugins?.legend?.display).toBe(true);
    expect(component.chartOptions()?.plugins?.legend?.position).toBe('bottom');
  });

  it('rebuilds chart data when items input changes', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.detectChanges();

    const updatedItems: DoughnutChartItem[] = [
      {
        legendLabelKey: 'analysisResults.repositoryDetails.codeLegendLabel',
        tooltipLabelKey: 'analysisResults.repositoryDetails.codeTooltipLabel',
        value: 999,
        color: '#444444',
      },
    ];
    fixture.componentRef.setInput('items', updatedItems);
    fixture.detectChanges();

    expect(component.chartData().labels).toEqual(['Code']);
    expect(component.chartData().datasets[0].data).toEqual([999]);
  });

  it('renders an empty chart when items array is empty', () => {
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();

    expect(component.chartData().labels).toEqual([]);
    expect(component.chartData().datasets[0].data).toEqual([]);
  });

  it('does not render tooltip title', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.detectChanges();

    const tooltipCallback = component.chartOptions()?.plugins?.tooltip?.callbacks?.title;
    const result = tooltipCallback?.call({} as never, { dataIndex: 1, parsed: 50 } as never);

    expect(result).toBe('');
  });

  it('formats tooltip label using tooltipLabelKey translation', () => {
    fixture.componentRef.setInput('items', sampleItems);
    fixture.detectChanges();

    const tooltipCallback = component.chartOptions()?.plugins?.tooltip?.callbacks?.label;
    const result = tooltipCallback?.call({} as never, { dataIndex: 1, parsed: 50 } as never);

    expect(result).toBe(' Comment lines: 50');
  });
});
