import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  computed,
  inject,
  DestroyRef,
} from '@angular/core';
import { TranslocoService, TranslocoPipe } from '@ngneat/transloco';

import { ConfirmOperationModalService } from '@app/shared/confirm-operation-modal/service/confirm-operation-modal.service';
import { isoDateToLocaleString } from '@app/shared/date-utils/date.utils';
import { AnalysisHistoryEntry } from '../analysis-history.model';

@Component({
  selector: 'app-analysis-history-item',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'history-item history-item--success',
    '(click)': 'loadAnalysis()',
    tabindex: '0',
    role: 'button',
    '(keydown.enter)': 'loadAnalysis()',
  },
  templateUrl: './analysis-history-item.component.html',
  styleUrl: './analysis-history-item.component.scss',
})
export class AnalysisHistoryItemComponent {
  private readonly confirmModal = inject(ConfirmOperationModalService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly transloco = inject(TranslocoService);

  readonly historyEntry = input.required<AnalysisHistoryEntry>();
  readonly remove = output<string>();
  readonly load = output<string>();

  readonly timestamp = computed(() => new Date(this.historyEntry().completedAt).toLocaleString());

  readonly repoName = computed(() => {
    const repoName = this.historyEntry().target.targetURL.split('/').slice(-2).join('/') || '';
    return repoName?.replace(/\.git$/, '');
  });

  readonly hasDateRange = computed(() => {
    const target = this.historyEntry().target;
    return target.limitRange && target.range !== null;
  });

  readonly rangeLabel = computed(() => {
    const range = this.historyEntry().target.range;
    if (!range) return '';
    return (
      `${isoDateToLocaleString(range.startDate, this.transloco.getActiveLang())}` +
      ` – ${isoDateToLocaleString(range.endDate, this.transloco.getActiveLang())}`
    );
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
