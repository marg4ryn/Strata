import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { TranslocoPipe } from '@ngneat/transloco';

import { AnalysisHistoryFacade } from '../analysis-history.facade';
import { AnalysisHistoryItemComponent } from '../ui/analysis-history-item.component';

@Component({
  selector: 'app-analysis-history-panel',
  imports: [AnalysisHistoryItemComponent, A11yModule, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analysis-history-panel.component.html',
  styleUrl: './analysis-history-panel.component.scss',
})
export class AnalysisHistoryPanelComponent {
  protected readonly facade = inject(AnalysisHistoryFacade);

  loadAnalysis(analysisId: string): void {
    this.facade.closePanel();
    this.facade.loadAnalysis(analysisId);
  }
}
