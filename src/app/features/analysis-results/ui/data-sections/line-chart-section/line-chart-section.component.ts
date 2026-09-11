import { ChangeDetectionStrategy, Component, input, signal, viewChild } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { DropdownComponent } from '@app/shared/dropdown/dropdown.component';
import type { DropdownOption } from '@app/shared/dropdown/dropdown.component';
import { DataSectionComponent } from '../data-section/data-section.component';
import { LineChartComponent } from '../../charts/line-chart/line-chart.component';
import type {
  LineChartSeries,
  LineChartAggregationPeriod,
  LineChartAggregationMode,
} from '../../charts/line-chart/line-chart.component';

@Component({
  selector: 'app-line-chart-section',
  imports: [LineChartComponent, DropdownComponent, DataSectionComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './line-chart-section.component.html',
  styleUrl: './line-chart-section.component.scss',
})
export class LineChartSectionComponent {
  series = input.required<LineChartSeries[]>();
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
