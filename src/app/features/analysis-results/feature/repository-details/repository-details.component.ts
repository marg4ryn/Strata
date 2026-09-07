import { Component, inject, input, computed, signal } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';

import { LocalizedDurationPipe } from '@app/shared/localized-duration-pipe/localized-duration.pipe';
import { LocalizedNumberPipe } from '@app/shared/localized-number-pipe/localized-number.pipe';
import { LocalizedDatePipe } from '@app/shared/localized-date-pipe/localized-date.pipe';
import { InfoTooltipComponent } from '@app/shared/info-tooltip/info-tooltip.component';
import { pageResource } from '../../utils/page-resource/page-resource';
import { ResourcePageComponent } from '../resource-page/resource-page.component';
import { AnalysisResultsFacade } from '../../analysis-results.facade';
import { DoughnutChartComponent } from '../../ui/doughnut-chart/doughnut-chart.component';
import { LineChartSectionComponent } from '../../ui/line-chart-section/line-chart-section.component';
import type { LineChartDataPoint } from '../../ui/line-chart/line-chart.component';

@Component({
  selector: 'app-repository-details',
  imports: [
    ResourcePageComponent,
    TranslocoPipe,
    LocalizedDatePipe,
    LocalizedNumberPipe,
    LocalizedDurationPipe,
    DoughnutChartComponent,
    LineChartSectionComponent,
    InfoTooltipComponent,
  ],
  templateUrl: './repository-details.component.html',
  styleUrl: './repository-details.component.scss',
})
export class RepositoryDetailsComponent {
  private readonly facade = inject(AnalysisResultsFacade);

  id = input.required<string>();

  resource = pageResource(
    () => this.facade.getRepositorySummary(this.id()),
    () => this.id(),
  );

  commitSeries = computed<LineChartDataPoint[]>(
    () =>
      this.resource.value()?.trends.map((entry) => ({
        date: entry.date,
        value: entry.commits,
      })) ?? [],
  );
}
