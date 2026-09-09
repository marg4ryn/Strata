import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoughnutChartSectionComponent } from './doughnut-chart-section.component';

describe('DoughnutChartSectionComponent', () => {
  let component: DoughnutChartSectionComponent;
  let fixture: ComponentFixture<DoughnutChartSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoughnutChartSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DoughnutChartSectionComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
