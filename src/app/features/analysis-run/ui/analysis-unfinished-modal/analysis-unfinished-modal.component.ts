import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  inject,
  DestroyRef,
} from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';

import { ConfirmOperationModalService } from '@app/shared/confirm-operation-modal/service/confirm-operation-modal.service';
import { LocalizedDatePipe } from '@app/shared/localized-date-pipe/localized-date.pipe';
import { ButtonDirective } from '@app/shared/button-directive/button.directive';
import { PendingAnalysis } from '../../analysis-run.model';

@Component({
  selector: 'app-analysis-unfinished-modal',
  imports: [ButtonDirective, TranslocoPipe, LocalizedDatePipe],
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

  resumeAnalysis(): void {
    this.resume.emit();
  }

  async abandonAnalysis(): Promise<void> {
    const confirmed = await this.confirmModal.confirm(this.destroyRef);
    if (!confirmed) return;
    this.abandon.emit();
  }
}
