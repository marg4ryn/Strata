import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  computed,
  inject,
  DestroyRef,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';

import { ConfirmOperationService } from '@app/shared/confirm-operation';
import { LocalizedDatePipe } from '@app/shared/pipes';
import type { AnalysisHistoryEntry } from '../analysis-history.model';

@Component({
  selector: 'app-analysis-history-item',
  imports: [TranslocoPipe, LocalizedDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analysis-history-item.component.html',
  styleUrl: './analysis-history-item.component.scss',
})
export class AnalysisHistoryItemComponent {
  private readonly confirmModal = inject(ConfirmOperationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly historyEntry = input.required<AnalysisHistoryEntry>();
  readonly removeEntry = output<string>();
  readonly loadEntry = output<string>();

  readonly repoName = computed(() => {
    const repoName = this.historyEntry().target.targetURL.split('/').slice(-2).join('/') || '';
    return repoName?.replace(/\.git$/, '');
  });

  async loadAnalysis(): Promise<void> {
    const confirmed = await this.confirmModal.confirm(
      this.destroyRef,
      marker('confirmations.loadAnalysis'),
      'confirm',
      { repoName: this.repoName() },
    );
    if (!confirmed) return;
    this.loadEntry.emit(this.historyEntry().analysisId);
  }

  async removeHistoryEntry(event: Event): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirmModal.confirm(
      this.destroyRef,
      marker('confirmations.deleteAnalysis'),
      'danger',
      { repoName: this.repoName() },
    );
    if (!confirmed) return;
    this.removeEntry.emit(this.historyEntry().analysisId);
  }

  handleRemoveHistoryEntryKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') return;
    event.stopPropagation();
  }
}
