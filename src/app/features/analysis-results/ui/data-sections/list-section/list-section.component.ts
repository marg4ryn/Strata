import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { LocalizedDurationPipe, LocalizedNumberPipe, LocalizedDatePipe } from '@app/shared/pipes';
import { InfoTooltipComponent } from '@app/shared/components';
import { DataSectionComponent } from '../data-section/data-section.component';

export type ListItemValueType =
  'number' | 'percent' | 'date' | 'dateTime' | 'dateRange' | 'duration' | 'text';

export interface DataListItem {
  labelKey: string;
  tooltipKey?: string;
  value: unknown;
  valueType: ListItemValueType;
}

export interface DateRangeValue {
  start: Date | string | number;
  end: Date | string | number;
}

@Component({
  selector: 'app-list-section',
  imports: [
    DataSectionComponent,
    InfoTooltipComponent,
    TranslocoPipe,
    LocalizedDatePipe,
    LocalizedNumberPipe,
    LocalizedDurationPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './list-section.component.html',
  styleUrl: './list-section.component.scss',
})
export class ListSectionComponent {
  items = input.required<DataListItem[]>();

  asDateRange(value: unknown): DateRangeValue {
    return value as DateRangeValue;
  }

  asDateValue(value: unknown): string | number | Date | null | undefined {
    return value as string | number | Date | null | undefined;
  }

  asNumericValue(value: unknown): number | null | undefined {
    return value as number | null | undefined;
  }
}
