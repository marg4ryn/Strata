import { Component, input, signal, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { InfoTooltipComponent } from '@app/shared/components';
import { LocalizedNumberPipe } from '@app/shared/pipes';
import { DataSectionComponent } from '../data-section/data-section.component';

export type TableItemValueType = 'number' | 'text';

export interface TableColumn {
  headerKey: string;
  tooltipKey?: string;
  valueType: TableItemValueType;
}

export type TableRow =
  { value: number; valueType: 'number' } | { value: string; valueType: 'text' };

export type TableRows = TableRow[];

type SortDirection = 'asc' | 'desc';

@Component({
  imports: [DataSectionComponent, InfoTooltipComponent, TranslocoPipe, LocalizedNumberPipe],
  selector: 'app-table-section',
  styleUrl: './table-section.component.scss',
  templateUrl: './table-section.component.html',
})
export class TableSectionComponent {
  columns = input.required<TableColumn[]>();
  rows = input.required<TableRows[]>();

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

      return String(cellA.value).localeCompare(String(cellB.value)) * factor;
    });
  });

  onSortColumn(colIndex: number): void {
    if (this.sortColumnIndex() === colIndex) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumnIndex.set(colIndex);
      this.sortDirection.set('desc');
    }
  }
}
