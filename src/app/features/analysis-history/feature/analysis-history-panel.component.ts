import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';

import { AnalysisHistoryFacade } from '../analysis-history.facade';
import { AnalysisHistoryItem } from '../ui/analysis-history-item.component';

@Component({
  selector: 'app-analysis-history-panel',
  imports: [AnalysisHistoryItem, A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analysis-history-panel.component.html',
  styleUrl: './analysis-history-panel.component.scss',
})
export class AnalysisHistoryPanel {
  protected readonly facade = inject(AnalysisHistoryFacade);

  loadAnalysis(analysisId: string): void {
    this.facade.closePanel();
    this.facade.loadAnalysis(analysisId);
  }
}
