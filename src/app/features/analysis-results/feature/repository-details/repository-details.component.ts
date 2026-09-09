import { ChangeDetectionStrategy, Component, inject, input, computed } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';

import { pageResource } from '../../utils/page-resource/page-resource';
import { ResourcePageComponent } from '../resource-page/resource-page.component';
import { AnalysisResultsFacade } from '../../analysis-results.facade';
import { DataListSectionComponent } from '../../ui/data-sections/data-list-section/data-list-section.component';
import { DoughnutChartSectionComponent } from '../../ui/data-sections/doughnut-chart-section/doughnut-chart-section.component';
import { LineChartSectionComponent } from '../../ui/data-sections/line-chart-section/line-chart-section.component';
import type { LineChartDataPoint } from '../../ui/charts/line-chart/line-chart.component';

@Component({
  selector: 'app-repository-details',
  imports: [
    ResourcePageComponent,
    TranslocoPipe,
    DataListSectionComponent,
    DoughnutChartSectionComponent,
    LineChartSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  uniqueAuthorsSeries = computed<LineChartDataPoint[]>(
    () =>
      this.resource.value()?.trends.map((entry) => ({
        date: entry.date,
        value: entry.uniqueAuthors,
      })) ?? [],
  );

  activeAuthorsSeries = computed<LineChartDataPoint[]>(
    () =>
      this.resource.value()?.trends.map((entry) => ({
        date: entry.date,
        value: entry.activeAuthors,
      })) ?? [],
  );

  linesChangedSeries = computed<LineChartDataPoint[]>(
    () =>
      this.resource.value()?.trends.map((entry) => ({
        date: entry.date,
        value: entry.linesAdded + entry.linesDeleted,
      })) ?? [],
  );

  totalLinesSeries = computed(() => {
    let totalLines = 0;

    return (
      this.resource
        .value()
        ?.trends.sort((a, b) => a.date.localeCompare(b.date))
        .map((entry) => {
          totalLines += entry.linesAdded - entry.linesDeleted;

          return {
            date: entry.date,
            value: totalLines,
          };
        }) ?? []
    );
  });
}
