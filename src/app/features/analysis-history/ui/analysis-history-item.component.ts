import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  computed,
  inject,
  DestroyRef,
} from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';

import { ConfirmOperationModalService } from '@app/shared/confirm-operation-modal/service/confirm-operation-modal.service';
import { LocalizedDatePipe } from '@app/shared/localized-date-pipe/localized-date.pipe';
import { AnalysisHistoryEntry } from '../analysis-history.model';

@Component({
  selector: 'app-analysis-history-item',
  imports: [TranslocoPipe, LocalizedDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analysis-history-item.component.html',
  styleUrl: './analysis-history-item.component.scss',
})
export class AnalysisHistoryItemComponent {
  private readonly confirmModal = inject(ConfirmOperationModalService);
  private readonly destroyRef = inject(DestroyRef);

  readonly historyEntry = input.required<AnalysisHistoryEntry>();
  readonly remove = output<string>();
  readonly load = output<string>();

  readonly repoName = computed(() => {
    const repoName = this.historyEntry().target.targetURL.split('/').slice(-2).join('/') || '';
    return repoName?.replace(/\.git$/, '');
  });

  async loadAnalysis(): Promise<void> {
    const confirmed = await this.confirmModal.confirm(
      this.destroyRef,
      'confirmations.loadAnalysis',
      'confirm',
      { repoName: this.repoName() },
    );
    if (!confirmed) return;
    this.load.emit(this.historyEntry().analysisId);
  }

  async removeHistoryEntry(event: Event): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirmModal.confirm(
      this.destroyRef,
      'confirmations.deleteAnalysis',
      'danger',
      { repoName: this.repoName() },
    );
    if (!confirmed) return;
    this.remove.emit(this.historyEntry().analysisId);
  }

  handleRemoveHistoryEntryKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') return;
    event.stopPropagation();
  }
}
