import { ChangeDetectionStrategy, Component, input, signal, viewChild } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';

import { DropdownComponent } from '@app/shared/components';
import type { DropdownOption } from '@app/shared/components';
import { DataSectionComponent } from '../data-section/data-section.component';
import { LineChartComponent } from '../../charts/line-chart/line-chart.component';
import type {
  ChartAggregationMode,
  ChartAggregationPeriod,
  ChartSeries,
} from '../../../utils/aggregation/aggregation.utils';

@Component({
  selector: 'app-line-chart-section',
  imports: [LineChartComponent, DropdownComponent, DataSectionComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './line-chart-section.component.html',
  styleUrl: './line-chart-section.component.scss',
})
export class LineChartSectionComponent {
  series = input.required<ChartSeries[]>();
  modes = input<ChartAggregationMode[]>(['sum']);

  private readonly dropdown = viewChild.required<DropdownComponent<string>>('dropdown');
  readonly ariaLabelKey = marker('analysisResults.aggregation.ariaLabel');
  readonly selectedPeriod = signal<ChartAggregationPeriod>('week');
  readonly isOpen = signal(false);

  readonly options: DropdownOption<ChartAggregationPeriod>[] = [
    { value: 'day', labelKey: marker('analysisResults.aggregation.day') },
    { value: 'week', labelKey: marker('analysisResults.aggregation.week') },
    { value: 'biweek', labelKey: marker('analysisResults.aggregation.biweek') },
    { value: 'month', labelKey: marker('analysisResults.aggregation.month') },
  ];

  get currentOption(): DropdownOption<ChartAggregationPeriod> {
    return this.options.find((o) => o.value === this.selectedPeriod()) ?? this.options[0];
  }

  close(): void {
    this.dropdown().close();
  }

  select(value: ChartAggregationPeriod): void {
    if (value === this.selectedPeriod()) {
      this.close();
      return;
    }

    this.selectedPeriod.set(value);
    this.close();
  }
}
