import { ChangeDetectionStrategy, Component, inject, input, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { InfoTooltipComponent } from '@app/shared/components';
import { pageResource } from '../../utils/page-resource/page-resource';
import { ResourcePageComponent } from '../../ui/resource/resource-page/resource-page.component';
import { AnalysisResultsFacade } from '../../analysis-results.facade';
import { ListSectionComponent } from '../../ui/data-sections/list-section/list-section.component';
import { DoughnutChartSectionComponent } from '../../ui/data-sections/doughnut-chart-section/doughnut-chart-section.component';
import { LineChartSectionComponent } from '../../ui/data-sections/line-chart-section/line-chart-section.component';
import { BarChartSectionComponent } from '../../ui/data-sections/bar-chart-section/bar-chart-section.component';
import { TableSectionComponent } from '../../ui/data-sections/table-section/table-section.component';
import type { ChartDataPoint } from '../../utils/aggregation/aggregation';
import type { TableRows } from '../../ui/data-sections/table-section/table-section.component';

@Component({
  selector: 'app-repository-details',
  imports: [
    ResourcePageComponent,
    TranslocoPipe,
    ListSectionComponent,
    DoughnutChartSectionComponent,
    LineChartSectionComponent,
    BarChartSectionComponent,
    TableSectionComponent,
    InfoTooltipComponent,
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

  commitSeries = computed<ChartDataPoint[]>(
    () =>
      this.resource.value()?.trends.map((e) => ({
        date: e.date,
        value: e.commits,
      })) ?? [],
  );

  uniqueAuthorsSeries = computed<ChartDataPoint[]>(
    () =>
      this.resource.value()?.trends.map((e) => ({
        date: e.date,
        value: e.uniqueAuthors,
      })) ?? [],
  );

  activeAuthorsSeries = computed<ChartDataPoint[]>(
    () =>
      this.resource.value()?.trends.map((e) => ({
        date: e.date,
        value: e.activeAuthors,
      })) ?? [],
  );

  linesChangedSeries = computed<ChartDataPoint[]>(
    () =>
      this.resource.value()?.trends.map((e) => ({
        date: e.date,
        value: e.linesAdded + e.linesDeleted,
      })) ?? [],
  );

  totalLinesSeries = computed<ChartDataPoint[]>(() => {
    let totalLines = 0;

    return (
      this.resource
        .value()
        ?.trends.slice().sort((a, b) => a.date.localeCompare(b.date))
        .map((e) => {
          totalLines += e.linesAdded - e.linesDeleted;

          return {
            date: e.date,
            value: totalLines,
          };
        }) ?? []
    );
  });

  linesAddedSeries = computed<ChartDataPoint[]>(
    () =>
      this.resource.value()?.trends.map((e) => ({
        date: e.date,
        value: e.linesAdded,
      })) ?? [],
  );

  linesDeletedSeries = computed<ChartDataPoint[]>(
    () =>
      this.resource.value()?.trends.map((e) => ({
        date: e.date,
        value: -e.linesDeleted,
      })) ?? [],
  );

  fileTypesRows = computed<TableRows[]>(
    () =>
      this.resource.value()?.details?.statistics?.fileTypeStatistics.map((e) => [
        { value: e.fileType, valueType: 'text' },
        { value: e.files, valueType: 'number' },
        { value: e.codeLines, valueType: 'number' },
        { value: e.blankLines, valueType: 'number' },
        { value: e.commentLines, valueType: 'number' },
      ]) ?? [],
  );

  authorsRows = computed<TableRows[]>(
    () =>
      this.resource.value()?.authors.map((e) => [
        { value: e.name, valueType: 'text' },
        { value: e.commits, valueType: 'number' },
        { value: e.filesAsLeadAuthor, valueType: 'number' },
        { value: e.linesAdded, valueType: 'number' },
        { value: e.linesDeleted, valueType: 'number' },
      ]) ?? [],
  );
}
