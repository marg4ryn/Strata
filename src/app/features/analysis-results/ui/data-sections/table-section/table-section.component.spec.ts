import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { getTranslocoModule } from '@app/core/transloco';
import { TableSectionComponent } from './table-section.component';
import type { TableColumn, TableRows } from './table-section.component';

describe('TableSectionComponent', () => {
  let fixture: ComponentFixture<TableSectionComponent>;

  const columns: TableColumn[] = [
    { headerKey: 'Name', valueType: 'text', tooltipKey: 'tooltip.name' },
    { headerKey: 'Count', valueType: 'number' },
  ];

  const rows: TableRows[] = [
    [
      { value: 'Banana', valueType: 'text' },
      { value: 5, valueType: 'number' },
    ],
    [
      { value: 'Apple', valueType: 'text' },
      { value: 10, valueType: 'number' },
    ],
    [
      { value: 'Cherry', valueType: 'text' },
      { value: 1, valueType: 'number' },
    ],
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableSectionComponent, getTranslocoModule()],
    }).compileComponents();

    fixture = TestBed.createComponent(TableSectionComponent);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rows', rows);
    fixture.detectChanges();
  });

  function headerCells() {
    return fixture.debugElement.queryAll(By.css('th.table-section__header-cell'));
  }

  function bodyRows() {
    return fixture.debugElement.queryAll(By.css('tr.table-section__row')).slice(1);
  }

  function cellValues(rowIndex: number) {
    return bodyRows().map((row) =>
      row.queryAll(By.css('td'))[rowIndex].nativeElement.textContent.trim(),
    );
  }

  it('shows "no data" state when there are no columns', () => {
    fixture.componentRef.setInput('columns', []);
    fixture.componentRef.setInput('rows', []);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.table-section__no-data'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('.table-section__table'))).toBeNull();
  });

  it('renders a header cell per column, a row per data row, and a focusable, tooltip-carrying header', () => {
    expect(headerCells().length).toBe(columns.length);
    expect(bodyRows().length).toBe(rows.length);
    expect(headerCells()[0].attributes['tabindex']).toBe('0');
    expect(headerCells()[0].query(By.css('app-info-tooltip'))).toBeTruthy();
    expect(headerCells()[1].query(By.css('app-info-tooltip'))).toBeNull();
  });

  it('sorts numeric column descending then ascending on repeated clicks, updating aria-sort and icon', () => {
    headerCells()[1].triggerEventHandler('click', {});
    fixture.detectChanges();

    expect(cellValues(1)).toEqual(['10', '5', '1']);
    expect(headerCells()[1].attributes['aria-sort']).toBe('descending');
    expect(
      fixture.debugElement.query(By.css('.table-section__sort-icon')).classes[
        'table-section__sort-icon--desc'
      ],
    ).toBe(true);

    headerCells()[1].triggerEventHandler('click', {});
    fixture.detectChanges();

    expect(cellValues(1)).toEqual(['1', '5', '10']);
    expect(headerCells()[1].attributes['aria-sort']).toBe('ascending');
    expect(
      fixture.debugElement.query(By.css('.table-section__sort-icon')).classes[
        'table-section__sort-icon--desc'
      ],
    ).toBeFalsy();
  });

  it('sorts text column alphabetically and reset direction to descending when switching columns', () => {
    headerCells()[1].triggerEventHandler('click', {});
    headerCells()[1].triggerEventHandler('click', {});
    headerCells()[0].triggerEventHandler('click', {});
    fixture.detectChanges();

    expect(headerCells()[0].attributes['aria-sort']).toBe('descending');
    expect(cellValues(0)).toEqual(['Cherry', 'Banana', 'Apple']);
  });

  it('sorts via Enter and Space keydown events', () => {
    headerCells()[1].triggerEventHandler('keydown.enter', {});
    fixture.detectChanges();
    expect(cellValues(1)).toEqual(['10', '5', '1']);

    headerCells()[0].triggerEventHandler('keydown.space', { preventDefault: () => {} });
    fixture.detectChanges();
    expect(headerCells()[0].attributes['aria-sort']).toBe('descending');
  });

  it('toggles sort direction back to descending on a third click of the same column', () => {
    headerCells()[1].triggerEventHandler('click', {});
    headerCells()[1].triggerEventHandler('click', {});
    headerCells()[1].triggerEventHandler('click', {});
    fixture.detectChanges();

    expect(cellValues(1)).toEqual(['10', '5', '1']);
    expect(headerCells()[1].attributes['aria-sort']).toBe('descending');
  });
});
