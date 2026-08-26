import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  debounced,
  inject,
} from '@angular/core';
import { TranslocoService, TranslocoPipe } from '@ngneat/transloco';
import { toSignal } from '@angular/core/rxjs-interop';

import { isoDateToLocaleString } from '@app/shared/date-utils/date.utils';
import { PendingAnalysis } from '../../analysis-run.model';

@Component({
  selector: 'app-info-panel',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './info-panel.component.html',
  styleUrl: './info-panel.component.scss',
})
export class InfoPanelComponent {
  private readonly transloco = inject(TranslocoService);

  readonly pendingAnalysis = input<PendingAnalysis | null>();

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  readonly analysisStartDate = computed(() => {
    const startedAt = this.pendingAnalysis()?.startedAt ?? '';
    return new Date(startedAt).toLocaleString(this.activeLang());
  });

  readonly targetURL = computed(() => {
    return this.pendingAnalysis()?.target.targetURL;
  });

  readonly limitRange = computed(() => {
    return this.pendingAnalysis()?.target.limitRange;
  });

  readonly startDate = computed(() => {
    const iso = this.pendingAnalysis()?.target.range?.startDate ?? '';
    return isoDateToLocaleString(iso, this.activeLang());
  });

  readonly endDate = computed(() => {
    const iso = this.pendingAnalysis()?.target.range?.endDate;
    return isoDateToLocaleString(iso, this.activeLang());
  });

  readonly debouncedAnalysisStartDate = debounced(this.analysisStartDate, 800);
  readonly debouncedTargetURL = debounced(this.targetURL, 800);
  readonly debouncedLimitRange = debounced(this.limitRange, 800);
  readonly debouncedStartDate = debounced(this.startDate, 800);
  readonly debouncedEndDate = debounced(this.endDate, 800);
}
