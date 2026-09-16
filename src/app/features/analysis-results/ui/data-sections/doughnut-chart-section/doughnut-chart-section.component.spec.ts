import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { DoughnutChartSectionComponent } from './doughnut-chart-section.component';
import { DoughnutChartComponent } from '../../charts/doughnut-chart/doughnut-chart.component';
import type { DoughnutChartItem } from '../../charts/doughnut-chart/doughnut-chart.component';

describe('DoughnutChartSectionComponent', () => {
  let component: DoughnutChartSectionComponent;
  let fixture: ComponentFixture<DoughnutChartSectionComponent>;

  const sampleItems: DoughnutChartItem[] = [
    {
      legendLabelKey: 'analysisResults.repositoryDetails.codeLegendLabel',
      tooltipLabelKey: 'analysisResults.repositoryDetails.codeTooltipLabel',
      value: 100,
      color: '#111111',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoughnutChartSectionComponent, getTranslocoModule()],
      providers: [provideCharts(withDefaultRegisterables())],
    }).compileComponents();

    fixture = TestBed.createComponent(DoughnutChartSectionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', sampleItems);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renders the doughnut chart component when the items array is not empty', () => {
    const chart = fixture.debugElement.query(By.directive(DoughnutChartComponent));
    const message = fixture.debugElement.query(By.css('.doughnut-chart-section__no-data'));
    expect(chart).toBeTruthy();
    expect(message).toBeFalsy();
  });

  it('renders the no data message when the items array is empty', () => {
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    const chart = fixture.debugElement.query(By.directive(DoughnutChartComponent));
    const message = fixture.debugElement.query(By.css('.doughnut-chart-section__no-data'));
    expect(chart).toBeFalsy();
    expect(message).toBeTruthy();
  });
});
