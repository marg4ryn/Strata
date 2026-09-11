import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { DoughnutChartSectionComponent } from './doughnut-chart-section.component';
import type { DoughnutChartItem } from '../../charts/doughnut-chart/doughnut-chart.component';

describe('DoughnutChartSectionComponent', () => {
  let component: DoughnutChartSectionComponent;
  let fixture: ComponentFixture<DoughnutChartSectionComponent>;

  const mockItems: DoughnutChartItem[] = [];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoughnutChartSectionComponent, getTranslocoModule()],
      providers: [provideCharts(withDefaultRegisterables())],
    }).compileComponents();

    fixture = TestBed.createComponent(DoughnutChartSectionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', mockItems);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
