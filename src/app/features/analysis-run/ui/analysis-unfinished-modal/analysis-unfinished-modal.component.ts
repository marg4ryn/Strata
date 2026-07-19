import { Component, input, output, computed } from '@angular/core';
import { isoDateToLocaleString } from '@app/shared/date-utils/date.utils';
import { ButtonDirective } from '@app/shared/button-directive/button.directive';
import { ConfirmOperationModal } from '@app/shared/confirm-operation-modal/confirm-operation-modal.component';
import { PendingAnalysis } from '../../data-access/analysis-run.model';

@Component({
  selector: 'app-analysis-unfinished-modal',
  imports: [ButtonDirective, ConfirmOperationModal],
  templateUrl: './analysis-unfinished-modal.component.html',
  styleUrl: './analysis-unfinished-modal.component.scss',
})
export class AnalysisUnfinishedModal {
  readonly pendingAnalysis = input<PendingAnalysis | null>();

  readonly resume = output<void>();
  readonly abandon = output<void>();

  showModal: boolean = false;

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

  onCancel(): void {
    this.showModal = false;
  }

  onConfirm(): void {
    this.showModal = false;
    this.abandon.emit();
  }

  resumeAnalysis(): void {
    this.resume.emit();
  }

  abandonAnalysis(): void {
    this.showModal = true;
  }
}
