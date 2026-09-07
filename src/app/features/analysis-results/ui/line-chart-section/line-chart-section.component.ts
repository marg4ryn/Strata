import { Component, input, signal, ElementRef, viewChild } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';

import { DropdownComponent, DropdownOption } from '@app/shared/dropdown/dropdown.component';
import {
  LineChartComponent,
  LineChartAggregation,
  LineChartSeries,
} from '../../ui/line-chart/line-chart.component';

@Component({
  selector: 'app-line-chart-section',
  imports: [TranslocoPipe, LineChartComponent, DropdownComponent],
  templateUrl: './line-chart-section.component.html',
  styleUrl: './line-chart-section.component.scss',
})
export class LineChartSectionComponent {
  series = input.required<LineChartSeries[]>();
  titleKey = input.required<string>();

  private readonly dropdown = viewChild.required(DropdownComponent);
  readonly current = signal<LineChartAggregation>('week');
  readonly isOpen = signal(false);

  readonly options: DropdownOption<LineChartAggregation>[] = [
    { value: 'day', label: 'day', labelKey: 'analysisResults.repositoryDetails.aggregationDay' },
    { value: 'week', label: 'week', labelKey: 'analysisResults.repositoryDetails.aggregationWeek' },
    {
      value: 'biweek',
      label: 'biweek',
      labelKey: 'analysisResults.repositoryDetails.aggregationBiweek',
    },
    {
      value: 'month',
      label: 'month',
      labelKey: 'analysisResults.repositoryDetails.aggregationMonth',
    },
  ];

  get currentOption(): DropdownOption<LineChartAggregation> {
    return this.options.find((o) => o.value === this.current()) ?? this.options[0];
  }

  toggle(): void {
    this.dropdown().toggle();
  }

  close(): void {
    this.dropdown().close();
  }

  select(values: readonly LineChartAggregation[]): void {
    const value = values[0];
    if (value === undefined || value === this.current()) {
      this.close();
      return;
    }

    this.current.set(value);
    this.close();
  }
}
