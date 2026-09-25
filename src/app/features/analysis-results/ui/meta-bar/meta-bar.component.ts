import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { LocalizedDatePipe } from '@app/shared/pipes';
import type { ISODateString } from '@app/shared/utils';

export type DateRange = {
  startDate: ISODateString;
  endDate: ISODateString;
};

@Component({
  selector: 'app-meta-bar',
  imports: [LocalizedDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './meta-bar.component.scss',
  templateUrl: './meta-bar.component.html',
})
export class MetaBarComponent {
  repoName = input<string>('');
  dateRange = input<DateRange | null>(null);
}
