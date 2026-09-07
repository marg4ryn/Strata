import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineChartSectionComponent } from './line-chart-section.component';

describe('LineChartSectionComponent', () => {
  let component: LineChartSectionComponent;
  let fixture: ComponentFixture<LineChartSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineChartSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LineChartSectionComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
