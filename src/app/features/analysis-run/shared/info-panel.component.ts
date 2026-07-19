import { Component, computed, input, debounced } from '@angular/core';
import { isoDateToLocaleString } from '@app/shared/date-utils/date.utils';
import { PendingAnalysis } from '../data-access/analysis-run.model';

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
    const iso = this.pendingAnalysis()?.target.range?.startDate ?? '';
    return isoDateToLocaleString(iso);
  });

  readonly endDate = computed(() => {
    const iso = this.pendingAnalysis()?.target.range?.endDate;
    return isoDateToLocaleString(iso);
  });

  readonly debouncedAnalysisStartDate = debounced(this.analysisStartDate, 800);
  readonly debouncedTargetURL = debounced(this.targetURL, 800);
  readonly debouncedLimitRange = debounced(this.limitRange, 800);
  readonly debouncedStartDate = debounced(this.startDate, 800);
  readonly debouncedEndDate = debounced(this.endDate, 800);
}
