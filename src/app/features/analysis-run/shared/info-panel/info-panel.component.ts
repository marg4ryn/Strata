import { Component, computed, input, debounced } from '@angular/core';
import { PendingAnalysis } from '../../data-access/analysis-run.model';

@Component({
  selector: 'app-info-panel',
  imports: [],
  templateUrl: './info-panel.component.html',
  styleUrl: './info-panel.component.scss',
})
export class InfoPanel {
  pendingAnalysis = input.required<PendingAnalysis | null>();

  analysisStartDate = computed(() => {
    const startedAt = this.pendingAnalysis()?.startedAt ?? '';
    return new Date(startedAt).toLocaleString();
  });

  targetURL = computed(() => {
    return this.pendingAnalysis()?.target.targetURL;
  });

  limitRange = computed(() => {
    return this.pendingAnalysis()?.target.limitRange;
  });

  startDate = computed(() => {
    const date = this.pendingAnalysis()?.target.range?.startDate ?? '';
    return new Date(date).toLocaleDateString();
  });

  endDate = computed(() => {
    const date = this.pendingAnalysis()?.target.range?.endDate ?? '';
    return new Date(date).toLocaleDateString();
  });

  debouncedAnalysisStartDate = debounced(this.analysisStartDate, 800);
  debouncedTargetURL = debounced(this.targetURL, 800);
  debouncedLimitRange = debounced(this.limitRange, 800);
  debouncedStartDate = debounced(this.startDate, 800);
  debouncedEndDate = debounced(this.endDate, 800);
}
