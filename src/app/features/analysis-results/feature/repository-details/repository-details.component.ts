import { Component, inject, input } from '@angular/core';

import { ResourcePageComponent } from '../resource-page/resource-page.component';
import { pageResource } from '../../utils/page-resource';
import { AnalysisResultsFacade } from '../../analysis-results.facade';

@Component({
  selector: 'app-repository-details',
  imports: [ResourcePageComponent],
  templateUrl: './repository-details.component.html',
  styleUrl: './repository-details.component.scss',
})
export class RepositoryDetailsComponent {
  id = input.required<string>();
  private readonly facade = inject(AnalysisResultsFacade);

  resource = pageResource(
    () => this.facade.getRepositorySummary(this.id()),
    () => this.id(),
  );
}
