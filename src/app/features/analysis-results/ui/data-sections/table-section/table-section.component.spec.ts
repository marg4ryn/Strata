import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { getTranslocoModule } from '@app/core/transloco';
import { TableComponent } from '@app/shared/components';
import { TableSectionComponent } from './table-section.component';
import type { TableColumn, TableRows } from './table-section.component';

describe('TableSectionComponent', () => {
  let fixture: ComponentFixture<TableSectionComponent>;

  const columns: TableColumn[] = [
    { headerKey: 'Name', valueType: 'text' },
    { headerKey: 'Count', valueType: 'number' },
  ];

  const rows: TableRows[] = [
    [
      { value: 'Banana', valueType: 'text' },
      { value: 5, valueType: 'number' },
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

  it('shows "no data" state when there are no columns', () => {
    fixture.componentRef.setInput('columns', []);
    fixture.componentRef.setInput('rows', []);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.table-section__no-data'))).toBeTruthy();
    expect(fixture.debugElement.query(By.directive(TableComponent))).toBeNull();
  });

  it('renders app-table with columns and rows when data is present', () => {
    const table = fixture.debugElement.query(By.directive(TableComponent));

    expect(table).toBeTruthy();
    expect(table.componentInstance.columns()).toEqual(columns);
    expect(table.componentInstance.rows()).toEqual(rows);
    expect(fixture.debugElement.query(By.css('.table-section__no-data'))).toBeNull();
  });

  it('wraps content in a scroll container', () => {
    expect(fixture.debugElement.query(By.css('.table-section__scroll'))).toBeTruthy();
  });
});
