import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { AnalysisResultsFacade } from '@app/features/analysis-results/analysis-results.facade';
import { ResourcePageComponent } from '@app/features/analysis-results/ui/resource/resource-page/resource-page.component';
import { pageResource } from '@app/features/analysis-results/utils/page-resource/page-resource.utils';
import { CodeCityStateService } from '../services/code-city-state.service';
import { CodeCityComponent } from '@app/features/analysis-results/ui/code-city/components/code-city.component';
import { PausePlayButtonComponent } from '@app/features/analysis-results/ui/pause-play-button/pause-play-button.component';
import { SearchBarComponent } from '@app/features/analysis-results/ui/search-bar/search-bar.component';
import { RepoExplorerPanelComponent } from '../../repo-explorer-panel/repo-explorer-panel.component';

@Component({
  selector: 'app-code-city-shell',
  imports: [
    NgTemplateOutlet,
    RouterOutlet,
    ResourcePageComponent,
    CodeCityComponent,
    SearchBarComponent,
    PausePlayButtonComponent,
    RepoExplorerPanelComponent,
  ],
  providers: [CodeCityStateService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './code-city-shell.component.scss',
  templateUrl: './code-city-shell.component.html',
})
export class CodeCityShellComponent {
  private readonly facade = inject(AnalysisResultsFacade);
  protected readonly state = inject(CodeCityStateService);

  id = input.required<string>();

  autoRotate = signal<boolean>(false);
  keyboardNavigationActive = signal<boolean>(false);

  resource = pageResource(
    () => this.facade.getCodeCityData(this.id()),
    () => this.id(),
  );
}
