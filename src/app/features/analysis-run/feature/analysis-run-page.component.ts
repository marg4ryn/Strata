import { Component, inject, computed, debounced } from '@angular/core';

import { AnalysisTargetForm } from '../ui/analysis-target-form/analysis-target-form.component';
import { AnalysisProgressSpinner } from '../ui/analysis-progress-spinner/analysis-progress-spinner.component';
import { AnalysisErrorModal } from '../ui/analysis-error-modal/analysis-error-modal.component';
import { AnalysisUnfinishedModal } from '../ui/analysis-unfinished-modal/analysis-unfinished-modal.component';
import { AnalysisStatus } from '../analysis-run.model';
import { AnalysisRunFacade } from '../analysis-run.facade';

@Component({
  selector: 'app-analysis-run-page',
  imports: [
    AnalysisTargetForm,
    AnalysisProgressSpinner,
    AnalysisErrorModal,
    AnalysisUnfinishedModal,
  ],
  templateUrl: './analysis-run-page.component.html',
  styleUrl: './analysis-run-page.component.scss',
})
export class AnalysisRunPage {
  protected readonly facade = inject(AnalysisRunFacade);

  readonly label = computed(() => {
    const progress = this.facade.progress();
    return progress ? `${AnalysisStatus[progress]}...` : 'Connecting...';
  });

  readonly debouncedLabel = debounced(this.label, 800);

  ngOnInit() {
    this.facade.tryToReconnect();
  }
}
