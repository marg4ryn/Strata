import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  computed,
  inject,
  DestroyRef,
} from '@angular/core';

import { ConfirmOperationModalService } from '@app/shared/confirm-operation-modal/service/confirm-operation-modal.service';
import { isoDateToLocaleString } from '@app/shared/date-utils/date.utils';
import { ButtonDirective } from '@app/shared/button-directive/button.directive';
import { PendingAnalysis } from '../../analysis-run.model';

@Component({
  selector: 'app-analysis-unfinished-modal',
  imports: [ButtonDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analysis-unfinished-modal.component.html',
  styleUrl: './analysis-unfinished-modal.component.scss',
})
export class AnalysisUnfinishedModalComponent {
  private readonly confirmModal = inject(ConfirmOperationModalService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pendingAnalysis = input<PendingAnalysis | null>();

  readonly resume = output<void>();
  readonly abandon = output<void>();

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
    const iso = this.pendingAnalysis()?.target.range?.endDate ?? '';
    return isoDateToLocaleString(iso);
  });

  resumeAnalysis(): void {
    this.resume.emit();
  }

  async abandonAnalysis(): Promise<void> {
    const confirmed = await this.confirmModal.confirm(this.destroyRef);
    if (!confirmed) return;
    this.abandon.emit();
  }
}
