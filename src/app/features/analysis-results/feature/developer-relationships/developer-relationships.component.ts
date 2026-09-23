import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { pageResource } from '../../utils/page-resource/page-resource';
import { ResourcePageComponent } from '../../ui/resource/resource-page/resource-page.component';
import { AnalysisResultsFacade } from '../../analysis-results.facade';
import { ChordDiagramComponent } from '../../ui/charts/chord-diagram/chord-diagram.component';

@Component({
  selector: 'app-developer-relationships',
  imports: [ResourcePageComponent, ChordDiagramComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './developer-relationships.component.scss',
  templateUrl: './developer-relationships.component.html',
})
export class DeveloperRelationshipsComponent {
  private readonly facade = inject(AnalysisResultsFacade);

  id = input.required<string>();

  resource = pageResource(
    () => this.facade.getDeveloperRelationships(this.id()),
    () => this.id(),
  );
}
