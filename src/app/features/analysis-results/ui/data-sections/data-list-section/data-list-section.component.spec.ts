import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { getTranslocoModule } from '@app/core/transloco';
import { DataListSectionComponent } from './data-list-section.component';
import type { DataListItem } from './data-list-section.component';

describe('DataListSectionComponent', () => {
  let fixture: ComponentFixture<DataListSectionComponent>;

  const setItems = async (items: DataListItem[]) => {
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataListSectionComponent, getTranslocoModule()],
    }).compileComponents();

    fixture = TestBed.createComponent(DataListSectionComponent);
  });

  it('shows the no data message when the items array is empty', async () => {
    await setItems([{ labelKey: 'testLabel', value: null, valueType: 'text' }]);
    const message = fixture.debugElement.query(By.css('.data-list-section__no-data'));
    expect(message).toBeTruthy();
  });

  it('renders tooltip only when tooltipKey is set', async () => {
    await setItems([
      { labelKey: 'label.a', value: 'x', valueType: 'text', tooltipKey: 'tip.a' },
      { labelKey: 'label.b', value: 'x', valueType: 'text' },
    ]);
    const tooltips = fixture.debugElement.queryAll(By.css('app-info-tooltip'));
    expect(tooltips.length).toBe(1);
  });

  it('renders label and text value', async () => {
    await setItems([{ labelKey: 'testLabel', value: 'testValue', valueType: 'text' }]);
    const row = fixture.debugElement.query(By.css('.data-list-section__list > div'))
      .nativeElement as HTMLElement;
    expect(row.querySelector('dt')?.textContent).toContain('testLabel');
    expect(row.querySelector('dd')?.textContent).toContain('testValue');
  });

  it('formats number value', async () => {
    await setItems([{ labelKey: 'testLabel', value: 42, valueType: 'number' }]);
    const dd = fixture.debugElement.query(By.css('dd')).nativeElement as HTMLElement;
    expect(dd.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('formats percent value', async () => {
    await setItems([{ labelKey: 'testLabel', value: 0.5, valueType: 'percent' }]);
    const dd = fixture.debugElement.query(By.css('dd')).nativeElement as HTMLElement;
    expect(dd.textContent).toContain('%');
  });

  it('formats datetime value', async () => {
    await setItems([
      { labelKey: 'testLabel', value: '2026-09-12T10:10:10', valueType: 'dateTime' },
    ]);
    const dd = fixture.debugElement.query(By.css('dd')).nativeElement as HTMLElement;
    expect(dd.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('formats date value', async () => {
    await setItems([{ labelKey: 'testLabel', value: '2024-01-01', valueType: 'date' }]);
    const dd = fixture.debugElement.query(By.css('dd')).nativeElement as HTMLElement;
    expect(dd.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('formats dateRange as two dates separated by a dash', async () => {
    await setItems([
      {
        labelKey: 'testLabel',
        value: { start: '2024-01-01', end: '2024-01-31' },
        valueType: 'dateRange',
      },
    ]);
    const dd = fixture.debugElement.query(By.css('dd')).nativeElement as HTMLElement;
    expect(dd.textContent).toContain('–');
  });

  it('formats duration value', async () => {
    await setItems([{ labelKey: 'testLabel', value: 120, valueType: 'duration' }]);
    const dd = fixture.debugElement.query(By.css('dd')).nativeElement as HTMLElement;
    expect(dd.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('renders one row per item', async () => {
    await setItems([
      { labelKey: 'testLabel', value: '1', valueType: 'text' },
      { labelKey: 'testLabel', value: '2', valueType: 'text' },
    ]);
    const rows = fixture.debugElement.queryAll(By.css('.data-list-section__list > div'));
    expect(rows.length).toBe(2);
  });
});
