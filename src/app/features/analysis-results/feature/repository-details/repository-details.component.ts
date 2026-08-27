import { Component, inject, input } from '@angular/core';

import { AnalysisResultsService } from '../../data-access/analysis-results/analysis-results.service';
import { ResourcePageComponent } from '../resource-page/resource-page.component';
import { pageResource } from '../../utils/page-resource';

@Component({
  selector: 'app-repository-details',
  imports: [ResourcePageComponent],
  templateUrl: './repository-details.component.html',
  styleUrl: './repository-details.component.scss',
})
export class RepositoryDetailsComponent {
  id = input.required<string>();
  private readonly analysisResults = inject(AnalysisResultsService);

  resource = pageResource(
    () => this.analysisResults.getRepositoryDetails(this.id()),
    () => this.id(),
  );
}
