import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import { pageResource } from '../../utils/page-resource/page-resource.utils';
import { CodeCityStateService } from '../code-city-shell/services/code-city-state.service';
import { CodeCityShellColumnDirective } from '../code-city-shell/directives/code-city-shell-column.directive';
import { AnalysisResultsFacade } from '../../analysis-results.facade';

@Component({
  selector: 'app-file-types',
  imports: [CodeCityShellColumnDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './file-types.component.scss',
  templateUrl: './file-types.component.html',
})
export class FileTypesComponent {
  private readonly facade = inject(AnalysisResultsFacade);
  readonly state = inject(CodeCityStateService);

  id = input.required<string>();

  resource = pageResource(
    () => this.facade.getFileExtensions(this.id()),
    () => this.id(),
  );
}
