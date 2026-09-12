import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { LocalizedDurationPipe } from '@app/shared/pipes/localized-duration/localized-duration.pipe';
import { LocalizedNumberPipe } from '@app/shared/pipes/localized-number/localized-number.pipe';
import { LocalizedDatePipe } from '@app/shared/pipes/localized-date/localized-date.pipe';
import { InfoTooltipComponent } from '@app/shared/components/info-tooltip/info-tooltip.component';
import { DataSectionComponent } from '../data-section/data-section.component';

export type DataListItemValueType =
  | 'number'
  | 'percent'
  | 'date'
  | 'dateTime'
  | 'dateRange'
  | 'duration'
  | 'text';

export interface DataListItem {
  labelKey: string;
  tooltipKey?: string;
  value: unknown;
  valueType: DataListItemValueType;
}

export interface DateRangeValue {
  start: Date | string | number;
  end: Date | string | number;
}

@Component({
  selector: 'app-data-list-section',
  imports: [
    DataSectionComponent,
    InfoTooltipComponent,
    TranslocoPipe,
    LocalizedDatePipe,
    LocalizedNumberPipe,
    LocalizedDurationPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-list-section.component.html',
  styleUrl: './data-list-section.component.scss',
})
export class DataListSectionComponent {
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
