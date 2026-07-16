import { Component, computed, input, debounced } from '@angular/core';
import { PendingAnalysis } from '../../data-access/analysis-run.model';

@Component({
  selector: 'app-info-panel',
  imports: [],
  templateUrl: './info-panel.component.html',
  styleUrl: './info-panel.component.scss',
})
export class InfoPanel {
  readonly pendingAnalysis = input<PendingAnalysis | null>();

  readonly analysisStartDate = computed(() => {
    const startedAt = this.pendingAnalysis()?.startedAt ?? '';
    return new Date(startedAt).toLocaleString();
  });

  readonly targetURL = computed(() => {
    return this.pendingAnalysis()?.target.targetURL;
  });

  readonly limitRange = computed(() => {
    return this.pendingAnalysis()?.target.limitRange;
  });

  readonly startDate = computed(() => {
    const date = this.pendingAnalysis()?.target.range?.startDate ?? '';
    return new Date(date).toLocaleDateString();
  });

  readonly endDate = computed(() => {
    const date = this.pendingAnalysis()?.target.range?.endDate ?? '';
    return new Date(date).toLocaleDateString();
  });

  readonly debouncedAnalysisStartDate = debounced(this.analysisStartDate, 800);
  readonly debouncedTargetURL = debounced(this.targetURL, 800);
  readonly debouncedLimitRange = debounced(this.limitRange, 800);
  readonly debouncedStartDate = debounced(this.startDate, 800);
  readonly debouncedEndDate = debounced(this.endDate, 800);
}
