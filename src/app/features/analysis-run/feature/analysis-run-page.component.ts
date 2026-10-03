import {
  ChangeDetectionStrategy,
  Component,
  inject,
  computed,
  debounced,
  signal,
  effect,
  untracked,
} from '@angular/core';
import { marker } from '@jsverse/transloco-keys-manager/marker';

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

  private loadingShownAt: number | null = null;
  readonly delay = 300;
  readonly minDisplay = 1000;
  showLoading = signal<boolean>(false);

  retryAnalysis(): void {
    this.loadingShownAt = Date.now();
    this.showLoading.set(true);
    this.facade.retryAnalysis();
  }

  constructor() {
    effect((onCleanup) => {
      const isLoading = this.facade.isBusy();

      if (isLoading) {
        if (!untracked(() => this.showLoading())) {
          const id = setTimeout(() => {
            this.showLoading.set(true);
            this.loadingShownAt = Date.now();
          }, this.delay);
          onCleanup(() => clearTimeout(id));
        }
      } else {
        if (this.showLoading() && this.loadingShownAt !== null) {
          const elapsed = Date.now() - this.loadingShownAt;
          const remaining = Math.max(this.minDisplay - elapsed, 0);
          const id = setTimeout(() => {
            this.showLoading.set(false);
            this.loadingShownAt = null;
          }, remaining);
          onCleanup(() => clearTimeout(id));
        } else {
          this.showLoading.set(false);
        }
      }
    });
  }

  readonly labelKey = computed(() => {
    const progress = this.facade.progress();
    return progress ? `${AnalysisStatus[progress]}` : marker('analysisRun.progress.connecting');
  });

  readonly debouncedLabelKey = debounced(this.labelKey, 800);
}
