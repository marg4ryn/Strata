import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';

import { DataSectionComponent } from '../data-section/data-section.component';
import { DoughnutChartComponent } from '../../charts/doughnut-chart/doughnut-chart.component';
import type { DoughnutChartItem } from '../../charts/doughnut-chart/doughnut-chart.component';

@Component({
  selector: 'app-doughnut-chart-section',
  imports: [DoughnutChartComponent, DataSectionComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './doughnut-chart-section.component.html',
  styleUrl: './doughnut-chart-section.component.scss',
})
export class DoughnutChartSectionComponent {
  items = input.required<DoughnutChartItem[]>();
}
