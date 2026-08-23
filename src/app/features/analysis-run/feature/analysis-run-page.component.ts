import { ChangeDetectionStrategy, Component, inject, computed, debounced } from '@angular/core';

import { AnalysisTargetFormComponent } from '../ui/analysis-target-form/analysis-target-form.component';
import { AnalysisProgressSpinnerComponent } from '../ui/analysis-progress-spinner/analysis-progress-spinner.component';
import { AnalysisErrorModalComponent } from '../ui/analysis-error-modal/analysis-error-modal.component';
import { AnalysisUnfinishedModalComponent } from '../ui/analysis-unfinished-modal/analysis-unfinished-modal.component';
import { AnalysisStatus } from '../analysis-run.model';
import { AnalysisRunFacade } from '../analysis-run.facade';

@Component({
  selector: 'app-analysis-run-page',
  imports: [
    AnalysisTargetFormComponent,
    AnalysisProgressSpinnerComponent,
    AnalysisErrorModalComponent,
    AnalysisUnfinishedModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analysis-run-page.component.html',
  styleUrl: './analysis-run-page.component.scss',
})
export class AnalysisRunPageComponent {
  protected readonly facade = inject(AnalysisRunFacade);

  readonly label = computed(() => {
    const progress = this.facade.progress();
    return progress ? `${AnalysisStatus[progress]}...` : 'Connecting...';
  });

  readonly debouncedLabel = debounced(this.label, 800);
}
