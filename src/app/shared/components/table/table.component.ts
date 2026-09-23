import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { InfoTooltipComponent } from '../info-tooltip/info-tooltip.component';
import { LocalizedNumberPipe } from '../../pipes';

export type TableItemValueType = 'text' | 'number' | 'percent';

export interface TableColumn {
  headerKey: string;
  tooltipKey?: string;
  valueType: TableItemValueType;
}

export type TableRow =
  | { value: string; valueType: 'text' }
  | { value: number; valueType: 'number' }
  | { value: number; valueType: 'percent' };

export type TableRows = TableRow[];

export type TableRowKey = string | number;

type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-table',
  imports: [InfoTooltipComponent, LocalizedNumberPipe, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './table.component.scss',
  templateUrl: './table.component.html',
})
export class TableComponent {
  columns = input.required<TableColumn[]>();
  rows = input.required<TableRows[]>();
  clickable = input<boolean>(false);
  compact = input<boolean>(false);
  sortable = input<boolean>(true);

  selectedRowKey = model<TableRowKey | null>(null);
  focusedRowKey = model<TableRowKey | null>(null);

  sortColumnIndex = signal<number | null>(null);
  sortDirection = signal<SortDirection>('desc');

  sortedRows = computed(() => {
    const colIndex = this.sortColumnIndex();
    const direction = this.sortDirection();
    const rows = this.rows();

    if (colIndex === null) return rows;

    return [...rows].sort((a, b) => {
      const cellA = a[colIndex];
      const cellB = b[colIndex];
      const factor = direction === 'asc' ? 1 : -1;

      if (cellA.valueType === 'number' && cellB.valueType === 'number') {
        return (cellA.value - cellB.value) * factor;
      }

      if (cellA.valueType === 'percent' && cellB.valueType === 'percent') {
        return (cellA.value - cellB.value) * factor;
      }

      return String(cellA.value).localeCompare(String(cellB.value)) * factor;
    });
  });

  onSortColumn(colIndex: number): void {
    if (!this.sortable()) return;

    if (this.sortColumnIndex() === colIndex) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumnIndex.set(colIndex);
      this.sortDirection.set('desc');
    }
  }

  rowKey(row: TableRows): TableRowKey {
    return row[0]?.value ?? '';
  }

  setFocusedRow(row: TableRows | null): void {
    if (this.clickable()) {
      this.focusedRowKey.set(row ? this.rowKey(row) : null);
    }
  }

  selectRow(row: TableRows): void {
    if (this.clickable()) {
      const key = this.rowKey(row);
      this.selectedRowKey.set(this.selectedRowKey() === key ? null : key);
    }
  }
}
