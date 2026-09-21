import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { getTranslocoModule } from '@app/core/transloco';
import { DropdownComponent } from '@app/shared/components';
import { BarChartSectionComponent } from './bar-chart-section.component';
import { BarChartComponent } from '../../charts/bar-chart/bar-chart.component';
import type { ChartAggregationPeriod, ChartSeries } from '../../../utils/aggregation/aggregation';

describe('BarChartSectionComponent', () => {
  let component: BarChartSectionComponent;
  let fixture: ComponentFixture<BarChartSectionComponent>;
  let dropdown: DropdownComponent<string>;

  const mockSeries: ChartSeries[] = [
    { legendLabelKey: 'test', tooltipLabelKey: 'test', color: 'test', points: [] },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChartSectionComponent, getTranslocoModule()],
      providers: [provideCharts(withDefaultRegisterables())],
    }).compileComponents();

    fixture = TestBed.createComponent(BarChartSectionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('series', mockSeries);
    await fixture.whenStable();
    fixture.detectChanges();

    dropdown = fixture.debugElement.query(By.directive(DropdownComponent)).componentInstance;
  });

  it('defaults current aggregation to week', () => {
    expect(component.selectedPeriod()).toBe('week');
  });

  it('starts closed', () => {
    expect(component.isOpen()).toBe(false);
  });

  it('returns matching option for current aggregation', () => {
    expect(component.currentOption).toEqual(component.options[1]);
  });

  it('returns first option when no other matches', () => {
    component.selectedPeriod.set('invalid' as ChartAggregationPeriod);
    fixture.detectChanges();
    expect(component.currentOption).toEqual(component.options[0]);
  });

  it('passes options to the dropdown', () => {
    expect(dropdown.options()).toEqual(component.options);
  });

  it('passes current value to the dropdown', () => {
    expect(dropdown.value()).toBe('week');
  });

  it('passes aria-label to the dropdown', () => {
    expect(dropdown.ariaLabelKey()).toBe('analysisResults.aggregation.ariaLabel');
  });

  it('delegates close to the dropdown', () => {
    const spy = vi.spyOn(dropdown, 'close');
    component.close();
    expect(spy).toHaveBeenCalled();
  });

  it('updates current aggregation on select with new value', () => {
    component.select('day');
    expect(component.selectedPeriod()).toBe('day');
  });

  it('closes dropdown after selecting new value', () => {
    const spy = vi.spyOn(dropdown, 'close');
    component.select('day');
    expect(spy).toHaveBeenCalled();
  });

  it('keeps current aggregation when selecting the same value', () => {
    component.select('week');
    expect(component.selectedPeriod()).toBe('week');
  });

  it('closes dropdown when selecting the same value', () => {
    const spy = vi.spyOn(dropdown, 'close');
    component.select('week');
    expect(spy).toHaveBeenCalled();
  });

  it('reacts to dropdown selectionChange event', () => {
    dropdown.selectionChange.emit('month');
    expect(component.selectedPeriod()).toBe('month');
  });

  it('passes updated aggregation period to the bar chart', () => {
    component.select('biweek');
    fixture.detectChanges();
    const chart = fixture.debugElement.query(By.directive(BarChartComponent))
      .componentInstance as BarChartComponent;
    expect(chart.period()).toBe('biweek');
  });

  it('does not render the bar chart or the dropdown when the series array is empty', () => {
    fixture.componentRef.setInput('series', []);
    fixture.detectChanges();
    const chart = fixture.debugElement.query(By.directive(BarChartComponent));
    const dropdown = fixture.debugElement.query(By.directive(DropdownComponent));
    const message = fixture.debugElement.query(By.css('.bar-chart-section__no-data'));
    expect(chart).toBeFalsy();
    expect(dropdown).toBeFalsy();
    expect(message).toBeTruthy();
  });
});
