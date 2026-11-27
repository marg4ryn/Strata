import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { getTranslocoModule } from '@app/core/transloco';
import { TableComponent } from './table.component';
import type { TableColumn, TableRows } from './table.component';

describe('TableComponent', () => {
  let fixture: ComponentFixture<TableComponent>;

  const columns: TableColumn[] = [
    { headerKey: 'Name', valueType: 'text', tooltipKey: 'tooltip.name' },
    { headerKey: 'Count', valueType: 'number' },
    { headerKey: 'Share', valueType: 'percent' },
  ];

  const rows: TableRows[] = [
    [
      { value: 'Banana', valueType: 'text' },
      { value: 5, valueType: 'number' },
      { value: 0.5, valueType: 'percent' },
    ],
    [
      { value: 'Apple', valueType: 'text' },
      { value: 10, valueType: 'number' },
      { value: 0.1, valueType: 'percent' },
    ],
    [
      { value: 'Cherry', valueType: 'text' },
      { value: 1, valueType: 'number' },
      { value: 0.9, valueType: 'percent' },
    ],
  ];

  function headerCells() {
    return fixture.debugElement.queryAll(By.css('th.table__header-cell'));
  }

  function bodyRows() {
    return fixture.debugElement.queryAll(By.css('tbody tr.table__row'));
  }

  function cellValues(colIndex: number) {
    return bodyRows().map((row) =>
      row.queryAll(By.css('td'))[colIndex].nativeElement.textContent.trim(),
    );
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableComponent, getTranslocoModule()],
    }).compileComponents();

    fixture = TestBed.createComponent(TableComponent);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rows', rows);
    fixture.detectChanges();
  });

  it('falls back to empty string as row key when first cell has no value', () => {
    expect(fixture.componentInstance.rowKey([])).toBe('');
  });

  it('renders a header cell per column and a row per data row', () => {
    expect(headerCells().length).toBe(columns.length);
    expect(bodyRows().length).toBe(rows.length);
  });

  it('shows tooltip only for columns with tooltipKey and sets tabindex when sortable', () => {
    expect(headerCells()[0].query(By.css('app-info-tooltip'))).toBeTruthy();
    expect(headerCells()[1].query(By.css('app-info-tooltip'))).toBeNull();
    expect(headerCells()[0].attributes['tabindex']).toBe('0');
  });

  it('formats number and percent cells via localizedNumber, leaves text as-is', () => {
    expect(cellValues(0)).toEqual(['Banana', 'Apple', 'Cherry']);
    expect(cellValues(1).every((v) => /^\d/.test(v))).toBe(true);
    expect(cellValues(2).some((v) => v.includes('%'))).toBe(true);
  });

  it('sorts numeric column descending then ascending on repeated clicks', () => {
    headerCells()[1].triggerEventHandler('click', {});
    fixture.detectChanges();

    expect(cellValues(1)).toEqual(['10', '5', '1']);
    expect(headerCells()[1].attributes['aria-sort']).toBe('descending');
    expect(
      fixture.debugElement.query(By.css('.table__sort-icon')).classes['table__sort-icon--desc'],
    ).toBe(true);

    headerCells()[1].triggerEventHandler('click', {});
    fixture.detectChanges();

    expect(cellValues(1)).toEqual(['1', '5', '10']);
    expect(headerCells()[1].attributes['aria-sort']).toBe('ascending');
  });

  it('toggles sort direction back to descending on a third click of the same column', () => {
    headerCells()[1].triggerEventHandler('click', {});
    headerCells()[1].triggerEventHandler('click', {});
    headerCells()[1].triggerEventHandler('click', {});
    fixture.detectChanges();

    expect(cellValues(1)).toEqual(['10', '5', '1']);
    expect(headerCells()[1].attributes['aria-sort']).toBe('descending');
  });

  it('sorts text column alphabetically and resets direction to descending on column switch', () => {
    headerCells()[1].triggerEventHandler('click', {});
    headerCells()[1].triggerEventHandler('click', {});
    headerCells()[0].triggerEventHandler('click', {});
    fixture.detectChanges();

    expect(headerCells()[0].attributes['aria-sort']).toBe('descending');
    expect(cellValues(0)).toEqual(['Cherry', 'Banana', 'Apple']);
  });

  it('sorts percent column numerically', () => {
    headerCells()[2].triggerEventHandler('click', {});
    fixture.detectChanges();

    expect(cellValues(2).map(parseFloat)).toEqual(
      [0.9, 0.5, 0.1].map((v) => Math.round(v * 100) / 100),
    );
  });

  it('sorts via Enter and Space keydown', () => {
    headerCells()[1].triggerEventHandler('keydown.enter', {});
    fixture.detectChanges();
    expect(cellValues(1)).toEqual(['10', '5', '1']);

    headerCells()[0].triggerEventHandler('keydown.space', { preventDefault: () => {} });
    fixture.detectChanges();
    expect(headerCells()[0].attributes['aria-sort']).toBe('descending');
  });

  it('does not sort when sortable is false', async () => {
    fixture.componentRef.setInput('sortable', false);
    fixture.detectChanges();

    expect(headerCells()[1].attributes['tabindex']).toBeFalsy();

    headerCells()[1].triggerEventHandler('click', {});
    fixture.detectChanges();

    expect(cellValues(1)).toEqual(['5', '10', '1']);
    expect(headerCells()[1].attributes['aria-sort']).toBe('none');
  });

  it('applies compact class when compact is true', async () => {
    fixture.componentRef.setInput('compact', true);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('table.table--compact'))).toBeTruthy();
  });

  describe('clickable rows', () => {
    beforeEach(async () => {
      fixture.componentRef.setInput('clickable', true);
      fixture.detectChanges();
    });

    it('marks rows as focusable/button when clickable', () => {
      expect(bodyRows()[0].attributes['tabindex']).toBe('0');
      expect(bodyRows()[0].attributes['role']).toBe('button');
    });

    it('sets focusedRowKey on hover and clears it on mouse leave', () => {
      bodyRows()[0].triggerEventHandler('mouseenter', {});
      fixture.detectChanges();
      expect(fixture.componentInstance.focusedRowKey()).toBe('Banana');
      expect(bodyRows()[0].classes['table__row--focused']).toBe(true);

      bodyRows()[0].triggerEventHandler('mouseleave', {});
      fixture.detectChanges();
      expect(fixture.componentInstance.focusedRowKey()).toBeNull();
    });

    it('sets focusedRowKey on focus and clears it on blur', () => {
      bodyRows()[0].triggerEventHandler('focus', {});
      fixture.detectChanges();
      expect(fixture.componentInstance.focusedRowKey()).toBe('Banana');
      expect(bodyRows()[0].classes['table__row--focused']).toBe(true);

      bodyRows()[0].triggerEventHandler('blur', {});
      fixture.detectChanges();
      expect(fixture.componentInstance.focusedRowKey()).toBeNull();
    });

    it('toggles selectedRowKey on click, and via Enter/Space keys', () => {
      bodyRows()[0].triggerEventHandler('click', {});
      fixture.detectChanges();
      expect(fixture.componentInstance.selectedRowKey()).toBe('Banana');
      expect(bodyRows()[0].classes['table__row--selected']).toBe(true);

      bodyRows()[0].triggerEventHandler('click', {});
      fixture.detectChanges();
      expect(fixture.componentInstance.selectedRowKey()).toBeNull();

      bodyRows()[1].triggerEventHandler('keydown.space', { preventDefault: () => {} });
      fixture.detectChanges();
      expect(fixture.componentInstance.selectedRowKey()).toBe('Apple');
    });

    it('toggles selectedRowKey via keydown.enter', () => {
      bodyRows()[0].triggerEventHandler('keydown.enter', {});
      fixture.detectChanges();
      expect(fixture.componentInstance.selectedRowKey()).toBe('Banana');
    });
  });

  it('does not react to hover or click when not clickable', () => {
    bodyRows()[0].triggerEventHandler('mouseenter', {});
    bodyRows()[0].triggerEventHandler('click', {});
    fixture.detectChanges();

    expect(fixture.componentInstance.focusedRowKey()).toBeNull();
    expect(fixture.componentInstance.selectedRowKey()).toBeNull();
    expect(bodyRows()[0].attributes['tabindex']).toBeFalsy();
    expect(bodyRows()[0].attributes['role']).toBeFalsy();
  });
});
