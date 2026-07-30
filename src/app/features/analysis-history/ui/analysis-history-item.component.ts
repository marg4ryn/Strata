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
import { AnalysisHistoryEntry } from '../analysis-history.model';

@Component({
  selector: 'app-analysis-history-item',
  imports: [],
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
export class AnalysisHistoryItem {
  private readonly confirmModal = inject(ConfirmOperationModalService);
  private readonly destroyRef = inject(DestroyRef);

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
    return `${range.startDate} – ${range.endDate}`;
  });

  async loadAnalysis(): Promise<void> {
    const confirmed = await this.confirmModal.confirm(
      this.destroyRef,
      `Load the ${this.repoName()} analysis?`,
      'confirm',
    );
    if (!confirmed) return;
    this.load.emit(this.historyEntry().analysisId);
  }

  async removeHistoryEntry(event: Event): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirmModal.confirm(
      this.destroyRef,
      `Are you sure you want to delete the ${this.repoName()} analysis? This operation cannot be undone.`,
    );
    if (!confirmed) return;
    this.remove.emit(this.historyEntry().analysisId);
  }

  handleRemoveHistoryEntryKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') return;
    event.stopPropagation();
  }
}
