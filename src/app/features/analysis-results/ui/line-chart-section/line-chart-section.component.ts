import { ChangeDetectionStrategy, Component, input, signal, viewChild } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';

import { DropdownComponent } from '@app/shared/dropdown/dropdown.component';
import type { DropdownOption } from '@app/shared/dropdown/dropdown.component';
import { LineChartComponent } from '../../ui/line-chart/line-chart.component';
import type {
  LineChartSeries,
  LineChartAggregationPeriod,
  LineChartAggregationMode,
} from '../../ui/line-chart/line-chart.component';

@Component({
  selector: 'app-line-chart-section',
  imports: [TranslocoPipe, LineChartComponent, DropdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './line-chart-section.component.html',
  styleUrl: './line-chart-section.component.scss',
})
export class LineChartSectionComponent {
  series = input.required<LineChartSeries[]>();
  titleKey = input.required<string>();
  modes = input<LineChartAggregationMode[]>(['sum']);

  private readonly dropdown = viewChild.required(DropdownComponent);
  readonly selectedPeriod = signal<LineChartAggregationPeriod>('week');
  readonly isOpen = signal(false);

  readonly options: DropdownOption<LineChartAggregationPeriod>[] = [
    { value: 'day', labelKey: 'analysisResults.repositoryDetails.aggregationDay' },
    { value: 'week', labelKey: 'analysisResults.repositoryDetails.aggregationWeek' },
    { value: 'biweek', labelKey: 'analysisResults.repositoryDetails.aggregationBiweek' },
    { value: 'month', labelKey: 'analysisResults.repositoryDetails.aggregationMonth' },
  ];

  get currentOption(): DropdownOption<LineChartAggregationPeriod> {
    return this.options.find((o) => o.value === this.selectedPeriod()) ?? this.options[0];
  }

  close(): void {
    this.dropdown().close();
  }

  select(value: LineChartAggregationPeriod): void {
    if (value === this.selectedPeriod()) {
      this.close();
      return;
    }

    this.selectedPeriod.set(value);
    this.close();
  }
}
