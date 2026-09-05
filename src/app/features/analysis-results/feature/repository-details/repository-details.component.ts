import { Component, inject, input } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';

import { LocalizedDurationPipe } from '@app/shared/localized-duration-pipe/localized-duration.pipe';
import { LocalizedNumberPipe } from '@app/shared/localized-number-pipe/localized-number.pipe';
import { LocalizedDatePipe } from '@app/shared/localized-date-pipe/localized-date.pipe';
import { ResourcePageComponent } from '../resource-page/resource-page.component';
import { pageResource } from '../../utils/page-resource';
import { AnalysisResultsFacade } from '../../analysis-results.facade';
import { DoughnutChartComponent } from '../../ui/doughnut-chart/doughnut-chart.component';

@Component({
  selector: 'app-repository-details',
  imports: [
    ResourcePageComponent,
    TranslocoPipe,
    LocalizedDatePipe,
    LocalizedNumberPipe,
    LocalizedDurationPipe,
    DoughnutChartComponent,
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
}
