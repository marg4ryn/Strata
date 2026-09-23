import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { TableComponent } from '@app/shared/components';
import type { TableColumn, TableRows } from '@app/shared/components';
import { DataSectionComponent } from '../data-section/data-section.component';

export type { TableColumn, TableRows };

@Component({
  imports: [DataSectionComponent, TableComponent, TranslocoPipe],
  selector: 'app-table-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './table-section.component.scss',
  templateUrl: './table-section.component.html',
})
export class TableSectionComponent {
  columns = input.required<TableColumn[]>();
  rows = input.required<TableRows[]>();
}
