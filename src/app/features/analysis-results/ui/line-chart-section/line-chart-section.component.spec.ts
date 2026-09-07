import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { DropdownComponent } from '@app/shared/dropdown/dropdown.component';
import { LineChartSectionComponent } from './line-chart-section.component';
import {
  LineChartAggregation,
  LineChartComponent,
  LineChartSeries,
} from '../../ui/line-chart/line-chart.component';

describe('LineChartSectionComponent', () => {
  let component: LineChartSectionComponent;
  let fixture: ComponentFixture<LineChartSectionComponent>;
  let dropdown: DropdownComponent<string>;

  const mockSeries: LineChartSeries[] = [];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineChartSectionComponent, getTranslocoModule()],
      providers: [provideCharts(withDefaultRegisterables())],
    }).compileComponents();

    fixture = TestBed.createComponent(LineChartSectionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('series', mockSeries);
    fixture.componentRef.setInput('titleKey', 'some.title.key');
    await fixture.whenStable();
    fixture.detectChanges();

    dropdown = fixture.debugElement.query(By.directive(DropdownComponent)).componentInstance;
  });

  it('defaults current aggregation to week', () => {
    expect(component.current()).toBe('week');
  });

  it('starts closed', () => {
    expect(component.isOpen()).toBe(false);
  });

  it('returns matching option for current aggregation', () => {
    expect(component.currentOption).toEqual(component.options[1]);
  });

  it('returns first option when no other matches', () => {
    component.current.set('invalid' as unknown as LineChartAggregation);
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
    expect(dropdown.ariaLabelKey()).toBe(
      'analysisResults.repositoryDetails.lineChartSectionDropdown',
    );
  });

  it('delegates close to the dropdown', () => {
    const spy = vi.spyOn(dropdown, 'close');
    component.close();
    expect(spy).toHaveBeenCalled();
  });

  it('updates current aggregation on select with new value', () => {
    component.select(['day']);
    expect(component.current()).toBe('day');
  });

  it('closes dropdown after selecting new value', () => {
    const spy = vi.spyOn(dropdown, 'close');
    component.select(['day']);
    expect(spy).toHaveBeenCalled();
  });

  it('keeps current aggregation when selecting the same value', () => {
    component.select(['week']);
    expect(component.current()).toBe('week');
  });

  it('closes dropdown when selecting the same value', () => {
    const spy = vi.spyOn(dropdown, 'close');
    component.select(['week']);
    expect(spy).toHaveBeenCalled();
  });

  it('closes dropdown without changing current when values are empty', () => {
    const spy = vi.spyOn(dropdown, 'close');
    component.select([]);
    expect(spy).toHaveBeenCalled();
    expect(component.current()).toBe('week');
  });

  it('reacts to dropdown selectionChange event', () => {
    dropdown.selectionChange.emit(['month']);
    expect(component.current()).toBe('month');
  });

  it('passes updated aggregation to the line chart', () => {
    component.select(['biweek']);
    fixture.detectChanges();
    const chart = fixture.debugElement.query(By.directive(LineChartComponent))
      .componentInstance as LineChartComponent;
    expect(chart.aggregation()).toBe('biweek');
  });
});
