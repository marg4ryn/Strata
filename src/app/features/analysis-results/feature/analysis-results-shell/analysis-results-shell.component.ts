import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { pageResource } from '../../utils/page-resource/page-resource';
import { AnalysisResultsFacade } from '../../analysis-results.facade';
import { MetaBarComponent } from '../../ui/meta-bar/meta-bar.component';
import type { DateRange } from '../../ui/meta-bar/meta-bar.component';

@Component({
  selector: 'app-analysis-results-shell',
  imports: [MetaBarComponent, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './analysis-results-shell.component.scss',
  templateUrl: './analysis-results-shell.component.html',
})
export class AnalysisResultsShellComponent {
  private readonly facade = inject(AnalysisResultsFacade);

  id = input.required<string>();

  resource = pageResource(
    () => this.facade.getRepositorySummary(this.id()),
    () => this.id(),
  );

  repoName = computed(() => {
    const info = this.resource.value()?.details?.info;
    if (!info) return '';
    return `${info?.repositoryOwner}/${info?.repositoryName}`;
  });

  dateRange = computed<DateRange | null>(() => {
    const info = this.resource.value()?.details?.info;
    if (!info) return null;
    return {
      startDate: info?.analysisRangeStartDate,
      endDate: info?.analysisRangeEndDate,
    };
  });
}
