import { ChangeDetectionStrategy, Component, input, signal, viewChild } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';

import { DropdownComponent } from '@app/shared/components';
import type { DropdownOption } from '@app/shared/components';
import { DataSectionComponent } from '../data-section/data-section.component';
import { BarChartComponent } from '../../charts/bar-chart/bar-chart.component';
import type { ChartAggregationPeriod, ChartSeries } from '../../../utils/aggregation/aggregation';

@Component({
  selector: 'app-bar-chart-section',
  imports: [BarChartComponent, DropdownComponent, DataSectionComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './bar-chart-section.component.scss',
  templateUrl: './bar-chart-section.component.html',
})
export class BarChartSectionComponent {
  series = input.required<ChartSeries[]>();

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
