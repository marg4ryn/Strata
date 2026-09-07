import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { LineChartComponent } from './line-chart.component';

describe('LineChartComponent', () => {
  let component: LineChartComponent;
  let fixture: ComponentFixture<LineChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineChartComponent, getTranslocoModule()],
      providers: [provideCharts(withDefaultRegisterables())],
    }).compileComponents();

    fixture = TestBed.createComponent(LineChartComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('series', []);
    fixture.componentRef.setInput('aggregation', 'month');
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set a wide canvas for day aggregation', () => {
    fixture.componentRef.setInput('aggregation', 'day');
    fixture.componentRef.setInput('series', [
      {
        legendLabelKey: 'analysisResults.repositoryDetails.commitsLegendLabel',
        tooltipLabelKey: 'analysisResults.repositoryDetails.commitsTooltipLabel',
        color: '#2563eb',
        points: Array.from({ length: 120 }, (_, index) => ({
          date: new Date(Date.UTC(2024, 0, index + 1)).toISOString().slice(0, 10),
          value: index + 1,
        })),
      },
    ]);

    fixture.detectChanges();

    const canvas = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    expect(component.chartWidth()).toBeGreaterThan(350);
    expect(canvas.width).toBe(component.chartWidth());
    expect(canvas.height).toBe(component.chartHeight());
    expect(canvas.style.width).toBe(`${component.chartWidth()}px`);
  });
});
